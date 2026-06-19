/*
 * scripts/scrape-sexysabor.js
 *
 * ACCURATE per-site adapter for SexySabor (https://www.sexysabor.com/).
 *
 * WHY THIS EXISTS
 * ----------------
 * Same motivation as scripts/scrape-simpleescorts.js: the legacy
 * public/js/scrape_phones.js runs a broad Argentine-phone REGEX over the WHOLE
 * page HTML, which over-collects. This adapter instead reads the SPECIFIC
 * contact element on each profile.
 *
 * SexySabor is an Argentina-only WordPress directory, so there is NO country
 * filter to apply — every profile is Argentine. The accuracy win here is
 * reading the profile's OWN WhatsApp contact element rather than the page text.
 *
 * SITE STRUCTURE (confirmed live)
 * -------------------------------
 *   - Listings live at /escorts-<location>/  (e.g. /escorts-buenos-aires/,
 *     /escorts-palermo/, /escorts-mar-del-plata/, ...).
 *   - Profiles are ROOT-LEVEL WordPress posts at /<slug>/  (e.g. /tamara-2/,
 *     /mar/). NOTE: they are NOT under /escort/<slug>/ — /escort/ is just an
 *     index page. Listing cards link to the post via the title/thumbnail anchor
 *     (a[title^="Permanent Link to"], also reachable as the card's h3 > a).
 *
 * WHAT THIS DOES:
 *   1. PROFILE DISCOVERY = crawl /escorts-<location>/ listing pages and read
 *      each card's permalink anchor -> profile URL. Deduped by slug. The
 *      listing's <location> is carried along as the city/zone context (like
 *      simpleescorts captures city from context).
 *   2. REAL CONTACT EXTRACTION = on each profile we read the SPECIFIC contact
 *      element, not the whole page:
 *        - primary:  <a href="https://api.whatsapp.com/send?phone=54XXXXXXXXXXX&text=...">
 *                    (also handles web.whatsapp.com/send and wa.me forms)
 *        - fallback: <a href="tel:...">
 *      alias    = <h1> with the leading "Escorts " label stripped (the profile
 *                 name, NOT the site title).
 *      location = parsed from the post <title> "<Name> en <Location> | ..." ,
 *                 then the post category link (/escorts-<loc>/), then the
 *                 listing-context location captured during discovery.
 *
 * SAFETY
 * ------
 * - DRY RUN by default: writes exports/sexysabor-leads.csv and touches NO
 *   database. Pass --save to upsert into potential_professionals.
 * - Small, polite volume: bounded --limit, delays between requests, dedupe.
 * - This is a validation/collection tool. Do NOT mass-run it.
 *
 * USAGE
 * -----
 *   node scripts/scrape-sexysabor.js                  # dry run, 10 profiles -> CSV
 *   node scripts/scrape-sexysabor.js --limit 5        # smaller sample
 *   node scripts/scrape-sexysabor.js --limit 25 --save    # also upsert to DB
 *   node scripts/scrape-sexysabor.js --out exports/foo.csv
 *   node scripts/scrape-sexysabor.js --headful        # watch the browser
 *   node scripts/scrape-sexysabor.js --proxy user:pass@host:port  # hide your IP
 *   node scripts/scrape-sexysabor.js --force          # re-fetch everything
 *
 * Flags:
 *   --limit N        max profiles to OPEN+extract (default 10)
 *   --listings N     max listing pages to crawl during discovery (default 8)
 *   --delay MS       polite delay between profile fetches (default 1500)
 *   --out PATH       output CSV path (default exports/sexysabor-leads.csv)
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

const ORIGIN = 'https://www.sexysabor.com';
const USER_AGENT =
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36';

// Seed listing pages (busy Argentine cities/zones). Discovery also reads more
// /escorts-<location>/ links from each listing's own nav, but these guarantee a
// useful sample.
const SEED_LISTINGS = [
  '/escorts-buenos-aires/',
  '/escorts-capital-federal/',
  '/escorts-palermo/',
  '/escorts-recoleta/',
  '/escorts-mar-del-plata/',
  '/escorts-zona-norte/',
  '/escorts-zona-oeste/',
  '/escorts-zona-sur/'
];

// --- selectors / patterns discovered by inspecting the live DOM ---
// Listing card -> profile permalink. The card's title/thumbnail anchor carries
// title="Permanent Link to <Name>"; the card heading link (h3 > a) is the same
// target. We accept either.
const SEL_PROFILE_LINK = 'a[title^="Permanent Link"], h3 a[href]';
// Profile contact element (WhatsApp). SexySabor uses api.whatsapp.com/send.
const SEL_WHATSAPP =
  'a[href*="api.whatsapp.com"], a[href*="web.whatsapp.com"], a[href*="wa.me"]';

function parseArgs(argv) {
  const args = {
    limit: 10,
    listings: 8,
    delayMs: 1500,
    out: path.join('exports', 'sexysabor-leads.csv'),
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

// The profile "id" we dedupe on is the URL slug (sexysabor profiles are
// https://www.sexysabor.com/<slug>/ ).
function slugFromUrl(url) {
  try {
    const p = new URL(url, ORIGIN).pathname.replace(/\/+$/, '');
    return p.split('/').filter(Boolean).pop() || null;
  } catch (_) {
    return null;
  }
}

// A profile post is a root-level slug; reject the known non-profile sections so
// discovery does not pick up category/static pages.
const NON_PROFILE_SLUGS = new Set([
  'escort',
  'escorts',
  'novedades-escorts',
  'escorts-con-videos',
  'escorts-vip',
  'escorts-masajistas',
  'escorts-fantasias',
  'escorts-videollamadas',
  'legales',
  'terminos-y-condiciones',
  'sobre-sexysabor'
]);

function isProfileUrl(url) {
  try {
    const u = new URL(url, ORIGIN);
    if (u.hostname.replace(/^www\./, '') !== 'sexysabor.com') return false;
    const parts = u.pathname.replace(/\/+$/, '').split('/').filter(Boolean);
    if (parts.length !== 1) return false; // profiles are exactly /<slug>/
    const slug = parts[0];
    if (/^escorts-/.test(slug)) return false; // /escorts-<location>/ are listings
    if (NON_PROFILE_SLUGS.has(slug)) return false;
    return true;
  } catch (_) {
    return false;
  }
}

// Turn a listing path like "/escorts-mar-del-plata/" into a readable location
// label ("Mar Del Plata") used as the city/zone context.
function locationFromListing(listingPath) {
  const m = String(listingPath).match(/escorts-([a-z0-9-]+)/i);
  if (!m) return null;
  return m[1]
    .split('-')
    .filter(Boolean)
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(' ');
}

function csvEscape(v) {
  const s = String(v == null ? '' : v);
  return /[",\r\n]/.test(s) ? '"' + s.replace(/"/g, '""') + '"' : s;
}

// Parse the Argentine number out of a WhatsApp / tel contact href.
function phoneFromContactHref(href) {
  if (!href) return null;
  let m = href.match(/[?&]phone=(\d{6,})/i);
  if (m) return m[1];
  m = href.match(/wa\.me\/(\d{6,})/i);
  if (m) return m[1];
  m = href.match(/tel:\+?([\d\-\s]{6,})/i);
  if (m) return m[1].replace(/[^0-9]/g, '');
  return null;
}

// alias: strip the WordPress "Escorts " title label off the <h1>.
function aliasFromH1(h1) {
  if (!h1) return null;
  return h1.replace(/^\s*escorts?\s+/i, '').replace(/\s+/g, ' ').trim() || null;
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

// Best-effort: dismiss a cookie / age banner if present (non-fatal).
async function dismissBanners(page) {
  try {
    await page.evaluate(() => {
      const btns = Array.from(document.querySelectorAll('button, a'));
      const accept = btns.find((b) =>
        /^(aceptar|accept|entrar|ingresar|continuar|si,?\s*soy\s*mayor)$/i.test((b.textContent || '').trim())
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
    await sleep(600);
    const hrefs = await page.evaluate((sel) => {
      return Array.from(document.querySelectorAll(sel)).map((a) => a.href);
    }, SEL_PROFILE_LINK);
    for (const href of hrefs) {
      if (!isProfileUrl(href)) continue;
      const slug = slugFromUrl(href);
      if (!slug || seenSlugs.has(slug)) continue;
      seenSlugs.add(slug);
      found.push({ url: href.split('#')[0].split('?')[0], context: locationFromListing(listingPath) });
    }
  } catch (_) {}
  return found;
}

async function extractProfile(page, profileUrl, contextLocation) {
  const entry = {
    profileUrl,
    slug: slugFromUrl(profileUrl),
    rawPhone: null,
    phone: null,
    alias: null,
    province: null,
    city: null,
    status: null,
    error: null
  };
  try {
    const r = await page.goto(profileUrl, { waitUntil: 'domcontentloaded', timeout: 45000 });
    entry.status = r && r.status();
    if (!r || r.status() >= 400) {
      entry.error = `HTTP ${entry.status}`;
      return entry;
    }
    await dismissBanners(page);
    try {
      await page.waitForSelector(SEL_WHATSAPP, { timeout: 8000 });
    } catch (_) {}

    const data = await page.evaluate((waSel) => {
      const clean = (s) => (s || '').replace(/\s+/g, ' ').trim();
      const out = {};
      out.title = document.title || '';
      const wa = document.querySelector(waSel);
      out.waHref = wa ? wa.getAttribute('href') || '' : '';
      const tel = document.querySelector('a[href^="tel:"]');
      out.telHref = tel ? tel.getAttribute('href') || '' : '';
      const h1 = document.querySelector('h1');
      out.h1 = clean(h1 ? h1.textContent : '');
      // post category links carry the location, e.g. /escorts-tribunales/
      out.cats = Array.from(document.querySelectorAll('a[rel~="category"], a[rel~="tag"]'))
        .map((a) => ({ href: a.getAttribute('href') || '', txt: clean(a.textContent) }))
        .filter((c) => /\/escorts-/.test(c.href));
      return out;
    }, SEL_WHATSAPP);

    // alias: <h1> minus the "Escorts " label
    entry.alias = aliasFromH1(data.h1) || null;

    // location: 1) title "<Name> en <Location> | ..." ; 2) post category link ;
    //           3) the listing-context location captured during discovery.
    let loc = null;
    const tm = data.title.match(/\sen\s+(.+?)\s*[|\u2013\-]/i);
    if (tm) loc = tm[1].replace(/\s+/g, ' ').trim();
    if (!loc) {
      const cat = (data.cats || []).find(
        (c) => !/\/escorts\/$/.test(c.href) && !/escorts-(con-videos|vip|masajistas|fantasias|videollamadas)/.test(c.href)
      );
      if (cat) loc = cat.txt.replace(/^\s*escorts?\s+/i, '').trim();
    }
    if (!loc) loc = contextLocation || null;
    entry.city = loc || null;
    // SexySabor is Argentina-only; the directory is centred on Buenos Aires/CABA
    // and AMBA, so when nothing more specific is known we leave province null
    // and keep the resolved zone/city in `city`.
    entry.province = null;

    // contact: primary whatsapp element, then tel: fallback
    const raw = phoneFromContactHref(data.waHref) || phoneFromContactHref(data.telHref);
    entry.rawPhone = raw;
    if (!raw) {
      entry.error = 'no contact element found';
      return entry;
    }

    const norm = normalizePhone(raw);
    if (norm.ok) {
      entry.phone = norm.phone; // 549 + 10 national digits
    } else {
      entry.error = `unnormalisable (${norm.reason})`;
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
    `[sexysabor] start — limit=${args.limit}, listings<=${args.listings}, delay=${args.delayMs}ms, mode=${
      args.save ? 'SAVE (DB upsert)' : 'DRY RUN (CSV only)'
    }`
  );

  // IP-SAFE: resolve the proxy (CLI --proxy or SCRAPE_PROXY env) and warn loudly
  // if none is set, since unproxied requests would expose the operator's IP.
  const proxy = parseProxy(args, process.env);
  if (proxy) {
    console.log(`[sexysabor] routing through proxy ${proxy.server}`);
  } else {
    console.log(
      '[sexysabor] WARNING: no proxy set — requests go out on your PUBLIC IP. Pass --proxy host:port or set SCRAPE_PROXY to hide it.'
    );
  }

  // RE-RUN SAFE: read what a previous run already captured so we can skip it.
  const existing = loadExisting(args.out);
  const skipPhones = new Set();
  if (args.force) {
    if (existing.rows.length) console.log(`[sexysabor] --force: ignoring ${existing.rows.length} existing rows, re-fetching all`);
  } else {
    for (const p of existing.phones) skipPhones.add(p);
    if (existing.rows.length) {
      console.log(`[sexysabor] incremental: ${existing.rows.length} already-captured ads will be skipped (use --force to re-fetch all)`);
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
      userDataDir: path.join(cacheDir, 'pptr-sexysabor'),
      args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage', ...proxyLaunchArgs(proxy)]
    });
  } catch (e) {
    console.error('[sexysabor] FAILED to launch Chromium:', e.message);
    process.exit(1);
  }

  const results = [];
  try {
    const page = await newPolitePage(browser, proxy);

    // 1) DISCOVERY ----------------------------------------------------------
    const listingUrls = SEED_LISTINGS.slice(0, Math.max(args.listings, 1));
    console.log(`[sexysabor] discovery across up to ${listingUrls.length} listing pages`);

    const seenSlugs = new Set();
    // INCREMENTAL: pre-seed the dedupe set with already-captured slugs so they
    // are never re-discovered/re-opened (unless --force).
    if (!args.force) for (const id of existing.ids) seenSlugs.add(id);
    const targets = [];
    for (const listing of listingUrls) {
      if (targets.length >= args.limit) break;
      const found = await collectProfileUrls(page, listing, seenSlugs);
      if (found.length) {
        console.log(`[sexysabor]   ${listing} -> +${found.length} new profiles (total ${targets.length + found.length})`);
      }
      targets.push(...found);
      await sleep(600);
    }

    const sliced = targets.slice(0, args.limit);
    console.log(`[sexysabor] discovered ${targets.length} unique profiles; extracting first ${sliced.length}`);

    // 2) EXTRACTION ---------------------------------------------------------
    for (let i = 0; i < sliced.length; i++) {
      const entry = await extractProfile(page, sliced[i].url, sliced[i].context);
      // INCREMENTAL: a re-posted ad (new slug, same phone) — skip without counting.
      if (!args.force && entry.phone && skipPhones.has(entry.phone)) {
        console.log(`[sexysabor] (${i + 1}/${sliced.length}) [DUP ] ${entry.alias || '(no alias)'} | already captured — skipping`);
        if (i < sliced.length - 1) await sleep(args.delayMs);
        continue;
      }
      const tag = entry.phone ? 'OK ' : 'SKIP';
      console.log(
        `[sexysabor] (${i + 1}/${sliced.length}) [${tag}] ${entry.alias || '(no alias)'} | ${entry.city ||
          '(no city)'} | ${entry.phone || entry.error}`
      );
      results.push(entry);
      if (i < sliced.length - 1) await sleep(args.delayMs);
    }
  } catch (e) {
    console.error('[sexysabor] FATAL:', e.message);
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

  console.log('\n================ SEXYSABOR RESULTS ================');
  console.log(`Profiles opened:            ${results.length}`);
  console.log(`Yielded a phone:            ${passed.length} (unique phones)`);
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
      [r.phone, r.alias || '', ORIGIN, 'pending', r.province || '', r.city || '', r.slug || '', r.profileUrl]
        .map(csvEscape)
        .join(',')
    );
  }
  fs.writeFileSync(outPath, lines.join('\n') + '\n', 'utf8');
  const totalInFile = lines.length - 1;
  console.log(`\n[sexysabor] new this run: ${newRows.length}, total in file: ${totalInFile} -> ${outPath}`);

  // 5) OPTIONAL DB SAVE -----------------------------------------------------
  if (args.save) {
    if (!newRows.length) {
      console.log('[sexysabor] --save given but no NEW leads to upsert; skipping DB.');
    } else {
      console.log(`[sexysabor] --save: upserting ${newRows.length} NEW leads into potential_professionals...`);
      try {
        const { inserted, existed } = await saveToDb(newRows);
        console.log(`[sexysabor] DB done — inserted ${inserted}, already existed ${existed}`);
      } catch (e) {
        console.error('[sexysabor] DB save failed:', e.message);
        process.exitCode = 1;
      }
    }
  } else {
    console.log('[sexysabor] DRY RUN — no database connection opened. Re-run with --save to upsert.');
  }
})();
