/*
 * scripts/scrape-bairesgirls.js
 *
 * ACCURATE per-site adapter for BairesGirls (https://www.bairesgirls.net/).
 *
 * WHY THIS EXISTS
 * ----------------
 * Same rationale as scripts/scrape-simpleescorts.js: the legacy
 * public/js/scrape_phones.js runs a broad Argentine-phone REGEX over the WHOLE
 * page, which on a profile page over-collects (the profile's number, the
 * "Mas pkadoras"/related-profile rail, ads, site chrome). This adapter instead
 * reads the SPECIFIC contact element on each profile and never regex-scans the
 * whole document.
 *
 * SITE SHAPE (verified live via the browser, 2026-06)
 * ----------------------------------------------------
 * BairesGirls is a Buenos Aires (CABA + GBA) directory — everything on it is
 * Argentine, so the country filter is implicit; we still assert +54 as a guard.
 *   - LISTINGS live at:
 *       /escorts/capital-federal-caba/<barrio>/      (CABA neighbourhoods)
 *       /escorts/gran-buenos-aires-gba/<zona>/        (Greater Buenos Aires)
 *   - PROFILE URLs match:  /escorts/escort-<slug>-<id>/   (id = trailing digits)
 *   - REAL CONTACT, read from the profile's own contact elements:
 *       primary:  <a href="https://api.whatsapp.com/send?phone=54XXXXXXXXXX&text=...">
 *       fallback: <a href="tel:+54XXXXXXXXXX">
 *       fallback: <meta name="description"> / <title> (both prefixed "Llamala ...")
 *     alias  = schema.org "person" JSON-LD name (fallback <h1>)
 *     city   = the barrio/zona of the listing the profile was found on
 *              (fallback: og:title "... - <Barrio> Escorts")
 *     province = "Capital Federal" (CABA listings) or "Buenos Aires" (GBA)
 *     adId   = trailing -<id> in the URL.
 *
 * SAFETY
 * ------
 * - DRY RUN by default: writes exports/bairesgirls-leads.csv and touches NO
 *   database. Pass --save to upsert into potential_professionals.
 * - Small, polite volume: bounded --limit, delays between requests, dedupe.
 * - This is a validation/collection tool. Do NOT mass-run it.
 *
 * USAGE
 * -----
 *   node scripts/scrape-bairesgirls.js                 # dry run, 10 profiles -> CSV
 *   node scripts/scrape-bairesgirls.js --limit 5       # smaller sample
 *   node scripts/scrape-bairesgirls.js --limit 25 --save   # also upsert to DB
 *   node scripts/scrape-bairesgirls.js --out exports/foo.csv
 *   node scripts/scrape-bairesgirls.js --headful       # watch the browser
 *   node scripts/scrape-bairesgirls.js --proxy user:pass@host:port  # hide your IP
 *   node scripts/scrape-bairesgirls.js --force         # re-fetch everything
 *
 * Flags:
 *   --limit N        max profiles to OPEN+extract (default 10)
 *   --listings N     max listing pages to crawl during discovery (default 8)
 *   --delay MS       polite delay between profile fetches (default 1500)
 *   --out PATH       output CSV path (default exports/bairesgirls-leads.csv)
 *   --save           CONNECT to Mongo and upsert leads (otherwise dry run)
 *   --headful        launch a visible browser (debugging)
 *   --proxy VALUE    route through a proxy (host:port | user:pass@host:port);
 *                    also reads the SCRAPE_PROXY env var. Hides your public IP.
 *   --force          ignore the existing CSV and re-fetch ALL profiles
 *                    (default: INCREMENTAL — skip already-captured ads)
 */

const fs = require('fs');
const path = require('path');
const puppeteer = require('puppeteer');
const { loadExisting, parseProxy, proxyLaunchArgs } = require('./lib/scrapeCommon');

