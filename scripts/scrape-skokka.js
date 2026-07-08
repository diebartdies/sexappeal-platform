/*
 * scripts/scrape-skokka.js
 *
 * ACCURATE per-site adapter for Skokka (international escort directory with a
 * dedicated Argentina subdomain).
 *
 * WHY THIS EXISTS
 * ----------------
 * Skokka is a global classifieds platform (29 countries). A naive "load page,
 * regex every +54-looking string" scraper would (a) over-collect every phone on
 * the page and (b) have no country filter. This adapter mirrors
 * scripts/scrape-simpleescorts.js exactly: it stays on the Argentine subdomain,
 * discovers profile URLs from Argentine city listings, and reads the SPECIFIC
 * contact carried by each ad's structured data — never a whole-page regex.
 *
 * WHAT THIS DOES (per-site-adapter model)
 *   1. ARGENTINA FILTER = the site's OWN country classification. Skokka puts each
 *      country on its own subdomain; Argentina lives entirely on
 *      https://ar.skokka.com/ , so we never leave it. Each ad ALSO carries a
 *      schema.org PostalAddress with "addressCountry":"AR" (the site's own label)
 *      and the profile slug ends in -ar<id>. We assert addressCountry === 'AR'
 *      and that the contact normalises to an Argentine +54 mobile (guard #2).
 *   2. PROFILE DISCOVERY = crawl Argentine listing pages
 *      ( /escorts/capitalfederal/ and its barrio sub-listings, plus other AR
 *      cities ) and collect profile links matching /anuncio/<slug>-ar<id>/ ,
 *      deduped by the trailing ad id.
 *   3. REAL CONTACT EXTRACTION = on each /anuncio/ page:
 *        - primary:  schema.org Person JSON-LD -> "telephone" (+ "name",
 *                    address.addressRegion / addressLocality / addressCountry)
 *        - fallback: click #phone-button, wait for the toast that reveals the
 *                    number, read it from the toast's text content
 *        - fallback: the <title>, which is prefixed with the number
 *      alias = JSON-LD name / <h1>, province = addressRegion, city = locality.
 *
 * NOTE ON ANTI-BOT: ar.skokka.com sits behind Cloudflare ("Just a moment...").
 * A real (non-headless-detected) Chromium with a persistent userDataDir clears
 * the interstitial automatically after a few seconds; this script waits for it.
 *
 * SAFETY
 * ------
 * - DRY RUN by default: writes exports/skokka-leads.csv and touches NO database.
 *   Pass --save to upsert into potential_professionals.
 * - Small, polite volume: bounded --limit, delays between requests, dedupe.
 * - This is a validation/collection tool. Do NOT mass-run it.
 *
 * USAGE
 * -----
 *   node scripts/scrape-skokka.js                 # dry run, 10 profiles -> CSV
 *   node scripts/scrape-skokka.js --limit 5       # smaller sample
 *   node scripts/scrape-skokka.js --limit 25 --save   # also upsert to DB
 *   node scripts/scrape-skokka.js --out exports/foo.csv
 *   node scripts/scrape-skokka.js --headful       # watch the browser
 *   node scripts/scrape-skokka.js --proxy user:pass@host:port  # hide your IP
 *   node scripts/scrape-skokka.js --force         # re-fetch everything
 *
 * Flags:
 *   --limit N        max profiles to OPEN+extract (default 10)
 *   --listings N     max listing pages to crawl during discovery (default 8)
 *   --delay MS       polite delay between profile fetches (default 1500)
 *   --out PATH       output CSV path (default exports/skokka-leads.csv)
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

const ORIGIN = 'https://ar.skokka.com';
const USER_AGENT =
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36';

// Seed listing pages (the busiest Argentine cities). Discovery also pulls more
// barrio sub-listings from the Capital Federal page itself, but these guarantee
// a useful sample even if that crawl turns up nothing.
const SEED_LISTINGS = [
  '/escorts/capitalfederal/',
  '/escorts/buenosaires/',
  '/escorts/cordoba/',
  '/escorts/rosario/',
  '/escorts/mardelplata/',
  '/escorts/laplata/',
  '/escorts/mendoza/',
  '/escorts/santafe/'
];

// --- selectors / patterns discovered by inspecting the live DOM ---
const SEL_PROFILE_LINK = 'a[href*="/anuncio/"]'; // listing card -> profile URL
const SEL_LISTING_LINK = 'a[href*="/escorts/"]'; // city / barrio sub-listings
// Profile slugs end with -ar<id>, e.g. /anuncio/lulita-vip-ar1h2aukx/ .
const RE_AD_ID = /-(ar[a-z0-9]+)\/?$/i;
const MAX_PAGES_PER_LISTING = 20; // max listing pagination pages per listing
const PHONE_TOAST_SELECTORS = [
  '.PhoneToast', '.phone-toast', '[class*="PhoneToast"]', '[class*="phone-toast"]',
  '[class*="phone_number"]', '[class*="phoneNumber"]',
  '#phone-number', '.phone-number', '.phone', '.toast', '[role="alert"]',
  '.toast-message', '#toast', '[id*="toast" i]', '.snackbar', '.notification'
];

function parseArgs(argv) {
  const args = {
    limit: 10,
    listings: 8,
    delayMs: 1500,
    out: path.join('exports', 'skokka-leads.csv'),
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

// Skokka fronts every page with a Cloudflare "Just a moment..." interstitial.
// A persistent-profile Chromium clears it automatically; poll until the real
// page title/markup appears (or we give up). Non-fatal on timeout.
async function waitForCloudflare(page, maxMs = 25000) {
  const start = Date.now();
  while (Date.now() - start < maxMs) {
    const blocked = await page
      .evaluate(() => /just a moment|attention required|verifying you are human/i.test(document.title + ' ' + (document.body ? document.body.innerText.slice(0, 200) : '')))
      .catch(() => false);
    if (!blocked) return true;
    await sleep(1500);
  }
  return false;
}

// Best-effort: dismiss the cookie / age banner if present (non-fatal).
async function dismissBanners(page) {
  try {
    await page.evaluate(() => {
      const btns = Array.from(document.querySelectorAll('button, a'));
      const accept = btns.find((b) =>
        /^(aceptar|accept|entrar|ingresar|continuar|soy mayor)/i.test((b.textContent || '').trim())
      );
      if (accept) accept.click();
    });
  } catch (_) {}
}

// Click the phone button (#phone-button) and wait for the image/overlay that
// reveals the hidden phone number. Uses OCR to read the number from the image.
// Returns the raw digit string or null.
async function clickPhoneReveal(page) {
  try {
    const btnSel = '#phone-button, button.btn-phone, [id*="phone" i][id*="button" i]';
    const hasBtn = await page.$(btnSel);
    if (!hasBtn) return null;

    // Try data attributes first (some sites stash the number there)
    const dataPhone = await page.evaluate(() => {
      const btn = document.querySelector('#phone-button, button.btn-phone');
      if (!btn) return null;
      for (const attr of ['data-phone', 'data-number', 'data-telephone', 'data-value']) {
        const val = btn.getAttribute(attr);
        if (val) {
          const d = val.replace(/[^0-9]/g, '');
          if (d.length >= 8) return d;
        }
      }
      return null;
    });
    if (dataPhone) return dataPhone;

    // Click the button (Puppeteer auto-scrolls to it)
    await page.click(btnSel);

    // Wait for the image/toast/animation to appear
    await sleep(3000);

    // 1) Try known toast selectors (text-based)
    for (const sel of PHONE_TOAST_SELECTORS) {
      const el = await page.$(sel);
      if (el) {
        const text = await page.evaluate((e) => e.textContent, el);
        const digits = text.replace(/[^0-9]/g, '');
        if (digits.length >= 8 && digits.length <= 16) return digits;
      }
    }

    // 2) Check for newly appeared <a> links with phone hrefs
    const linkPhone = await page.evaluate(() => {
      for (const a of Array.from(document.querySelectorAll('a[href*="tel:"], a[href*="wa.me/"]'))) {
        const d = (a.getAttribute('href') || '').replace(/[^0-9]/g, '');
        if (d.length >= 8 && d.length <= 16) return d;
        const d2 = (a.textContent || '').replace(/[^0-9]/g, '');
        if (d2.length >= 8 && d2.length <= 16) return d2;
      }
      for (const a of Array.from(document.querySelectorAll('a'))) {
        const d = (a.textContent || '').replace(/[^0-9]/g, '');
        if (d.length >= 8 && d.length <= 16) return d;
      }
      return null;
    });
    if (linkPhone) return linkPhone;

    // 3) OCR — the primary path: the phone is displayed as an image
    const ocrResult = await (async () => {
      try {
        const Tesseract = require('tesseract.js');
        const sharp = require('sharp');

        // Collect candidate visible elements that may contain the phone image.
        // Prioritise images inside toast containers, then data-URL images,
        // then anything with "phone" in its attributes, then all visible images,
        // then canvases.
        const candidates = await page.evaluate(() => {
          const els = [];
          const add = (el, priority) => {
            const rect = el.getBoundingClientRect();
            if (rect.width < 20 || rect.height < 20) return;
            els.push({ priority, rect: { x: rect.x, y: rect.y, w: rect.width, h: rect.height } });
          };
          // Priority 0: images inside known toast containers
          for (const sel of ['.PhoneToast', '.phone-toast', '[class*="PhoneToast"]', '[class*="phone-toast"]', '.toast', '[role="alert"]', '.snackbar', '.notification', '.overlay']) {
            const c = document.querySelector(sel);
            if (c) c.querySelectorAll('img').forEach((img) => add(img, 0));
          }
          // Priority 1: data-URI images
          document.querySelectorAll('img[src^="data:"]').forEach((img) => add(img, 1));
          // Priority 2: images with phone/tel in attributes
          document.querySelectorAll('img').forEach((img) => {
            const attrs = ((img.getAttribute('src') || '') + ' ' + (img.className || '') + ' ' + (img.id || '') + ' ' + (img.getAttribute('alt') || '')).toLowerCase();
            if (/phone|number|tel/i.test(attrs)) add(img, 2);
          });
          // Priority 3: all visible images (broader fallback)
          document.querySelectorAll('img:not([src^="data:"])').forEach((img) => add(img, 3));
          // Priority 4: canvases
          document.querySelectorAll('canvas').forEach((c) => add(c, 4));
          return els.sort((a, b) => a.priority - b.priority);
        });

        for (const { rect } of candidates) {
          const clip = { x: Math.round(rect.x), y: Math.round(rect.y), width: Math.round(rect.w), height: Math.round(rect.h) };
          if (clip.width < 10 || clip.height < 10) continue;
          const buf = await page.screenshot({ clip });
          if (!buf || buf.length < 200) continue;
          const processed = await sharp(buf).resize(1600, null, { fit: 'contain' }).grayscale().normalize().png().toBuffer();
          const { data: { text } } = await Tesseract.recognize(processed, 'eng', {
            tessedit_char_whitelist: '0123456789+-() ',
            logger: () => {} // silence progress
          });
          const digits = (text || '').replace(/[^0-9]/g, '');
          if (digits.length >= 8 && digits.length <= 16) return digits;
        }

        // Fallback: screenshot the bottom 250px of viewport (where toasts land)
        const vp = page.viewport();
        if (vp) {
          const clip = { x: 0, y: Math.max(0, vp.height - 250), width: vp.width, height: 250 };
          const buf = await page.screenshot({ clip });
          if (buf && buf.length > 200) {
            const processed = await sharp(buf).resize(1600, null, { fit: 'contain' }).grayscale().normalize().png().toBuffer();
            const { data: { text } } = await Tesseract.recognize(processed, 'eng', {
              tessedit_char_whitelist: '0123456789+-() ',
              logger: () => {}
            });
            const digits = (text || '').replace(/[^0-9]/g, '');
            if (digits.length >= 8 && digits.length <= 16) return digits;
          }
        }
      } catch (_) {}
      return null;
    })();
    if (ocrResult) return ocrResult;

    // 4) Final fallback: scan all text nodes for phone-like digit sequences
    const found = await page.evaluate(() => {
      const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT, null, false);
      let node;
      while ((node = walker.nextNode())) {
        const text = node.textContent.trim();
        const m = text.match(/(\d[\d\s\-().]{7,}\d)/);
        if (m) {
          const d = m[1].replace(/[^0-9]/g, '');
          if (d.length >= 8 && d.length <= 16) return d;
        }
      }
      return null;
    });
    if (found) return found;
  } catch (_) {}
  return null;
}

// From the Capital Federal listing page, collect the barrio sub-listing URLs
// (e.g. /escorts/capitalfederal/palermo/) to broaden discovery. Same-origin so
// we inherit the page's cookies/headers.
async function discoverListingUrls(page, max) {
  const urls = [...SEED_LISTINGS];
  try {
    const resp = await page.goto(ORIGIN + SEED_LISTINGS[0], { waitUntil: 'domcontentloaded', timeout: 60000 });
    if (resp && resp.status() < 400) {
      await waitForCloudflare(page);
      await dismissBanners(page);
      const sublistings = await page.evaluate((sel) => {
        return Array.from(document.querySelectorAll(sel)).map((a) => a.href);
      }, SEL_LISTING_LINK);
      for (const u of sublistings) {
        try {
          const p = new URL(u).pathname;
          // city/barrio listings look like /escorts/<city>/ or /escorts/<city>/<barrio>/
          if (/^\/escorts\/[a-z0-9-]+\/([a-z0-9-]+\/)?$/i.test(p) && !urls.includes(p)) {
            urls.push(p);
          }
        } catch (_) {}
      }
    }
  } catch (_) {}
  return [...new Set(urls)].slice(0, Math.max(max, SEED_LISTINGS.length));
}

async function collectProfileUrls(page, listingPath, seenAdIds, maxProfiles) {
  const found = [];
  const baseUrl = ORIGIN + listingPath;
  for (let pageNum = 1; pageNum <= MAX_PAGES_PER_LISTING && found.length < maxProfiles; pageNum++) {
    const url = pageNum === 1 ? baseUrl : baseUrl + '?p=' + pageNum;
    try {
      const resp = await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 45000 });
      if (!resp || resp.status() >= 400) break;
      await waitForCloudflare(page);
      await dismissBanners(page);
      await sleep(800);
      const hrefs = await page.evaluate((sel) => {
        return Array.from(document.querySelectorAll(sel)).map((a) => a.href);
      }, SEL_PROFILE_LINK);
      if (hrefs.length === 0) break;
      let added = 0;
      for (const href of hrefs) {
        const id = adIdFromUrl(href);
        if (!id || seenAdIds.has(id)) continue;
        seenAdIds.add(id);
        found.push(href.split('#')[0].split('?')[0]);
        added++;
        if (found.length >= maxProfiles) break;
      }
      if (added === 0) break;
    } catch (_) { break; }
    await sleep(600);
  }
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
    await waitForCloudflare(page);
    await dismissBanners(page);
    const data = await page.evaluate(() => {
      const out = {};
      const clean = (s) => (s || '').replace(/\s+/g, ' ').trim();
      out.title = document.title || '';
      const h1 = document.querySelector('h1');
      out.h1 = clean(h1 ? h1.textContent : '');
      // primary: schema.org Person JSON-LD (telephone/name/address)
      out.jsonld = '';
      for (const s of Array.from(document.querySelectorAll('script[type="application/ld+json"]'))) {
        const txt = s.textContent || '';
        if (txt.includes('"telephone"') || txt.includes('"Person"')) {
          out.jsonld = txt;
          break;
        }
      }
      // fallback: tel: link if any
      const tel = document.querySelector('a[href^="tel:"]');
      out.tel = tel ? tel.getAttribute('href') || '' : '';
      return out;
    });

    // Parse the structured source (most reliable first).
    let ld = null;
    if (data.jsonld) {
      try {
        const parsed = JSON.parse(data.jsonld);
        const arr = Array.isArray(parsed)
          ? parsed
          : parsed['@graph'] && Array.isArray(parsed['@graph'])
          ? parsed['@graph']
          : [parsed];
        ld = arr.find((o) => o && (o['@type'] === 'Person' || o.telephone)) || arr[0] || null;
      } catch (_) {}
    }
    const addr = ld && ld.address && typeof ld.address === 'object' ? ld.address : {};
    const ldName = ld && typeof ld.name === 'string' ? ld.name.replace(/\s+/g, ' ').trim() : '';
    const ldRegion = typeof addr.addressRegion === 'string' ? addr.addressRegion.trim() : '';
    const ldLocality = typeof addr.addressLocality === 'string' ? addr.addressLocality.trim() : '';
    const ldCountry = typeof addr.addressCountry === 'string' ? addr.addressCountry.trim().toUpperCase() : '';

    // alias: prefer JSON-LD name, fall back to <h1>
    entry.alias = ldName || data.h1 || null;
    // province: JSON-LD addressRegion (e.g. "Capital Federal")
    entry.province = ldRegion || null;
    // city: addressLocality is e.g. "Capital Federal, Centro" -> take the barrio
    if (ldLocality) {
      const parts = ldLocality.split(',').map((s) => s.trim()).filter(Boolean);
      entry.city = parts.length > 1 ? parts[parts.length - 1] : parts[0];
    }
    if (!entry.city) entry.city = ldRegion || null;

    // Resolve the raw contact number from the most reliable source available:
    // JSON-LD telephone -> click phone button + read toast -> tel: -> <title> prefix.
    let raw = null;
    if (ld && ld.telephone) raw = String(ld.telephone).replace(/[^0-9]/g, '');
    if (!raw) raw = await clickPhoneReveal(page);
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

    // ARGENTINA GUARD #2: the contact must be an Argentine number.
    // Skokka stores phones in domestic form ("011" trunk + "15" mobile prefix,
    // e.g. 0111540306697), so a +54 guard here means: accept the site's domestic
    // form (leading 0), the international +54 form, or a bare 10-digit national
    // number — and reject anything carrying a non-54 country code. We ALSO
    // require the ad's own schema.org addressCountry to be "AR" when present.
    const digits = raw.replace(/[^0-9]/g, '');
    const looksArg =
      digits.startsWith('54') || // international +54 form
      digits.startsWith('0') || // Skokka's domestic 011... form
      digits.length === 10; // bare national form
    const countryOk = ldCountry === '' || ldCountry === 'AR'; // reject explicit non-AR
    const norm = normalizePhone(raw);
    if (norm.ok && looksArg && countryOk) {
      entry.phone = norm.phone; // 549 + 10 national digits
      entry.argentina = true;
    } else if (!countryOk) {
      entry.error = `non-AR country (${ldCountry})`;
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
    `[skokka] start — limit=${args.limit}, listings<=${args.listings}, delay=${args.delayMs}ms, mode=${
      args.save ? 'SAVE (DB upsert)' : 'DRY RUN (CSV only)'
    }`
  );

  // IP-SAFE: resolve the proxy (CLI --proxy or SCRAPE_PROXY env) and warn loudly
  // if none is set, since unproxied requests would expose the operator's IP.
  const proxy = parseProxy(args, process.env);
  if (proxy) {
    console.log(`[skokka] routing through proxy ${proxy.server}`);
  } else {
    console.log(
      '[skokka] WARNING: no proxy set — requests go out on your PUBLIC IP. Pass --proxy host:port or set SCRAPE_PROXY to hide it.'
    );
  }

  // RE-RUN SAFE: read what a previous run already captured so we can skip it.
  const existing = loadExisting(args.out);
  const skipPhones = new Set();
  if (args.force) {
    if (existing.rows.length) console.log(`[skokka] --force: ignoring ${existing.rows.length} existing rows, re-fetching all`);
  } else {
    for (const p of existing.phones) skipPhones.add(p);
    if (existing.rows.length) {
      console.log(`[skokka] incremental: ${existing.rows.length} already-captured ads will be skipped (use --force to re-fetch all)`);
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
      userDataDir: path.join(cacheDir, 'pptr-skokka'),
      args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage', ...proxyLaunchArgs(proxy)]
    });
  } catch (e) {
    console.error('[skokka] FAILED to launch Chromium:', e.message);
    process.exit(1);
  }

  const results = [];
  try {
    const page = await newPolitePage(browser, proxy);

    console.log(`[skokka] opening Argentina home: ${ORIGIN}/`);
    const home = await page.goto(ORIGIN + '/', { waitUntil: 'domcontentloaded', timeout: 60000 });
    await waitForCloudflare(page);
    console.log(`[skokka] home HTTP ${home && home.status()} — ${await page.title()}`);
    await dismissBanners(page);

    // 1) DISCOVERY ----------------------------------------------------------
    const listingUrls = await discoverListingUrls(page, args.listings);
    console.log(`[skokka] discovery across up to ${listingUrls.length} Argentine listing pages`);

    const seenAdIds = new Set();
    // INCREMENTAL: pre-seed the dedupe set with already-captured ad ids so they
    // are never re-discovered/re-opened (unless --force).
    if (!args.force) for (const id of existing.ids) seenAdIds.add(id);
    const profileUrls = [];
    for (const listing of listingUrls) {
      if (profileUrls.length >= args.limit) break;
      const remaining = args.limit - profileUrls.length;
      const found = await collectProfileUrls(page, listing, seenAdIds, remaining);
      if (found.length) {
        console.log(`[skokka]   ${listing} -> +${found.length} new ads (total ${profileUrls.length + found.length})`);
      }
      profileUrls.push(...found);
      await sleep(600);
    }

    const targets = profileUrls.slice(0, args.limit);
    console.log(`[skokka] discovered ${profileUrls.length} unique Argentine ads; extracting first ${targets.length}`);

    // 2) EXTRACTION ---------------------------------------------------------
    for (let i = 0; i < targets.length; i++) {
      const entry = await extractProfile(page, targets[i]);
      // INCREMENTAL: a re-posted ad (new id, same phone) — skip without counting.
      if (!args.force && entry.phone && skipPhones.has(entry.phone)) {
        console.log(`[skokka] (${i + 1}/${targets.length}) [DUP ] ${entry.alias || '(no alias)'} | already captured — skipping`);
        if (i < targets.length - 1) await sleep(args.delayMs);
        continue;
      }
      const tag = entry.phone ? 'OK ' : 'SKIP';
      console.log(
        `[skokka] (${i + 1}/${targets.length}) [${tag}] ${entry.alias || '(no alias)'} | ${entry.city ||
          '(no city)'} | ${entry.phone || entry.error}`
      );
      results.push(entry);
      if (i < targets.length - 1) await sleep(args.delayMs);
    }
  } catch (e) {
    console.error('[skokka] FATAL:', e.message);
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

  console.log('\n================ SKOKKA RESULTS ================');
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
  console.log(`\n[skokka] new this run: ${newRows.length}, total in file: ${totalInFile} -> ${outPath}`);

  // 5) OPTIONAL DB SAVE -----------------------------------------------------
  if (args.save) {
    if (!newRows.length) {
      console.log('[skokka] --save given but no NEW leads to upsert; skipping DB.');
    } else {
      console.log(`[skokka] --save: upserting ${newRows.length} NEW leads into potential_professionals...`);
      try {
        const { inserted, existed } = await saveToDb(newRows);
        console.log(`[skokka] DB done — inserted ${inserted}, already existed ${existed}`);
      } catch (e) {
        console.error('[skokka] DB save failed:', e.message);
        process.exitCode = 1;
      }
    }
  } else {
    console.log('[skokka] DRY RUN — no database connection opened. Re-run with --save to upsert.');
  }
})();
