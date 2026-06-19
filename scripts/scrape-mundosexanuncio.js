/*
 * scripts/scrape-mundosexanuncio.js
 *
 * ACCURATE per-site adapter for MundoSexAnuncio (international classifieds with a
 * dedicated Argentina subdomain).
 *
 * WHY THIS EXISTS
 * ----------------
 * MundoSexAnuncio is a multi-country classifieds site. A naive whole-page +54
 * regex would over-collect (the page leaks numbers in titles, body copy and
 * "related ads") and has no country filter. This adapter mirrors
 * scripts/scrape-simpleescorts.js exactly: it stays on the Argentine subdomain,
 * discovers profile URLs from Argentine city/barrio listings, and reads the
 * SPECIFIC contact element on each ad — never a whole-page regex.
 *
 * WHAT THIS DOES (the per-site-adapter model)
 *   1. ARGENTINA FILTER = the site's OWN country classification. MundoSexAnuncio
 *      segregates countries onto subdomains; Argentina lives entirely on
 *      https://ar.mundosexanuncio.com/ , so we never leave it. Every ad's
 *      breadcrumb is rooted at "Argentina", and the WhatsApp deep-link carries
 *      an explicit "54" country code. We assert that +54 form normalises to an
 *      Argentine mobile (guard #2).
 *   2. PROFILE DISCOVERY = crawl Argentine listing pages
 *      ( /escorts-en-capital-federal/prostitutas , /escorts-en-<barrio> , ...)
 *      and collect profile links matching /escorts/<slug>-<adId> , deduped by
 *      the trailing numeric ad id.
 *   3. REAL CONTACT EXTRACTION = on each /escorts/<slug> page we read the
 *      SPECIFIC contact element, not the whole page:
 *        - primary:  the WhatsApp deep-link
 *                    <a href="https://api.whatsapp.com/send?phone=54XXXXXXXXXX">
 *                    (the "phone" query param is the canonical 54 + national)
 *        - fallback: the phone <a href="tel://XXXXXXXXXX"> element
 *        - fallback: the <title>, suffixed " - <phone>" (only for ACTIVE ads)
 *      alias = <p class="title">, province/city = breadcrumb geo crumbs.
 *
 *   IMPORTANT — inactive ads: MundoSexAnuncio hides the contact on stale ads
 *   ("Este anuncio lleva tiempo inactivo y se han ocultado los métodos de
 *   contacto") and removes the WhatsApp/tel elements. We DETECT that and SKIP
 *   the ad rather than scrape the (stale) number still left in the title/slug —
 *   we only ever emit a contact that the site is actively exposing.
 *
 * SAFETY
 * ------
 * - DRY RUN by default: writes exports/mundosexanuncio-leads.csv and touches NO
 *   database. Pass --save to upsert into potential_professionals.
 * - Small, polite volume: bounded --limit, delays between requests, dedupe.
 * - This is a validation/collection tool. Do NOT mass-run it.
 *
 * USAGE
 * -----
 *   node scripts/scrape-mundosexanuncio.js                 # dry run -> CSV
 *   node scripts/scrape-mundosexanuncio.js --limit 5       # smaller sample
 *   node scripts/scrape-mundosexanuncio.js --limit 25 --save   # upsert to DB
 *   node scripts/scrape-mundosexanuncio.js --out exports/foo.csv
 *   node scripts/scrape-mundosexanuncio.js --headful       # watch the browser
 *   node scripts/scrape-mundosexanuncio.js --proxy user:pass@host:port  # hide your IP
 *   node scripts/scrape-mundosexanuncio.js --force         # re-fetch everything
 *
 * Flags:
 *   --limit N        max profiles to OPEN+extract (default 10)
 *   --listings N     max listing pages to crawl during discovery (default 8)
 *   --delay MS       polite delay between profile fetches (default 1500)
 *   --out PATH       output CSV path (default exports/mundosexanuncio-leads.csv)
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
    if (national.length > 10) {
      for (const areaLen of [2, 3, 4]) {
        if (national.length === areaLen + 2 + 8 && national.slice(areaLen, areaLen + 2) === '15') {
          national = national.slice(0, areaLen) + national.slice(areaLen + 2);
          break;
        }
      }
    }
    if (national.length !== 10) return { ok: false, reason: `length ${national.length}` };
    if (new Set(national.split('')).size <= 2) return { ok: false, reason: 'placeholder' };
    return { ok: true, phone: '549' + national };
  };
}

const ORIGIN = 'https://ar.mundosexanuncio.com';
const USER_AGENT =
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36';

// Seed Argentine listing pages (Capital Federal + busy barrios). Discovery also
// pulls more barrio/city listing URLs from the start page itself.
const SEED_LISTINGS = [
  '/escorts-en-capital-federal/prostitutas',
  '/escorts-en-capital-federal',
  '/escorts-en-palermo',
  '/escorts-en-recoleta',
  '/escorts-en-belgrano',
  '/escorts-en-caballito',
  '/escorts-en-balvanera',
  '/escorts-en-flores'
];

// Breadcrumb roots we strip before deriving the geo (country + category names).
const NON_GEO_CRUMBS = new Set(
  [
    'argentina',
    'escorts',
    'masajes eróticos',
    'masajes eroticos',
    'travestis',
    'contactos gays',
    'contactos hombres',
    'contactos lesbianas',
    'relaciones ocasionales',
    'habitaciones y plazas',
    'líneas eróticas',
    'lineas eroticas',
    'prostitutas'
  ].map((s) => s.toLowerCase())
);

// --- selectors / patterns discovered by inspecting the live DOM ---
const SEL_PROFILE_LINK = 'a[href*="/escorts/"]'; // profile = /escorts/<slug>-<id>
const SEL_WA_LINK = 'a[href*="whatsapp"], a[href*="wa.me"]'; // canonical WA deep-link
const SEL_TEL_LINK = 'a[href^="tel:"]'; // tel://<national>
const SEL_TITLE = 'p.title'; // ad title (alias)
// Profile slugs end with a numeric ad id, e.g. /escorts/melina-oral-al-natural-625818
const RE_AD_ID = /-(\d+)\/?$/;
const RE_WA_PHONE = /[?&]phone=(\d{6,})/i;
const RE_INACTIVE = /ocultado los m[eé]todos de contacto/i;

function parseArgs(argv) {
  const args = {
    limit: 10,
    listings: 8,
    delayMs: 1500,
    out: path.join('exports', 'mundosexanuncio-leads.csv'),
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

// A profile path is /escorts/<slug>-<digits> (NOT a /escorts-en-<city> listing).
function isProfilePath(pathname) {
  return /^\/escorts\/[^/]+-\d+\/?$/.test(pathname);
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

// Best-effort: dismiss the cookie / age banner if present (non-fatal).
async function dismissBanners(page) {
  try {
    await page.evaluate(() => {
      const btns = Array.from(document.querySelectorAll('button, a, input[type="button"], input[type="submit"]'));
      const accept = btns.find((b) =>
        /^(aceptar|accept|entrar|ingresar|continuar|soy mayor)/i.test(
          ((b.textContent || b.value || '') + '').trim()
        )
      );
      if (accept) accept.click();
    });
  } catch (_) {}
}

// From the start listing, collect barrio/city listing URLs (/escorts-en-<x>) to
// broaden discovery.
async function discoverListingUrls(page, max) {
  const urls = [...SEED_LISTINGS];
  try {
    const resp = await page.goto(ORIGIN + SEED_LISTINGS[0], { waitUntil: 'domcontentloaded', timeout: 60000 });
    if (resp && resp.status() < 400) {
      await dismissBanners(page);
      const links = await page.evaluate(() => {
        const out = [];
        const as = document.getElementsByTagName('a');
        for (let i = 0; i < as.length; i++) {
          const h = as[i].getAttribute('href');
          if (h) out.push(h);
        }
        return out;
      });
      for (const h of links) {
        try {
          const p = new URL(h, ORIGIN).pathname;
          // listing pages: /escorts-en-<city>  or  /escorts-en-<city>/<filter>
          if (/^\/escorts-en-[a-z0-9-]+(\/[a-z0-9-]+)?$/i.test(p) && !urls.includes(p)) {
            urls.push(p);
          }
        } catch (_) {}
      }
    }
  } catch (_) {}
  return [...new Set(urls)].slice(0, Math.max(max, SEED_LISTINGS.length));
}

async function collectProfileUrls(page, listingPath, seenAdIds) {
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
      const out = [];
      const nodes = document.querySelectorAll(sel);
      for (let i = 0; i < nodes.length; i++) out.push(nodes[i].href);
      return out;
    }, SEL_PROFILE_LINK);
    for (const href of hrefs) {
      let pathname;
      try {
        pathname = new URL(href, ORIGIN).pathname;
      } catch (_) {
        continue;
      }
      if (!isProfilePath(pathname)) continue;
      const id = adIdFromUrl(href);
      if (!id || seenAdIds.has(id)) continue;
      seenAdIds.add(id);
      found.push(href.split('#')[0].split('?')[0]);
    }
  } catch (_) {}
  return found;
}

async function extractProfile(page, profileUrl) {
  const entry = {
    profileUrl,
    adId: adIdFromUrl(profileUrl),
    rawPhone: null,
    phone: null,
    alias: null,
    province: null,
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
    const data = await page.evaluate((waSel, telSel, titleSel) => {
      const out = {};
      const clean = (s) => (s || '').replace(/\s+/g, ' ').trim();
      out.title = document.title || '';
      const t = document.querySelector(titleSel);
      out.adTitle = t ? clean(t.textContent) : '';
      const wa = document.querySelector(waSel);
      out.wa = wa ? wa.getAttribute('href') || '' : '';
      const tel = document.querySelector(telSel);
      out.tel = tel ? tel.getAttribute('href') || '' : '';
      out.inactive = /ocultado los m[eé]todos de contacto/i.test(document.body ? document.body.innerText : '');
      // breadcrumb geo crumbs
      const crumbs = [];
      const lis = document.querySelectorAll('.breadcrumb li, nav li, ol li, ul.breadcrumb li');
      for (let i = 0; i < lis.length; i++) {
        const tx = clean(lis[i].textContent);
        if (tx && tx !== '›' && tx !== '/') crumbs.push(tx);
      }
      out.crumbs = crumbs;
      return out;
    }, SEL_WA_LINK, SEL_TEL_LINK, SEL_TITLE);

    // alias: prefer the ad title element; strip any trailing phone digits the
    // advertiser tacked onto the title.
    let alias = data.adTitle || '';
    if (!alias && data.title) {
      const mEn = data.title.split(/\sen\s/i)[0];
      alias = (mEn || '').trim();
    }
    alias = alias.replace(/\s*[0-9]{8,}\s*$/, '').replace(/\s+/g, ' ').trim();
    entry.alias = alias || null;

    // province / city from breadcrumb (drop country + category crumbs).
    const geo = (data.crumbs || [])
      .map((c) => c.trim())
      .filter((c) => c && !NON_GEO_CRUMBS.has(c.toLowerCase()));
    if (geo.length >= 2) {
      entry.province = geo[0];
      entry.city = geo[geo.length - 1];
    } else if (geo.length === 1) {
      entry.province = geo[0];
      entry.city = geo[0];
    }

    // INACTIVE GUARD: respect the site hiding the contact — skip rather than
    // harvest the stale number left in the title/slug.
    const hasContactEl = !!(data.wa || data.tel);
    if (data.inactive || (!hasContactEl)) {
      entry.error = data.inactive ? 'inactive ad — contact hidden' : 'no contact element found';
      return entry;
    }

    // Resolve the raw contact number from the SPECIFIC element:
    // WhatsApp phone= param (54 + national) -> tel: link -> <title> suffix.
    let raw = null;
    if (data.wa) {
      const mWa = data.wa.match(RE_WA_PHONE);
      if (mWa) raw = mWa[1];
      else raw = data.wa.replace(/[^0-9]/g, '') || null;
    }
    if (!raw && data.tel) raw = data.tel.replace(/[^0-9]/g, '');
    if (!raw && data.title) {
      const mTitle = data.title.match(/-\s*(\d{8,})\s*$/);
      if (mTitle) raw = mTitle[1];
    }
    entry.rawPhone = raw;

    if (!raw) {
      entry.error = 'no contact element found';
      return entry;
    }

    // ARGENTINA GUARD #2: the WhatsApp form is "54" + national; the tel form is
    // the bare 10-digit national number. Reject anything carrying a non-54
    // country code (a non-AR number will not normalise to 549 + 10 here).
    const digits = raw.replace(/[^0-9]/g, '');
    const looksArg =
      digits.startsWith('54') || // WhatsApp / international +54 form
      digits.startsWith('0') || // domestic trunk form
      digits.length === 10; // bare national form
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
    `[mundosexanuncio] start — limit=${args.limit}, listings<=${args.listings}, delay=${args.delayMs}ms, mode=${
      args.save ? 'SAVE (DB upsert)' : 'DRY RUN (CSV only)'
    }`
  );

  // IP-SAFE: resolve the proxy (CLI --proxy or SCRAPE_PROXY env) and warn loudly
  // if none is set, since unproxied requests would expose the operator's IP.
  const proxy = parseProxy(args, process.env);
  if (proxy) {
    console.log(`[mundosexanuncio] routing through proxy ${proxy.server}`);
  } else {
    console.log(
      '[mundosexanuncio] WARNING: no proxy set — requests go out on your PUBLIC IP. Pass --proxy host:port or set SCRAPE_PROXY to hide it.'
    );
  }

  // RE-RUN SAFE: read what a previous run already captured so we can skip it.
  const existing = loadExisting(args.out);
  const skipPhones = new Set();
  if (args.force) {
    if (existing.rows.length) console.log(`[mundosexanuncio] --force: ignoring ${existing.rows.length} existing rows, re-fetching all`);
  } else {
    for (const p of existing.phones) skipPhones.add(p);
    if (existing.rows.length) {
      console.log(`[mundosexanuncio] incremental: ${existing.rows.length} already-captured ads will be skipped (use --force to re-fetch all)`);
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
      userDataDir: path.join(cacheDir, 'pptr-mundosexanuncio'),
      args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage', ...proxyLaunchArgs(proxy)]
    });
  } catch (e) {
    console.error('[mundosexanuncio] FAILED to launch Chromium:', e.message);
    process.exit(1);
  }

  const results = [];
  try {
    const page = await newPolitePage(browser, proxy);

    console.log(`[mundosexanuncio] opening Argentina home: ${ORIGIN}/`);
    const home = await page.goto(ORIGIN + '/', { waitUntil: 'domcontentloaded', timeout: 60000 });
    console.log(`[mundosexanuncio] home HTTP ${home && home.status()} — ${await page.title()}`);
    await dismissBanners(page);

    // 1) DISCOVERY ----------------------------------------------------------
    const listingUrls = await discoverListingUrls(page, args.listings);
    console.log(`[mundosexanuncio] discovery across up to ${listingUrls.length} Argentine listing pages`);

    const seenAdIds = new Set();
    // INCREMENTAL: pre-seed the dedupe set with already-captured ad ids so they
    // are never re-discovered/re-opened (unless --force).
    if (!args.force) for (const id of existing.ids) seenAdIds.add(id);
    const profileUrls = [];
    for (const listing of listingUrls) {
      if (profileUrls.length >= args.limit) break;
      const found = await collectProfileUrls(page, listing, seenAdIds);
      if (found.length) {
        console.log(`[mundosexanuncio]   ${listing} -> +${found.length} new ads (total ${profileUrls.length + found.length})`);
      }
      profileUrls.push(...found);
      await sleep(600);
    }

    const targets = profileUrls.slice(0, args.limit);
    console.log(`[mundosexanuncio] discovered ${profileUrls.length} unique Argentine ads; extracting first ${targets.length}`);

    // 2) EXTRACTION ---------------------------------------------------------
    for (let i = 0; i < targets.length; i++) {
      const entry = await extractProfile(page, targets[i]);
      // INCREMENTAL: a re-posted ad (new id, same phone) — skip without counting.
      if (!args.force && entry.phone && skipPhones.has(entry.phone)) {
        console.log(`[mundosexanuncio] (${i + 1}/${targets.length}) [DUP ] ${entry.alias || '(no alias)'} | already captured — skipping`);
        if (i < targets.length - 1) await sleep(args.delayMs);
        continue;
      }
      const tag = entry.phone ? 'OK ' : 'SKIP';
      console.log(
        `[mundosexanuncio] (${i + 1}/${targets.length}) [${tag}] ${entry.alias || '(no alias)'} | ${entry.city ||
          '(no city)'} | ${entry.phone || entry.error}`
      );
      results.push(entry);
      if (i < targets.length - 1) await sleep(args.delayMs);
    }
  } catch (e) {
    console.error('[mundosexanuncio] FATAL:', e.message);
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

  console.log('\n================ MUNDOSEXANUNCIO RESULTS ================');
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
  console.log(`\n[mundosexanuncio] new this run: ${newRows.length}, total in file: ${totalInFile} -> ${outPath}`);

  // 5) OPTIONAL DB SAVE -----------------------------------------------------
  if (args.save) {
    if (!newRows.length) {
      console.log('[mundosexanuncio] --save given but no NEW leads to upsert; skipping DB.');
    } else {
      console.log(`[mundosexanuncio] --save: upserting ${newRows.length} NEW leads into potential_professionals...`);
      try {
        const { inserted, existed } = await saveToDb(newRows);
        console.log(`[mundosexanuncio] DB done — inserted ${inserted}, already existed ${existed}`);
      } catch (e) {
        console.error('[mundosexanuncio] DB save failed:', e.message);
        process.exitCode = 1;
      }
    }
  } else {
    console.log('[mundosexanuncio] DRY RUN — no database connection opened. Re-run with --save to upsert.');
  }
})();