// Reuse the proven Argentine-mobile normaliser from the import pipeline so the
// numbers this adapter emits are byte-for-byte what import_leads.js would store.
let normalizePhone;
try {
  ({ normalizePhone } = require('../import_leads'));
} catch (_) {
  normalizePhone = null;
}
if (typeof normalizePhone !== 'function') {
  // Minimal local fallback (kept consistent with import_leads.js rules).
  normalizePhone = function (raw) {
    const digits = String(raw == null ? '' : raw).replace(/[^0-9]/g, '');
    if (!digits) return { ok: false, reason: 'empty' };
    let national;
    if (digits.length >= 12 && digits.startsWith('54')) {
      national = digits.startsWith('549') ? digits.slice(3) : digits.slice(2);
    } else if (digits.startsWith('0')) {
      national = digits.replace(/^0+/, '');
    } else {
      national = digits;
    }
    if (national.length !== 10) return { ok: false, reason: `length ${national.length}` };
    if (new Set(national.split('')).size <= 2) return { ok: false, reason: 'placeholder' };
    return { ok: true, phone: '549' + national };
  };
}

const ORIGIN = 'https://www.bairesgirls.net';
const USER_AGENT =
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36';

// Seed listing pages (the busiest CABA neighbourhoods + a couple of GBA zones).
// Each yields many profile cards; crawling several covers the directory well.
const SEED_LISTINGS = [
  '/escorts/capital-federal-caba/microcentro/',
  '/escorts/capital-federal-caba/palermo/',
  '/escorts/capital-federal-caba/recoleta/',
  '/escorts/capital-federal-caba/tribunales/',
  '/escorts/capital-federal-caba/congreso/',
  '/escorts/capital-federal-caba/belgrano/',
  '/escorts/capital-federal-caba/caballito/',
  '/escorts/capital-federal-caba/san-telmo/',
  '/escorts/gran-buenos-aires-gba/zona-norte/',
  '/escorts/gran-buenos-aires-gba/zona-sur/',
  '/escorts/gran-buenos-aires-gba/zona-oeste/'
];

// --- selectors / patterns discovered by inspecting the live DOM ---
const SEL_PROFILE_LINK = 'a[href*="/escorts/escort-"]'; // listing card -> profile URL
const RE_AD_ID = /\/escorts\/escort-.+-(\d+)\/?$/i;
const RE_WA_PHONE = /[?&]phone=(\d{6,})/i; // api.whatsapp.com/send?phone=54...

function parseArgs(argv) {
  const args = {
    limit: 10,
    listings: 8,
    delayMs: 1500,
    out: path.join('exports', 'bairesgirls-leads.csv'),
    save: false,
    headful: false,
    proxy: null,
    force: false
  };
  for (let i = 2; i < argv.length; i++) {
    const a = argv[i];
    if (a === '--limit') args.limit = parseInt(argv[++i], 10) || args.limit;
    else if (a === '--listings') args.listings = parseInt(argv[++i], 10) || args.listings;
    else if (a === '--delay') args.delayMs = parseInt(argv[++i], 10) || args.delayMs;
    else if (a === '--out') args.out = argv[++i] || args.out;
    else if (a === '--save') args.save = true;
    else if (a === '--headful') args.headful = true;
    else if (a === '--proxy') args.proxy = argv[++i] || args.proxy;
    else if (a === '--force') args.force = true;
  }
  return args;
}

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

function adIdFromUrl(url) {
  try {
    const m = new URL(url, ORIGIN).pathname.match(RE_AD_ID);
    return m ? m[1] : null;
  } catch (_) {
    const m = String(url).match(RE_AD_ID);
    return m ? m[1] : null;
  }
}

// Turn a barrio/zona slug into a display name, e.g. "san-telmo" -> "San Telmo".
function slugToName(slug) {
  return String(slug || '')
    .split('-')
    .filter(Boolean)
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(' ');
}

// Derive { province, city } from the listing path the profile was found on.
function geoFromListing(listingPath) {
  try {
    const segs = new URL(listingPath, ORIGIN).pathname.split('/').filter(Boolean);
    // ['escorts', 'capital-federal-caba'|'gran-buenos-aires-gba', '<barrio/zona>']
    if (segs[0] !== 'escorts' || segs.length < 3) return { province: null, city: null };
    const region = segs[1];
    const city = slugToName(segs[2]);
    if (region === 'capital-federal-caba') return { province: 'Capital Federal', city };
    if (region === 'gran-buenos-aires-gba') return { province: 'Buenos Aires', city };
    return { province: null, city };
  } catch (_) {
    return { province: null, city: null };
  }
}

