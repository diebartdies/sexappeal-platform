/*
 * scripts/scrape-pkadoras.js
 *
 * ACCURATE per-site adapter for Pkadoras (https://pkadoras.com/).
 *
 * WHY THIS EXISTS
 * ----------------
 * Same rationale as scripts/scrape-simpleescorts.js: a broad whole-page phone
 * REGEX over-collects (the profile's number, the "Mas pkadoras" related rail,
 * ads, chrome). This adapter reads the SPECIFIC contact element on each profile
 * and never regex-scans the whole document.
 *
 * SITE SHAPE (verified live via the browser, 2026-06)
 * ----------------------------------------------------
 * Pkadoras is a WordPress/Oxygen Argentine directory (CABA + Buenos Aires +
 * provinces). Everything on it is Argentine, so the country filter is implicit;
 * we still assert +54 as a guard.
 *   - LISTINGS live at:
 *       /escorts-capital-federal/                  (CABA, paginated /page/N/)
 *       /escorts-capital-federal/<barrio>/
 *       /escorts-buenos-aires/ , /escorts-<provincia>/
 *   - PROFILE URLs are single-segment slugs:  /<slug>/   (e.g. /celeste-milf/)
 *     (province/category pages all start with "escorts-" or "escort_", which we
 *      exclude, so profiles are the remaining one-segment links.)
 *   - REAL CONTACT, read from the profile's own "Enviar WhatsApp" element:
 *       primary:  <a href="https://wa.me/54XXXXXXXXXX?text=...">
 *       fallback: <title> "Escort <Name> en <Barrio> ❤️ <national-number>"
 *     alias  = <h1> (clean display name, e.g. "Celeste Milf")
 *     city   = last breadcrumb segment ("Escorts ► Capital Federal ► Belgrano")
 *              or the "en <Barrio>" in <title>
 *     province = the middle breadcrumb segment ("Capital Federal")
 *     adId   = the URL slug (Pkadoras has no numeric ad id; the slug is unique).
 *
 * SAFETY
 * ------
 * - DRY RUN by default: writes exports/pkadoras-leads.csv and touches NO
 *   database. Pass --save to upsert into potential_professionals.
 * - Small, polite volume: bounded --limit, delays between requests, dedupe.
 * - This is a validation/collection tool. Do NOT mass-run it.
 *
 * USAGE
 * -----
 *   node scripts/scrape-pkadoras.js                 # dry run, 10 profiles -> CSV
 *   node scripts/scrape-pkadoras.js --limit 5       # smaller sample
 *   node scripts/scrape-pkadoras.js --limit 25 --save   # also upsert to DB
 *   node scripts/scrape-pkadoras.js --out exports/foo.csv
 *   node scripts/scrape-pkadoras.js --headful       # watch the browser
 *   node scripts/scrape-pkadoras.js --proxy user:pass@host:port  # hide your IP
 *   node scripts/scrape-pkadoras.js --force         # re-fetch everything
 *
 * Flags:
 *   --limit N        max profiles to OPEN+extract (default 10)
 *   --listings N     max listing pages to crawl during discovery (default 8)
 *   --delay MS       polite delay between profile fetches (default 1500)
 *   --out PATH       output CSV path (default exports/pkadoras-leads.csv)
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

const ORIGIN = 'https://pkadoras.com';
const USER_AGENT =
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36';

// Seed listing pages. The CABA index is paginated (/page/N/); we also crawl a
// few busy barrios. Each yields many profile cards.
const SEED_LISTINGS = [
  '/escorts-capital-federal/',
  '/escorts-capital-federal/page/2/',
  '/escorts-capital-federal/page/3/',
  '/escorts-capital-federal/palermo/',
  '/escorts-capital-federal/microcentro/',
  '/escorts-capital-federal/recoleta/',
  '/escorts-capital-federal/belgrano/',
  '/escorts-buenos-aires/'
];

// Single-segment paths that are NOT escort profiles (site sections / accounts).
const NON_PROFILE_SLUGS = new Set([
  'login',
  'registro',
  'blog',
  'masajistas',
  'clasificados',
  'tutoriales',
  'clientes',
  'comentarios',
  'favoritas',
  'sitemap',
  'directorios',
  'legales',
  'privacidad',
  'contacto',
  'terminos'
]);

// --- selectors / patterns discovered by inspecting the live DOM ---
const SEL_WA_LINK = 'a[href*="wa.me/"]'; // the "Enviar WhatsApp" button on a profile
const RE_WA_PHONE = /wa\.me\/(\d{6,})/i;

function parseArgs(argv) {
  const args = {
    limit: 10,
    listings: 8,
    delayMs: 1500,
    out: path.join('exports', 'pkadoras-leads.csv'),
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

// Is this URL an escort profile (single-segment slug, not a section/category)?
function profileSlugFromUrl(url) {
  try {
    const u = new URL(url, ORIGIN);
    if (!/(^|\.)pkadoras\.com$/i.test(u.hostname)) return null;
    const segs = u.pathname.split('/').filter(Boolean);
    if (segs.length !== 1) return null;
    const slug = segs[0];
    if (slug.startsWith('escorts-') || slug.startsWith('escort_')) return null; // category / province
    if (u.pathname.includes('/tag/')) return null;
    if (NON_PROFILE_SLUGS.has(slug)) return null;
    return slug;
  } catch (_) {
    return null;
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

// Best-effort: dismiss the age / cookie banner if present (non-fatal).
async function dismissBanners(page) {
  try {
    await page.evaluate(() => {
      const btns = Array.from(document.querySelectorAll('button, a'));
      const accept = btns.find((b) =>
        /^(aceptar|accept|entrar|ingresar|continuar|si,?\s*soy\s*mayor|mayor\s*de\s*edad)/i.test(
          (b.textContent || '').trim()
        )
      );
      if (accept) accept.click();
    });
  } catch (_) {}
}

async function collectProfileUrls(page, listingPath, seenSlugs) {
  const found = [];
  try {
    const resp = await page.goto(ORIGIN + listingPath, {
      waitUntil: 'domcontentloaded',
      timeout: 45000
    });
    if (!resp || resp.status() >= 400) return found;
    await dismissBanners(page);
    await sleep(800);
    const hrefs = await page.evaluate(() => Array.from(document.querySelectorAll('a[href]')).map((a) => a.href));
    for (const href of hrefs) {
      const slug = profileSlugFromUrl(href);
      if (!slug || seenSlugs.has(slug)) continue;
      seenSlugs.add(slug);
      found.push(ORIGIN + '/' + slug + '/');
    }
  } catch (_) {}
  return found;
}

async function extractProfile(page, profileUrl) {
  const entry = {
    profileUrl,
    adId: profileSlugFromUrl(profileUrl),
    rawPhone: null,
    phone: null,
    alias: null,
    province: null,
    city: null,
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
    const data = await page.evaluate((waSel) => {
      const out = {};
      const clean = (s) => (s || '').replace(/\s+/g, ' ').trim();
      out.title = document.title || '';
      out.h1 = clean(document.querySelector('h1') ? document.querySelector('h1').textContent : '');
      // primary: the "Enviar WhatsApp" deep link carries wa.me/54XXXXXXXXXX
      const wa = document.querySelector(waSel);
      out.waHref = wa ? wa.getAttribute('href') || '' : '';
      // location: the profile breadcrumb "Escorts ► Capital Federal ► Belgrano"
      const bc = document.querySelector('[class*="breadcrumb"]');
      out.breadcrumb = bc ? clean(bc.textContent) : '';
      return out;
    }, SEL_WA_LINK);

    // alias: the <h1> is the clean display name.
    entry.alias = data.h1 || null;

    // province / city from the breadcrumb. Format: "Escorts ► <Province> ► <City>"
    // (the ► separators are sometimes rendered as different glyphs, so split on
    // any non-alphanumeric run between known segments).
    if (data.breadcrumb) {
      const parts = data.breadcrumb
        .split(/[►▶>\u25BA\u00BB|]+/)
        .map((s) => s.trim())
        .filter(Boolean);
      // drop a leading "Escorts" crumb
      const geo = parts.filter((p) => !/^escorts$/i.test(p));
      if (geo.length >= 1) entry.province = geo[0] || null;
      if (geo.length >= 2) entry.city = geo[geo.length - 1] || null;
    }
    // city fallback: title "Escort <Name> en <Barrio> ❤️ <number>"
    if (!entry.city && data.title) {
      const m = data.title.match(/\sen\s+(.+?)\s*(?:[\u2764\u2665❤️]|[-|]|\d)/u);
      if (m) entry.city = m[1].trim();
    }

    // Resolve the raw contact number from the SPECIFIC WhatsApp element first,
    // then the title (which is prefixed with the national number).
    let raw = null;
    const mWa = data.waHref && data.waHref.match(RE_WA_PHONE);
    if (mWa) raw = mWa[1];
    if (!raw && data.title) {
      const mTitle = data.title.match(/(\d{8,})/);
      if (mTitle) raw = mTitle[1];
    }
    entry.rawPhone = raw;

    if (!raw) {
      entry.error = 'no contact element found';
      return entry;
    }

    // ARGENTINA GUARD: contacts are exposed as 54 + 10 national digits (wa.me)
    // or the bare 10-digit national form (title). Reject anything else.
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
    `[pkadoras] start — limit=${args.limit}, listings<=${args.listings}, delay=${args.delayMs}ms, mode=${
      args.save ? 'SAVE (DB upsert)' : 'DRY RUN (CSV only)'
    }`
  );

  // IP-SAFE: resolve the proxy (CLI --proxy or SCRAPE_PROXY env) and warn loudly
  // if none is set, since unproxied requests would expose the operator's IP.
  const proxy = parseProxy(args, process.env);
  if (proxy) {
    console.log(`[pkadoras] routing through proxy ${proxy.server}`);
  } else {
    console.log(
      '[pkadoras] WARNING: no proxy set — requests go out on your PUBLIC IP. Pass --proxy host:port or set SCRAPE_PROXY to hide it.'
    );
  }

  // RE-RUN SAFE: read what a previous run already captured so we can skip it.
  const existing = loadExisting(args.out);
  const skipPhones = new Set();
  if (args.force) {
    if (existing.rows.length) console.log(`[pkadoras] --force: ignoring ${existing.rows.length} existing rows, re-fetching all`);
  } else {
    for (const p of existing.phones) skipPhones.add(p);
    if (existing.rows.length) {
      console.log(`[pkadoras] incremental: ${existing.rows.length} already-captured ads will be skipped (use --force to re-fetch all)`);
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
      userDataDir: path.join(cacheDir, 'pptr-pkadoras'),
      args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage', ...proxyLaunchArgs(proxy)]
    });
  } catch (e) {
    console.error('[pkadoras] FAILED to launch Chromium:', e.message);
    process.exit(1);
  }

  const results = [];
  try {
    const page = await newPolitePage(browser, proxy);

    console.log(`[pkadoras] opening home: ${ORIGIN}/`);
    const home = await page.goto(ORIGIN + '/', { waitUntil: 'domcontentloaded', timeout: 60000 });
    console.log(`[pkadoras] home HTTP ${home && home.status()} — ${await page.title()}`);
    await dismissBanners(page);

    // 1) DISCOVERY ----------------------------------------------------------
    const listingUrls = SEED_LISTINGS.slice(0, Math.max(args.listings, 1));
    console.log(`[pkadoras] discovery across up to ${listingUrls.length} listing pages`);

    const seenSlugs = new Set();
    // INCREMENTAL: pre-seed the dedupe set with already-captured slugs so they
    // are never re-discovered/re-opened (unless --force).
    if (!args.force) for (const id of existing.ids) seenSlugs.add(id);
    const profileUrls = [];
    for (const listing of listingUrls) {
      if (profileUrls.length >= args.limit) break;
      const found = await collectProfileUrls(page, listing, seenSlugs);
      if (found.length) {
        console.log(`[pkadoras]   ${listing} -> +${found.length} new profiles (total ${profileUrls.length + found.length})`);
      }
      profileUrls.push(...found);
      await sleep(600);
    }

    const targets = profileUrls.slice(0, args.limit);
    console.log(`[pkadoras] discovered ${profileUrls.length} unique profiles; extracting first ${targets.length}`);

    // 2) EXTRACTION ---------------------------------------------------------
    for (let i = 0; i < targets.length; i++) {
      const entry = await extractProfile(page, targets[i]);
      // INCREMENTAL: a re-posted ad (new slug, same phone) — skip without counting.
      if (!args.force && entry.phone && skipPhones.has(entry.phone)) {
        console.log(`[pkadoras] (${i + 1}/${targets.length}) [DUP ] ${entry.alias || '(no alias)'} | already captured — skipping`);
        if (i < targets.length - 1) await sleep(args.delayMs);
        continue;
      }
      const tag = entry.phone ? 'OK ' : 'SKIP';
      console.log(
        `[pkadoras] (${i + 1}/${targets.length}) [${tag}] ${entry.alias || '(no alias)'} | ${entry.city ||
          '(no city)'} | ${entry.phone || entry.error}`
      );
      results.push(entry);
      if (i < targets.length - 1) await sleep(args.delayMs);
    }
  } catch (e) {
    console.error('[pkadoras] FATAL:', e.message);
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

  console.log('\n================ PKADORAS RESULTS ================');
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
  console.log(`\n[pkadoras] new this run: ${newRows.length}, total in file: ${totalInFile} -> ${outPath}`);

  // 5) OPTIONAL DB SAVE -----------------------------------------------------
  if (args.save) {
    if (!newRows.length) {
      console.log('[pkadoras] --save given but no NEW leads to upsert; skipping DB.');
    } else {
      console.log(`[pkadoras] --save: upserting ${newRows.length} NEW leads into potential_professionals...`);
      try {
        const { inserted, existed } = await saveToDb(newRows);
        console.log(`[pkadoras] DB done — inserted ${inserted}, already existed ${existed}`);
      } catch (e) {
        console.error('[pkadoras] DB save failed:', e.message);
        process.exitCode = 1;
      }
    }
  } else {
    console.log('[pkadoras] DRY RUN — no database connection opened. Re-run with --save to upsert.');
  }
})();
