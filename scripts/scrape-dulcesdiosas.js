/*
 * scripts/scrape-dulcesdiosas.js
 *
 * ACCURATE per-site adapter for DulcesDiosas.com (an Argentine escort directory).
 *
 * WHY THIS EXISTS
 * ----------------
 * A whole-page Argentine-phone regex (like the legacy public/js/scrape_phones.js)
 * over-collects on DulcesDiosas: every profile shows a sidebar of "Otras Escorts"
 * (each with its OWN phone in the link text, e.g. "Sabri 15-6010-9375") plus the
 * profile headings. Worse, the visible heading number is written in the legacy
 * domestic form "15-XXXX-XXXX" which OMITS the area code, so a regex that scraped
 * it would store a wrong, un-diallable number. This adapter follows the per-site
 * model proven by scripts/scrape-simpleescorts.js and reads the ONE authoritative
 * contact element.
 *
 * WHAT THIS DOES (mirrors the SimpleEscort adapter)
 *   1. ARGENTINA FILTER = the site is Argentina-only (Buenos Aires / CABA + GBA).
 *      We additionally assert the contact phone is +54 as a second guard.
 *   2. PROFILE DISCOVERY = crawl the listing pages ( /escorts/ and its category
 *      pages, with WordPress /page/N/ pagination ) and collect the profile-card
 *      title links from `.gridshow-grid-post-header-inside a`. A profile URL is a
 *      single-slug page, e.g. https://www.dulcesdiosas.com/barbiee/ . Deduped by
 *      the slug. (We scope discovery to the post grid so we never pick up the
 *      category/zone links in the site menu.)
 *   3. REAL CONTACT EXTRACTION = on each profile we read the SPECIFIC contact
 *      element, NOT the whole page. The AUTHORITATIVE number is the advertiser
 *      WhatsApp button, which carries the FULL international number (with the
 *      area code the visible "15-..." heading drops):
 *        - primary:  <a href="https://api.whatsapp.com/send?phone=549XXXXXXXXXX&text=Hola *<Name>* ...">
 *        - fallback: <a href="tel:+54...">
 *      We DELIBERATELY do NOT trust the visible "15-XXXX-XXXX" heading text
 *      (no area code). alias = the "Hola *<Name>*" from the WhatsApp text /
 *      the <h1> ("Escorts <Name>"); city = the WordPress post category
 *      ( <a rel="category"> "Escorts <Barrio>" ); province = Buenos Aires.
 *      (DulcesDiosas exposes only Article schema.org JSON-LD with NO telephone,
 *      so the WhatsApp link IS the structured contact source here.)
 *
 * SAFETY
 * ------
 * - DRY RUN by default: writes exports/dulcesdiosas-leads.csv and touches NO
 *   database. Pass --save to upsert into potential_professionals.
 * - Small, polite volume: bounded --limit, delays between requests, dedupe.
 * - This is a validation/collection tool. Do NOT mass-run it.
 *
 * USAGE
 * -----
 *   node scripts/scrape-dulcesdiosas.js                 # dry run, 10 profiles -> CSV
 *   node scripts/scrape-dulcesdiosas.js --limit 5       # smaller sample
 *   node scripts/scrape-dulcesdiosas.js --limit 25 --save   # also upsert to DB
 *   node scripts/scrape-dulcesdiosas.js --out exports/foo.csv
 *   node scripts/scrape-dulcesdiosas.js --headful       # watch the browser
 *   node scripts/scrape-dulcesdiosas.js --proxy user:pass@host:port  # hide your IP
 *   node scripts/scrape-dulcesdiosas.js --force         # re-fetch everything
 *
 * Flags:
 *   --limit N        max profiles to OPEN+extract (default 10)
 *   --listings N     max listing pages to crawl during discovery (default 8)
 *   --delay MS       polite delay between profile fetches (default 1500)
 *   --out PATH       output CSV path (default exports/dulcesdiosas-leads.csv)
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

const ORIGIN = 'https://www.dulcesdiosas.com';
const USER_AGENT =
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36';

// Seed listing pages. /escorts/ is the busy aggregate; the others broaden the
// coverage. WordPress paginates these as /<listing>/page/N/.
const SEED_LISTINGS = [
  '/escorts/',
  '/novedades-escorts/',
  '/escorts-capital-federal/',
  '/escorts-nivel-vip/',
  '/escorts-maduras/',
  '/escorts-con-videos/'
];

// Single-slug paths that are CATEGORY / zone / utility pages, never profiles.
// Used to reject non-profile slugs that slip past the grid selector.
const NON_PROFILE_SLUGS = new Set([
  'escorts', 'fantasias', 'masajistas', 'novedades-escorts', 'escorts-con-videos',
  'escorts-maduras', 'escorts-nivel-vip', 'escorts-videollamadas', 'escorts-argentina',
  'escorts-capital-federal', 'avellaneda', 'caseros', 'haedo', 'la-matanza', 'lanus',
  'lomas-de-zamora', 'mar-del-plata', 'moron', 'olivos', 'san-isidro', 'san-miguel',
  'temperley', 'tigre', 'vicente-lopez', 'zona-norte', 'zona-oeste', 'sur',
  'wp-login', 'wp-admin', 'feed', 'comments', 'tag', 'category', 'author', 'page'
]);

const RE_WA_PHONE = /[?&]phone=\+?(\d{6,})/i;
const RE_HOLA = /hola\s*\*?([^,!.*\n]{1,40})/i;
const RE_CITY_CAT = /\/escorts-([a-z0-9-]+)\/?$/i;

function parseArgs(argv) {
  const args = {
    limit: 10,
    listings: 8,
    delayMs: 1500,
    out: path.join('exports', 'dulcesdiosas-leads.csv'),
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

function slugFromUrl(url) {
  try {
    const segs = new URL(url, ORIGIN).pathname.replace(/\/+$/, '').split('/').filter(Boolean);
    return segs.length ? segs[segs.length - 1].toLowerCase() : null;
  } catch (_) {
    return null;
  }
}

// A profile is a single-segment slug page on this origin that is not a known
// category/zone/utility slug.
function isProfileUrl(url) {
  try {
    const u = new URL(url, ORIGIN);
    if (u.hostname.replace(/^www\./, '') !== 'dulcesdiosas.com') return false;
    const segs = u.pathname.replace(/\/+$/, '').split('/').filter(Boolean);
    if (segs.length !== 1) return false;
    const slug = segs[0].toLowerCase();
    if (NON_PROFILE_SLUGS.has(slug)) return false;
    if (/^escorts-/.test(slug)) return false; // all barrio category pages
    return true;
  } catch (_) {
    return false;
  }
}

function titleCaseFromSlug(slug) {
  if (!slug) return null;
  return slug
    .split('-')
    .filter(Boolean)
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(' ');
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

// Best-effort: dismiss a cookie / age banner if present (non-fatal).
async function dismissBanners(page) {
  try {
    await page.evaluate(() => {
      const btns = Array.from(document.querySelectorAll('button, a'));
      const accept = btns.find((b) =>
        /^(aceptar|accept|entrar|ingresar|continuar|si|sí|mayor)$/i.test((b.textContent || '').trim())
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
    await sleep(700);
    // Scope to the post-grid title links so menu/category links never qualify.
    const hrefs = await page.evaluate(() => {
      const sel = '.gridshow-grid-post-header-inside a[href], .gridshow-grid-post-thumbnail-link[href]';
      let nodes = Array.from(document.querySelectorAll(sel));
      if (!nodes.length) nodes = Array.from(document.querySelectorAll('.gridshow-grid-post-block a[href]'));
      return nodes.map((a) => a.href);
    });
    for (const href of hrefs) {
      if (!isProfileUrl(href)) continue;
      const slug = slugFromUrl(href);
      if (!slug || seenSlugs.has(slug)) continue;
      seenSlugs.add(slug);
      found.push(href.split('#')[0].split('?')[0]);
    }
  } catch (_) {}
  return found;
}

async function extractProfile(page, profileUrl) {
  const entry = {
    profileUrl,
    adId: slugFromUrl(profileUrl),
    rawPhone: null,
    phone: null,
    alias: null,
    province: 'Buenos Aires',
    city: null,
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
      // PRIMARY (authoritative): the advertiser WhatsApp button. It carries the
      // FULL +54 number (with area code) and a "Hola *<Name>*" greeting.
      const waLinks = Array.from(
        document.querySelectorAll('a[href*="api.whatsapp.com"], a[href*="wa.me"], a[href*="whatsapp"]')
      ).map((a) => a.getAttribute('href') || '');
      out.waHrefs = waLinks.map((h) => {
        try {
          return decodeURIComponent(h);
        } catch (_) {
          return h;
        }
      });
      // FALLBACK: tel: link.
      const tel = document.querySelector('a[href^="tel:"]');
      out.tel = tel ? tel.getAttribute('href') || '' : '';
      // alias: <h1> is "Escorts <Name>".
      const h1 = document.querySelector('h1');
      out.h1 = clean(h1 ? h1.textContent : '');
      // city: the WordPress post category "Escorts <Barrio>" (rel=category).
      out.catLinks = Array.from(document.querySelectorAll('a[rel~="category"]')).map((a) => ({
        t: clean(a.textContent),
        h: a.getAttribute('href') || ''
      }));
      return out;
    });

    // Resolve the authoritative contact number (WhatsApp first, then tel:).
    let raw = null;
    let alias = null;
    for (const href of data.waHrefs) {
      const mPhone = href.match(RE_WA_PHONE);
      if (mPhone) {
        raw = mPhone[1];
        const mHola = href.match(RE_HOLA);
        if (mHola) alias = mHola[1].replace(/\*/g, '').trim();
        break;
      }
    }
    if (!raw && data.tel) raw = data.tel.replace(/[^0-9]/g, '');
    entry.rawPhone = raw;

    // alias: WhatsApp greeting -> <h1> minus "Escorts " -> slug.
    if (!alias && data.h1) alias = data.h1.replace(/^escorts\s+/i, '').trim();
    if (!alias) alias = titleCaseFromSlug(entry.adId);
    entry.alias = alias || null;

    // city: pick the barrio category ( /escorts-<barrio>/ ), skipping the
    // generic "Escorts" / "Escorts Argentinas..." catch-all categories.
    for (const c of data.catLinks) {
      const m = c.h.match(RE_CITY_CAT);
      if (!m) continue;
      const barrio = m[1].toLowerCase();
      if (barrio === 'argentina' || barrio === 'capital-federal') continue;
      entry.city = titleCaseFromSlug(barrio);
      break;
    }
    if (!entry.city) {
      // Fall back to the "Escorts <Barrio>" category text if no slug matched.
      const named = data.catLinks
        .map((c) => (c.t.match(/^escorts\s+(.+)$/i) || [])[1])
        .filter((t) => t && !/^argentinas/i.test(t));
      if (named.length) entry.city = named[0].trim();
    }

    if (!raw) {
      entry.error = 'no contact element found';
      return entry;
    }

    // ARGENTINA GUARD #2: assert the contact normalises to a +54 mobile.
    const digits = raw.replace(/[^0-9]/g, '');
    const looksArg = digits.startsWith('54') || digits.length === 10;
    const norm = normalizePhone(raw);
    if (norm.ok && looksArg) {
      entry.phone = norm.phone;
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
    `[dulcesdiosas] start — limit=${args.limit}, listings<=${args.listings}, delay=${args.delayMs}ms, mode=${
      args.save ? 'SAVE (DB upsert)' : 'DRY RUN (CSV only)'
    }`
  );

  // IP-SAFE: resolve the proxy (CLI --proxy or SCRAPE_PROXY env) and warn loudly
  // if none is set, since unproxied requests would expose the operator's IP.
  const proxy = parseProxy(args, process.env);
  if (proxy) {
    console.log(`[dulcesdiosas] routing through proxy ${proxy.server}`);
  } else {
    console.log(
      '[dulcesdiosas] WARNING: no proxy set — requests go out on your PUBLIC IP. Pass --proxy host:port or set SCRAPE_PROXY to hide it.'
    );
  }

  // RE-RUN SAFE: read what a previous run already captured so we can skip it.
  const existing = loadExisting(args.out);
  const skipPhones = new Set();
  if (args.force) {
    if (existing.rows.length) console.log(`[dulcesdiosas] --force: ignoring ${existing.rows.length} existing rows, re-fetching all`);
  } else {
    for (const p of existing.phones) skipPhones.add(p);
    if (existing.rows.length) {
      console.log(`[dulcesdiosas] incremental: ${existing.rows.length} already-captured ads will be skipped (use --force to re-fetch all)`);
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
      userDataDir: path.join(cacheDir, 'pptr-dulcesdiosas'),
      args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage', ...proxyLaunchArgs(proxy)]
    });
  } catch (e) {
    console.error('[dulcesdiosas] FAILED to launch Chromium:', e.message);
    process.exit(1);
  }

  const results = [];
  try {
    const page = await newPolitePage(browser, proxy);

    console.log(`[dulcesdiosas] opening home: ${ORIGIN}/escorts/`);
    const home = await page.goto(ORIGIN + '/escorts/', { waitUntil: 'domcontentloaded', timeout: 60000 });
    console.log(`[dulcesdiosas] home HTTP ${home && home.status()} — ${await page.title()}`);
    await dismissBanners(page);

    // 1) DISCOVERY ----------------------------------------------------------
    // Seed listings first, then add WordPress /page/N/ pages of /escorts/ to
    // reach the requested volume.
    const listingUrls = [...SEED_LISTINGS];
    for (let p = 2; listingUrls.length < args.listings; p++) {
      listingUrls.push(`/escorts/page/${p}/`);
    }
    const boundedListings = listingUrls.slice(0, Math.max(args.listings, SEED_LISTINGS.length));
    console.log(`[dulcesdiosas] discovery across up to ${boundedListings.length} listing pages`);

    const seenSlugs = new Set();
    // INCREMENTAL: pre-seed the dedupe set with already-captured slugs so they
    // are never re-discovered/re-opened (unless --force).
    if (!args.force) for (const id of existing.ids) seenSlugs.add(id);
    const profileUrls = [];
    for (const listing of boundedListings) {
      if (profileUrls.length >= args.limit) break;
      const found = await collectProfileUrls(page, listing, seenSlugs);
      if (found.length) {
        console.log(`[dulcesdiosas]   ${listing} -> +${found.length} new profiles (total ${profileUrls.length + found.length})`);
      }
      profileUrls.push(...found);
      await sleep(600);
    }

    const targets = profileUrls.slice(0, args.limit);
    console.log(`[dulcesdiosas] discovered ${profileUrls.length} unique profiles; extracting first ${targets.length}`);

    // 2) EXTRACTION ---------------------------------------------------------
    for (let i = 0; i < targets.length; i++) {
      const entry = await extractProfile(page, targets[i]);
      // INCREMENTAL: a re-posted ad (new slug, same phone) — skip without counting.
      if (!args.force && entry.phone && skipPhones.has(entry.phone)) {
        console.log(`[dulcesdiosas] (${i + 1}/${targets.length}) [DUP ] ${entry.alias || '(no alias)'} | already captured — skipping`);
        if (i < targets.length - 1) await sleep(args.delayMs);
        continue;
      }
      const tag = entry.phone ? 'OK ' : 'SKIP';
      console.log(
        `[dulcesdiosas] (${i + 1}/${targets.length}) [${tag}] ${entry.alias || '(no alias)'} | ${entry.city ||
          '(no city)'} | ${entry.phone || entry.error}`
      );
      results.push(entry);
      if (i < targets.length - 1) await sleep(args.delayMs);
    }
  } catch (e) {
    console.error('[dulcesdiosas] FATAL:', e.message);
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

  console.log('\n================ DULCESDIOSAS RESULTS ================');
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
  console.log(`\n[dulcesdiosas] new this run: ${newRows.length}, total in file: ${totalInFile} -> ${outPath}`);

  // 5) OPTIONAL DB SAVE -----------------------------------------------------
  if (args.save) {
    if (!newRows.length) {
      console.log('[dulcesdiosas] --save given but no NEW leads to upsert; skipping DB.');
    } else {
      console.log(`[dulcesdiosas] --save: upserting ${newRows.length} NEW leads into potential_professionals...`);
      try {
        const { inserted, existed } = await saveToDb(newRows);
        console.log(`[dulcesdiosas] DB done — inserted ${inserted}, already existed ${existed}`);
      } catch (e) {
        console.error('[dulcesdiosas] DB save failed:', e.message);
        process.exitCode = 1;
      }
    }
  } else {
    console.log('[dulcesdiosas] DRY RUN — no database connection opened. Re-run with --save to upsert.');
  }
})();
