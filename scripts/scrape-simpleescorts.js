/*
 * scripts/scrape-simpleescorts.js
 *
 * ACCURATE per-site adapter for SimpleEscort (our main lead source).
 *
 * WHY THIS EXISTS
 * ----------------
 * The legacy public/js/scrape_phones.js loads a site homepage, visits the first
 * ~25 internal links, and runs a broad Argentine-phone REGEX over the ENTIRE
 * page HTML. On an INTERNATIONAL directory like SimpleEscort that approach
 * massively over-collects: it grabs every phone-like string on the page (the
 * profile's own number, "related profiles", ads, site chrome, junk) and has NO
 * country filter, so it mixes in non-Argentine profiles. That is why our files
 * hold ~580 "simpleescorts" numbers when the site itself reports only ~158
 * Argentine ads.
 *
 * WHAT THIS DOES INSTEAD (the per-site-adapter model, generalised from
 * scripts/test-argxp.js):
 *   1. ARGENTINA FILTER = the site's OWN country classification. SimpleEscort
 *      segregates each country onto a subdomain; Argentina lives entirely on
 *      https://ar.simpleescort.com/ . We never leave that subdomain, so we can
 *      only ever collect Argentine ads. (We additionally assert the contact
 *      phone is +54 as a second guard.)
 *   2. PROFILE DISCOVERY = crawl Argentine listing pages ( /escorts/<city>/ and
 *      /escorts/<city>/tag/<tag>/ , enumerated from /landing_sitemap.xml ) and
 *      collect profile links matching /ad/<slug>-se<id>/ , deduped by ad id.
 *   3. REAL CONTACT EXTRACTION = on each /ad/ page we read the SPECIFIC contact
 *      element, not the whole page:
 *        - primary:  <button data-test="whatsapp-btn" onclick='handleWhatsappClick("54XXXXXXXXXX")'>
 *        - fallback: <a href="tel:+54-XXXXXXXXXX">
 *        - fallback: the page <title> which is prefixed with the number
 *      alias = <h1>, city = <h2>, adId = -se<id> in the URL.
 *
 * SAFETY
 * ------
 * - DRY RUN by default: writes exports/simpleescorts-leads.csv and touches NO
 *   database. Pass --save to upsert into potential_professionals.
 * - Small, polite volume: bounded --limit, delays between requests, dedupe.
 * - This is a validation/collection tool. Do NOT mass-run it.
 *
 * USAGE
 * -----
 *   node scripts/scrape-simpleescorts.js                 # dry run, 10 profiles -> CSV
 *   node scripts/scrape-simpleescorts.js --limit 5       # smaller sample
 *   node scripts/scrape-simpleescorts.js --limit 25 --save   # also upsert to DB
 *   node scripts/scrape-simpleescorts.js --out exports/foo.csv
 *   node scripts/scrape-simpleescorts.js --headful       # watch the browser
 *   node scripts/scrape-simpleescorts.js --proxy user:pass@host:port  # hide your IP
 *   node scripts/scrape-simpleescorts.js --force         # re-fetch everything
 *
 * Flags:
 *   --limit N        max profiles to OPEN+extract (default 10)
 *   --listings N     max listing pages to crawl during discovery (default 8)
 *   --delay MS       polite delay between profile fetches (default 1500)
 *   --out PATH       output CSV path (default exports/simpleescorts-leads.csv)
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

const ORIGIN = 'https://ar.simpleescort.com';
const USER_AGENT =
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36';

// Seed listing pages (the busiest Argentine cities). Discovery also pulls more
// listing URLs from /landing_sitemap.xml, but these guarantee a useful sample
// even if the sitemap is unreachable.
const SEED_LISTINGS = [
  '/escorts/buenos-aires/',
  '/escorts/capital-federal/',
  '/escorts/cordoba/',
  '/escorts/rosario/',
  '/escorts/mar-del-plata/',
  '/escorts/la-plata/',
  '/escorts/mendoza/',
  '/escorts/santa-fe/'
];

// --- selectors / patterns discovered by inspecting the live DOM ---
const SEL_PROFILE_LINK = 'a[href*="/ad/"]'; // listing card -> profile URL
const SEL_WHATSAPP_BTN = 'button[data-test="whatsapp-btn"]'; // has onclick=handleWhatsappClick("54...")
const RE_AD_ID = /-se(\d+)\/?$/i;
const RE_WA_ONCLICK = /handleWhatsappClick\(\s*['"]?(\d{6,})['"]?\s*\)/i;

function parseArgs(argv) {
  const args = {
    limit: 10,
    listings: 8,
    delayMs: 1500,
    out: path.join('exports', 'simpleescorts-leads.csv'),
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
      const btns = Array.from(document.querySelectorAll('button, a'));
      const accept = btns.find((b) =>
        /^(aceptar|accept|entrar|ingresar|continuar)$/i.test((b.textContent || '').trim())
      );
      if (accept) accept.click();
    });
  } catch (_) {}
}

// Pull additional Argentine listing URLs from the landing sitemap (same-origin
// fetch from inside the page so we inherit the browser's headers/cookies).
async function discoverListingUrls(page, max) {
  const urls = [...SEED_LISTINGS];
  try {
    const fromSitemap = await page.evaluate(async () => {
      const r = await fetch('/landing_sitemap.xml');
      if (!r.ok) return [];
      const t = await r.text();
      return [...t.matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => m[1]);
    });
    for (const u of fromSitemap) {
      try {
        const p = new URL(u).pathname;
        // Prefer plain city listings (no /tag/) first; they have the most ads.
        if (/^\/escorts\/[a-z0-9-]+\/$/i.test(p) && !urls.includes(p)) urls.unshift(p);
      } catch (_) {}
    }
    // Then allow tag listings to broaden coverage.
    for (const u of fromSitemap) {
      try {
        const p = new URL(u).pathname;
        if (/^\/escorts\/.+\/$/i.test(p) && !urls.includes(p)) urls.push(p);
      } catch (_) {}
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
      return Array.from(document.querySelectorAll(sel)).map((a) => a.href);
    }, SEL_PROFILE_LINK);
    for (const href of hrefs) {
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
      out.title = document.title || '';
      const h1 = document.querySelector('h1');
      const h2 = document.querySelector('h2');
      const clean = (s) => (s || '').replace(/\s+/g, ' ').trim();
      out.h1 = clean(h1 ? h1.textContent : '');
      out.h2 = clean(h2 ? h2.textContent : '');
      // primary: whatsapp button onclick
      const btn = document.querySelector(waSel);
      out.onclick = btn ? btn.getAttribute('onclick') || '' : '';
      out.dataAdId = btn ? btn.getAttribute('data-ad-id') || '' : '';
      // fallback: tel: link
      const tel = document.querySelector('a[href^="tel:"]');
      out.tel = tel ? tel.getAttribute('href') || '' : '';
      // MOST RELIABLE: schema.org Person JSON-LD (name, telephone, addressRegion)
      out.jsonld = '';
      for (const s of Array.from(document.querySelectorAll('script[type="application/ld+json"]'))) {
        const txt = s.textContent || '';
        if (txt.includes('"telephone"') || txt.includes('"Person"')) {
          out.jsonld = txt;
          break;
        }
      }
      // dataLayer push inside the per-ad whatsapp script: geo1_ad (province),
      // geo2_ad (city), ph_number (national digits).
      out.dataLayer = '';
      for (const s of Array.from(document.querySelectorAll('script'))) {
        const txt = s.textContent || '';
        if (txt.includes('geo1_ad') && txt.includes('ph_number')) {
          out.dataLayer = txt;
          break;
        }
      }
      return out;
    }, SEL_WHATSAPP_BTN);

    // Parse the structured sources (most reliable first).
    let ld = null;
    if (data.jsonld) {
      try {
        const parsed = JSON.parse(data.jsonld);
        const arr = Array.isArray(parsed) ? parsed : (parsed['@graph'] && Array.isArray(parsed['@graph']) ? parsed['@graph'] : [parsed]);
        ld = arr.find((o) => o && (o['@type'] === 'Person' || o.telephone)) || arr[0] || null;
      } catch (_) {}
    }
    const dl = {};
    if (data.dataLayer) {
      const grab = (k) => {
        const m = data.dataLayer.match(new RegExp(k + '\\s*:\\s*"([^"]*)"'));
        return m ? m[1].trim() : null;
      };
      dl.province = grab('geo1_ad');
      dl.city = grab('geo2_ad');
      dl.phone = grab('ph_number');
    }

    const ldName = ld && typeof ld.name === 'string' ? ld.name.replace(/\s+/g, ' ').trim() : '';
    const ldRegion = ld && ld.address && typeof ld.address.addressRegion === 'string' ? ld.address.addressRegion.trim() : '';

    // alias: prefer JSON-LD name, fall back to <h1>
    entry.alias = ldName || data.h1 || null;
    // province: only the dataLayer exposes geo1 (province); fall back to null
    entry.province = dl.province || null;
    // city: prefer dataLayer geo2, then JSON-LD region, then <h2>
    entry.city = dl.city || ldRegion || data.h2 || null;

    // Resolve the raw contact number from the most reliable source available:
    // JSON-LD telephone -> whatsapp onclick -> dataLayer ph_number -> tel: -> title.
    let raw = null;
    if (ld && ld.telephone) raw = String(ld.telephone).replace(/[^0-9]/g, '');
    if (!raw) {
      const mClick = data.onclick && data.onclick.match(RE_WA_ONCLICK);
      if (mClick) raw = mClick[1];
    }
    if (!raw && dl.phone) raw = dl.phone.replace(/[^0-9]/g, '');
    if (!raw && data.tel) raw = data.tel.replace(/[^0-9]/g, '');
    if (!raw && data.title) {
      const mTitle = data.title.match(/(\d{8,})/);
      if (mTitle) raw = mTitle[1];
    }
    entry.rawPhone = raw;

    if (!raw) {
      entry.error = 'no contact element found';
      return entry;
    }

    // ARGENTINA GUARD #2: SimpleEscort exposes Argentine contacts as +54.
    // The onclick / tel forms are "54" + 10 national digits. Reject anything
    // that does not normalise to an Argentine 549 + 10 number.
    const digits = raw.replace(/[^0-9]/g, '');
    const looksArg =
      digits.startsWith('54') || // international form from the site
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
    `[simpleescort] start — limit=${args.limit}, listings<=${args.listings}, delay=${args.delayMs}ms, mode=${
      args.save ? 'SAVE (DB upsert)' : 'DRY RUN (CSV only)'
    }`
  );

  // IP-SAFE: resolve the proxy (CLI --proxy or SCRAPE_PROXY env) and warn loudly
  // if none is set, since unproxied requests would expose the operator's IP.
  const proxy = parseProxy(args, process.env);
  if (proxy) {
    console.log(`[simpleescort] routing through proxy ${proxy.server}`);
  } else {
    console.log(
      '[simpleescort] WARNING: no proxy set — requests go out on your PUBLIC IP. Pass --proxy host:port or set SCRAPE_PROXY to hide it.'
    );
  }

  // RE-RUN SAFE: read what a previous run already captured so we can skip it.
  const existing = loadExisting(args.out);
  const skipPhones = new Set();
  if (args.force) {
    if (existing.rows.length) console.log(`[simpleescort] --force: ignoring ${existing.rows.length} existing rows, re-fetching all`);
  } else {
    for (const p of existing.phones) skipPhones.add(p);
    if (existing.rows.length) {
      console.log(`[simpleescort] incremental: ${existing.rows.length} already-captured ads will be skipped (use --force to re-fetch all)`);
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
      userDataDir: path.join(cacheDir, 'pptr-simpleescort'),
      args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage', ...proxyLaunchArgs(proxy)]
    });
  } catch (e) {
    console.error('[simpleescort] FAILED to launch Chromium:', e.message);
    process.exit(1);
  }

  const results = [];
  try {
    const page = await newPolitePage(browser, proxy);

    console.log(`[simpleescort] opening Argentina home: ${ORIGIN}/`);
    const home = await page.goto(ORIGIN + '/', { waitUntil: 'domcontentloaded', timeout: 60000 });
    console.log(`[simpleescort] home HTTP ${home && home.status()} — ${await page.title()}`);
    await dismissBanners(page);

    // 1) DISCOVERY ----------------------------------------------------------
    const listingUrls = await discoverListingUrls(page, args.listings);
    console.log(`[simpleescort] discovery across up to ${listingUrls.length} Argentine listing pages`);

    const seenAdIds = new Set();
    // INCREMENTAL: pre-seed the dedupe set with already-captured ad ids so they
    // are never re-discovered/re-opened (unless --force).
    if (!args.force) for (const id of existing.ids) seenAdIds.add(id);
    const profileUrls = [];
    for (const listing of listingUrls) {
      if (profileUrls.length >= args.limit) break;
      const found = await collectProfileUrls(page, listing, seenAdIds);
      if (found.length) {
        console.log(`[simpleescort]   ${listing} -> +${found.length} new ads (total ${profileUrls.length + found.length})`);
      }
      profileUrls.push(...found);
      await sleep(600);
    }

    const targets = profileUrls.slice(0, args.limit);
    console.log(`[simpleescort] discovered ${profileUrls.length} unique Argentine ads; extracting first ${targets.length}`);

    // 2) EXTRACTION ---------------------------------------------------------
    for (let i = 0; i < targets.length; i++) {
      const entry = await extractProfile(page, targets[i]);
      // INCREMENTAL: a re-posted ad (new id, same phone) — skip without counting.
      if (!args.force && entry.phone && skipPhones.has(entry.phone)) {
        console.log(`[simpleescort] (${i + 1}/${targets.length}) [DUP ] ${entry.alias || '(no alias)'} | already captured — skipping`);
        if (i < targets.length - 1) await sleep(args.delayMs);
        continue;
      }
      const tag = entry.phone ? 'OK ' : 'SKIP';
      console.log(
        `[simpleescort] (${i + 1}/${targets.length}) [${tag}] ${entry.alias || '(no alias)'} | ${entry.city ||
          '(no city)'} | ${entry.phone || entry.error}`
      );
      results.push(entry);
      if (i < targets.length - 1) await sleep(args.delayMs);
    }
  } catch (e) {
    console.error('[simpleescort] FATAL:', e.message);
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

  console.log('\n================ SIMPLEESCORT RESULTS ================');
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
      [r.phone, r.alias || '', 'https://ar.simpleescort.com', 'pending', r.province || '', r.city || '', r.adId || '', r.profileUrl]
        .map(csvEscape)
        .join(',')
    );
  }
  fs.writeFileSync(outPath, lines.join('\n') + '\n', 'utf8');
  const totalInFile = lines.length - 1;
  console.log(`\n[simpleescort] new this run: ${newRows.length}, total in file: ${totalInFile} -> ${outPath}`);

  // 5) OPTIONAL DB SAVE -----------------------------------------------------
  if (args.save) {
    if (!newRows.length) {
      console.log('[simpleescort] --save given but no NEW leads to upsert; skipping DB.');
    } else {
      console.log(`[simpleescort] --save: upserting ${newRows.length} NEW leads into potential_professionals...`);
      try {
        const { inserted, existed } = await saveToDb(newRows);
        console.log(`[simpleescort] DB done — inserted ${inserted}, already existed ${existed}`);
      } catch (e) {
        console.error('[simpleescort] DB save failed:', e.message);
        process.exitCode = 1;
      }
    }
  } else {
    console.log('[simpleescort] DRY RUN — no database connection opened. Re-run with --save to upsert.');
  }
})();