function csvEscape(v) {
  const s = String(v == null ? '' : v);
  return /[",\r\n]/.test(s) ? '"' + s.replace(/"/g, '""') + '"' : s;
}

async function newPolitePage(browser, proxy) {
  const page = await browser.newPage();
  // IP-SAFE: authenticate to the proxy (if it needs credentials) before any nav.
  if (proxy && proxy.username) {
    await page.authenticate({ username: proxy.username, password: proxy.password || '' });
  }
  await page.setUserAgent(USER_AGENT);
  await page.setViewport({ width: 1366, height: 900 });
  return page;
}

// Best-effort: dismiss the +18 age / cookie banner if present (non-fatal).
async function dismissBanners(page) {
  try {
    await page.evaluate(() => {
      const btns = Array.from(document.querySelectorAll('button, a'));
      const accept = btns.find((b) =>
        /^(\+?18\s*entrar|aceptar|accept|entrar|ingresar|continuar|si,?\s*soy\s*mayor)/i.test(
          (b.textContent || '').trim()
        )
      );
      if (accept) accept.click();
    });
  } catch (_) {}
}

async function collectProfileUrls(page, listingPath, seenAdIds, geoByUrl) {
  const found = [];
  try {
    const resp = await page.goto(ORIGIN + listingPath, {
      waitUntil: 'domcontentloaded',
      timeout: 45000
    });
    if (!resp || resp.status() >= 400) return found;
    await dismissBanners(page);
    await sleep(800);
    const hrefs = await page.evaluate((sel) => {
      return Array.from(document.querySelectorAll(sel)).map((a) => a.href);
    }, SEL_PROFILE_LINK);
    const geo = geoFromListing(listingPath);
    for (const href of hrefs) {
      const id = adIdFromUrl(href);
      if (!id || seenAdIds.has(id)) continue;
      seenAdIds.add(id);
      const clean = href.split('#')[0].split('?')[0];
      geoByUrl.set(clean, geo);
      found.push(clean);
    }
  } catch (_) {}
  return found;
}

async function extractProfile(page, profileUrl, geoHint) {
  const entry = {
    profileUrl,
    adId: adIdFromUrl(profileUrl),
    rawPhone: null,
    phone: null,
    alias: null,
    province: (geoHint && geoHint.province) || null,
    city: (geoHint && geoHint.city) || null,
    source: null,
    status: null,
    error: null,
    argentina: false
  };
  try {
    const r = await page.goto(profileUrl, { waitUntil: 'domcontentloaded', timeout: 45000 });
    entry.status = r && r.status();
    if (!r || r.status() >= 400) {
      entry.error = `HTTP ${entry.status}`;
      return entry;
    }
    await dismissBanners(page);
    const data = await page.evaluate(() => {
      const out = {};
      const clean = (s) => (s || '').replace(/\s+/g, ' ').trim();
      out.title = document.title || '';
      out.h1 = clean(document.querySelector('h1') ? document.querySelector('h1').textContent : '');
      // primary: the WhatsApp deep-link button carries phone=54XXXXXXXXXX
      const wa = document.querySelector('a[href*="api.whatsapp.com/send"], a[href*="wa.me/"]');
      out.waHref = wa ? wa.getAttribute('href') || '' : '';
      // fallback: tel: link
      const tel = document.querySelector('a[href^="tel:"]');
      out.tel = tel ? tel.getAttribute('href') || '' : '';
      // alias: schema.org "person" JSON-LD name is the cleanest ("Gema Fenix")
      out.personName = '';
      out.ogTitle = '';
      for (const s of Array.from(document.querySelectorAll('script[type="application/ld+json"]'))) {
        const txt = s.textContent || '';
        if (/"@type"\s*:\s*"person"/i.test(txt)) {
          const m = txt.match(/"name"\s*:\s*"([^"]+)"/i);
          if (m) {
            out.personName = clean(m[1]);
            break;
          }
        }
      }
      const og = document.querySelector('meta[property="og:title"]');
      out.ogTitle = og ? clean(og.getAttribute('content')) : '';
      const desc = document.querySelector('meta[name="description"]');
      out.desc = desc ? clean(desc.getAttribute('content')) : '';
      return out;
    });

    // alias: prefer the JSON-LD person name, then strip "Escort " from <h1>.
    entry.alias =
      data.personName ||
      (data.h1 ? data.h1.replace(/^escort\s+/i, '').replace(/\s+escort.*$/i, '').trim() : null) ||
      null;

    // city fallback: og:title is "Escort <Name>  - <Barrio> Escorts".
    if (!entry.city && data.ogTitle) {
      const m = data.ogTitle.match(/-\s*([^-]+?)\s+escorts\s*$/i);
      if (m) entry.city = m[1].trim();
    }

    // Resolve the raw contact number from the SPECIFIC contact elements:
    // WhatsApp phone= -> tel: -> description/title "Llamala ...".
    let raw = null;
    const mWa = data.waHref && data.waHref.match(RE_WA_PHONE);
    if (mWa) raw = mWa[1];
    if (!raw && data.waHref) {
      // wa.me/<digits> form
      const mWaMe = data.waHref.match(/wa\.me\/(\d{6,})/i);
      if (mWaMe) raw = mWaMe[1];
    }
    if (!raw && data.tel) raw = data.tel.replace(/[^0-9]/g, '');
    if (!raw && data.desc) {
      const mDesc = data.desc.match(/(\d[\d\s-]{7,}\d)/);
      if (mDesc) raw = mDesc[1].replace(/[^0-9]/g, '');
    }
    if (!raw && data.title) {
      const mTitle = data.title.match(/(\d[\d\s-]{7,}\d)/);
      if (mTitle) raw = mTitle[1].replace(/[^0-9]/g, '');
    }
    entry.rawPhone = raw;

    if (!raw) {
      entry.error = 'no contact element found';
      return entry;
    }

    // ARGENTINA GUARD: contacts are exposed as +54 (54 + 10 national digits) or
    // the bare 10-digit national form. Reject anything that does not normalise
    // to an Argentine 549 + 10 number.
    const digits = raw.replace(/[^0-9]/g, '');
    const looksArg = digits.startsWith('54') || digits.length === 10;
    const norm = normalizePhone(raw);
    if (norm.ok && looksArg) {
      entry.phone = norm.phone; // 549 + 10 national digits
      entry.argentina = true;
    } else {
      entry.error = norm.ok ? `non-AR number (${digits.slice(0, 4)}...)` : `unnormalisable (${norm.reason})`;
    }
  } catch (err) {
    entry.error = err.message;
  }
  return entry;
}

async function saveToDb(rows) {
  require('dotenv').config();
  const mongoose = require('mongoose');
  const connectDB = require('../config/database');
  const PotentialProfessional = require('../models/PotentialProfessional');

  await connectDB();
  let inserted = 0;
  let existed = 0;
  for (const row of rows) {
    const setOnInsert = { phone: row.phone, sourceUrl: row.profileUrl, status: 'pending' };
    if (row.province) setOnInsert.province = row.province;
    if (row.city) setOnInsert.city = row.city;
    const update = { $setOnInsert: setOnInsert };
    if (row.alias) update.$set = { alias: row.alias };
    const res = await PotentialProfessional.updateOne({ phone: row.phone }, update, { upsert: true });
    if (res.upsertedCount && res.upsertedCount > 0) inserted++;
    else existed++;
  }
  await mongoose.disconnect();
  return { inserted, existed };
}

(async () => {
  const args = parseArgs(process.argv);
  console.log(
    `[bairesgirls] start — limit=${args.limit}, listings<=${args.listings}, delay=${args.delayMs}ms, mode=${
      args.save ? 'SAVE (DB upsert)' : 'DRY RUN (CSV only)'
    }`
  );

  // IP-SAFE: resolve the proxy (CLI --proxy or SCRAPE_PROXY env) and warn loudly
  // if none is set, since unproxied requests would expose the operator's IP.
  const proxy = parseProxy(args, process.env);
  if (proxy) {
    console.log(`[bairesgirls] routing through proxy ${proxy.server}`);
  } else {
    console.log(
      '[bairesgirls] WARNING: no proxy set — requests go out on your PUBLIC IP. Pass --proxy host:port or set SCRAPE_PROXY to hide it.'
    );
  }

  // RE-RUN SAFE: read what a previous run already captured so we can skip it.
  const existing = loadExisting(args.out);
  const skipPhones = new Set();
  if (args.force) {
    if (existing.rows.length) console.log(`[bairesgirls] --force: ignoring ${existing.rows.length} existing rows, re-fetching all`);
  } else {
    for (const p of existing.phones) skipPhones.add(p);
    if (existing.rows.length) {
      console.log(`[bairesgirls] incremental: ${existing.rows.length} already-captured ads will be skipped (use --force to re-fetch all)`);
    }
  }

  let browser;
  try {
    // Some Windows setups deny mkdtemp in the system TEMP (EPERM). Force
    // Chromium's temp + profile into a writable project-local folder.
    const cacheDir = path.resolve('.cache');
    const tmpDir = path.join(cacheDir, 'tmp');
    try { fs.mkdirSync(tmpDir, { recursive: true }); } catch (_) {}
    process.env.TMPDIR = process.env.TMP = process.env.TEMP = tmpDir;
    browser = await puppeteer.launch({
      headless: args.headful ? false : 'new',
      userDataDir: path.join(cacheDir, 'pptr-bairesgirls'),
      args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage', ...proxyLaunchArgs(proxy)]
    });
  } catch (e) {
    console.error('[bairesgirls] FAILED to launch Chromium:', e.message);
    process.exit(1);
  }

  const results = [];
  try {
    const page = await newPolitePage(browser, proxy);

    console.log(`[bairesgirls] opening home: ${ORIGIN}/`);
    const home = await page.goto(ORIGIN + '/', { waitUntil: 'domcontentloaded', timeout: 60000 });
    console.log(`[bairesgirls] home HTTP ${home && home.status()} — ${await page.title()}`);
    await dismissBanners(page);

    // 1) DISCOVERY ----------------------------------------------------------
    const listingUrls = SEED_LISTINGS.slice(0, Math.max(args.listings, 1));
    console.log(`[bairesgirls] discovery across up to ${listingUrls.length} listing pages`);

    const seenAdIds = new Set();
    // INCREMENTAL: pre-seed the dedupe set with already-captured ad ids so they
    // are never re-discovered/re-opened (unless --force).
    if (!args.force) for (const id of existing.ids) seenAdIds.add(id);
    const geoByUrl = new Map();
    const profileUrls = [];
    for (const listing of listingUrls) {
      if (profileUrls.length >= args.limit) break;
      const found = await collectProfileUrls(page, listing, seenAdIds, geoByUrl);
      if (found.length) {
        console.log(`[bairesgirls]   ${listing} -> +${found.length} new ads (total ${profileUrls.length + found.length})`);
      }
      profileUrls.push(...found);
      await sleep(600);
    }

    const targets = profileUrls.slice(0, args.limit);
    console.log(`[bairesgirls] discovered ${profileUrls.length} unique ads; extracting first ${targets.length}`);

    // 2) EXTRACTION ---------------------------------------------------------
    for (let i = 0; i < targets.length; i++) {
      const entry = await extractProfile(page, targets[i], geoByUrl.get(targets[i]));
      // INCREMENTAL: a re-posted ad (new id, same phone) — skip without counting.
      if (!args.force && entry.phone && skipPhones.has(entry.phone)) {
        console.log(`[bairesgirls] (${i + 1}/${targets.length}) [DUP ] ${entry.alias || '(no alias)'} | already captured — skipping`);
        if (i < targets.length - 1) await sleep(args.delayMs);
        continue;
      }
      const tag = entry.phone ? 'OK ' : 'SKIP';
      console.log(
        `[bairesgirls] (${i + 1}/${targets.length}) [${tag}] ${entry.alias || '(no alias)'} | ${entry.city ||
          '(no city)'} | ${entry.phone || entry.error}`
      );
      results.push(entry);
      if (i < targets.length - 1) await sleep(args.delayMs);
    }
  } catch (e) {
    console.error('[bairesgirls] FATAL:', e.message);
  } finally {
    if (browser) await browser.close();
  }

  // 3) DEDUPE + REPORT ------------------------------------------------------
  const passed = [];
  const seenPhones = new Set();
  let dupes = 0;
  for (const r of results) {
    if (!r.phone) continue;
    if (seenPhones.has(r.phone)) {
      dupes++;
      continue;
    }
    seenPhones.add(r.phone);
    passed.push(r);
  }
  const rejected = results.filter((r) => !r.phone);

  console.log('\n================ BAIRESGIRLS RESULTS ================');
  console.log(`Profiles opened:            ${results.length}`);
  console.log(`Passed Argentina filter:    ${passed.length} (unique phones)`);
  console.log(`Duplicates collapsed:       ${dupes}`);
  console.log(`Rejected / no contact:      ${rejected.length}`);
  if (rejected.length) {
    const reasons = {};
    rejected.forEach((r) => (reasons[r.error || 'unknown'] = (reasons[r.error || 'unknown'] || 0) + 1));
    console.log('  reject reasons:', JSON.stringify(reasons));
  }
  console.log('\n--- Sample extracted rows ---');
  passed.slice(0, 15).forEach((r) => {
    const loc = [r.province, r.city].filter(Boolean).join(' / ');
    console.log(`  ${r.phone}  ${(r.alias || '').slice(0, 24).padEnd(24)}  ${loc}   <- ${r.profileUrl}`);
  });

  // 4) WRITE CSV (always) ---------------------------------------------------
  // RE-RUN SAFE: only rows whose phone is NEW (not already in the file) count as
  // "new this run". With --force we treat everything as new and rewrite fresh.
  const newRows = args.force ? passed : passed.filter((r) => !existing.phones.has(r.phone));
  const outPath = path.resolve(args.out);
  fs.mkdirSync(path.dirname(outPath), { recursive: true });
  const header = 'Phone,Alias,Source URL,Status,Province,City,AdId,ProfileUrl';
  const lines = [header];
  // Preserve previously-captured rows verbatim (unless --force), then APPEND the
  // new ones — so a re-run never loses earlier leads, only adds.
  if (!args.force) for (const raw of existing.rows) lines.push(raw);
  for (const r of newRows) {
    lines.push(
      [r.phone, r.alias || '', ORIGIN, 'pending', r.province || '', r.city || '', r.adId || '', r.profileUrl]
        .map(csvEscape)
        .join(',')
    );
  }
  fs.writeFileSync(outPath, lines.join('\n') + '\n', 'utf8');
  const totalInFile = lines.length - 1;
  console.log(`\n[bairesgirls] new this run: ${newRows.length}, total in file: ${totalInFile} -> ${outPath}`);

  // 5) OPTIONAL DB SAVE -----------------------------------------------------
  if (args.save) {
    if (!newRows.length) {
      console.log('[bairesgirls] --save given but no NEW leads to upsert; skipping DB.');
    } else {
      console.log(`[bairesgirls] --save: upserting ${newRows.length} NEW leads into potential_professionals...`);
      try {
        const { inserted, existed } = await saveToDb(newRows);
        console.log(`[bairesgirls] DB done — inserted ${inserted}, already existed ${existed}`);
      } catch (e) {
        console.error('[bairesgirls] DB save failed:', e.message);
        process.exitCode = 1;
      }
    }
  } else {
    console.log('[bairesgirls] DRY RUN — no database connection opened. Re-run with --save to upsert.');
  }
})();
