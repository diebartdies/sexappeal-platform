/*
 * scripts/scrape-tacosaltos.js
 *
 * ACCURATE per-site adapter for Tacosaltos.com (an Argentine escort directory).
 *
 * WHY THIS EXISTS
 * ----------------
 * The legacy public/js/scrape_phones.js runs a broad Argentine-phone REGEX over
 * the WHOLE page. On Tacosaltos that over-collects badly: every profile page
 * shows the SITE'S OWN contact number in the header ("11 5666-3457"), a sidebar
 * of ~50 other girls, and "related" links — a whole-page regex would mix the
 * site number and unrelated profiles into each lead. This adapter follows the
 * per-site-adapter model proven by scripts/scrape-simpleescorts.js: it reads the
 * ONE specific contact element that belongs to the profile being viewed.
 *
 * WHAT THIS DOES (mirrors the SimpleEscort adapter)
 *   1. ARGENTINA FILTER = the site is Argentina-only (Buenos Aires / CABA + GBA,
 *      plus a Costa Atlántica and a Neuquén section). We additionally assert the
 *      contact phone is +54 as a second guard.
 *   2. PROFILE DISCOVERY = crawl the category listing pages ( /escorts, /mujeres,
 *      /maduras, /masajistas, /Escorts-Trans, ... ) and collect profile links.
 *      A profile URL is a TWO-segment path whose first segment is a known
 *      category ( /<category>/<slug> ), e.g.
 *        https://www.tacosaltos.com/mujeres/romy-escort-nivel-vip-zona-villa-urquiza
 *      Deduped by the slug (last path segment).
 *   3. REAL CONTACT EXTRACTION = on each profile we read the SPECIFIC contact
 *      element, NOT the whole page:
 *        - primary:  the advertiser WhatsApp button
 *                    <a href="https://api.whatsapp.com/send?phone=+54...&text=Hola <Name>, ...">
 *                    (profile-specific — the "Hola <Name>" greeting disambiguates
 *                     it from the site's own header number).
 *        - fallback: the "Telefono:" detail row
 *                    <li><span class="detail-title">Telefono:</span><span>11-XXXX-XXXX</span></li>
 *        - fallback: <a href="tel:+54...">  (the "LLamar" button)
 *      alias = the "Hola <Name>" from the WhatsApp text (fallback: the slug),
 *      city  = the "Zona:" detail row, province = Buenos Aires (Neuquén for the
 *      Provincia-Neuquen section).
 *      (Tacosaltos profiles expose NO schema.org JSON-LD, so the WhatsApp link /
 *      "Telefono:" row ARE the structured contact source here.)
 *
 * SAFETY
 * ------
 * - DRY RUN by default: writes exports/tacosaltos-leads.csv and touches NO
 *   database. Pass --save to upsert into potential_professionals.
 * - Small, polite volume: bounded --limit, delays between requests, dedupe.
 * - This is a validation/collection tool. Do NOT mass-run it.
 *
 * USAGE
 * -----
 *   node scripts/scrape-tacosaltos.js                 # dry run, 10 profiles -> CSV
 *   node scripts/scrape-tacosaltos.js --limit 5       # smaller sample
 *   node scripts/scrape-tacosaltos.js --limit 25 --save   # also upsert to DB
 *   node scripts/scrape-tacosaltos.js --out exports/foo.csv
 *   node scripts/scrape-tacosaltos.js --headful       # watch the browser
 *   node scripts/scrape-tacosaltos.js --proxy user:pass@host:port  # hide your IP
 *   node scripts/scrape-tacosaltos.js --force         # re-fetch everything
 *
 * Flags:
 *   --limit N        max profiles to OPEN+extract (default 10)
 *   --listings N     max listing pages to crawl during discovery (default 8)
 *   --delay MS       polite delay between profile fetches (default 1500)
 *   --out PATH       output CSV path (default exports/tacosaltos-leads.csv)
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

const ORIGIN = 'https://www.tacosaltos.com';
const USER_AGENT =
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36';

// Seed listing pages. /escorts is the busy aggregate; the others broaden the
// category coverage. Each lists profile cards as /<category>/<slug> links.
const SEED_LISTINGS = [
  '/escorts',
  '/mujeres',
  '/maduras',
  '/masajistas',
  '/Escorts-Trans',
  '/escorts-con-videos-xxx-gratis-hots-porno',
  '/Costa-argentina',
  '/Provincia-Neuquen'
];

// The first path segment of a real profile URL is always one of these category
// slugs. Anything else ( /zona-escorts/<zone>, /ver-experiencias, ... ) is a
// listing/utility page, not a profile.
const PROFILE_CATEGORIES = new Set([
  'mujeres',
  'maduras',
  'masajistas',
  'escorts-trans',
  'escorts-con-videos-xxx-gratis-hots-porno',
  'costa-argentina',
  'provincia-neuquen'
]);

const RE_WA_PHONE = /[?&]phone=\+?(\d{6,})/i;
const RE_HOLA = /hola\s+([^,!.\n]{1,40})/i;

function parseArgs(argv) {
  const args = {
    limit: 10,
    listings: 8,
    delayMs: 1500,
    out: path.join('exports', 'tacosaltos-leads.csv'),
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

// Is this a real /<category>/<slug> profile URL (not a listing/utility page)?
function isProfileUrl(url) {
  try {
    const u = new URL(url, ORIGIN);
    if (u.hostname.replace(/^www\./, '') !== 'tacosaltos.com') return false;
    const segs = u.pathname.replace(/\/+$/, '').split('/').filter(Boolean);
    if (segs.length !== 2) return false;
    return PROFILE_CATEGORIES.has(segs[0].toLowerCase());
  } catch (_) {
    return false;
  }
}

function provinceFor(url) {
  try {
    const p = new URL(url, ORIGIN).pathname.toLowerCase();
    if (p.includes('neuquen')) return 'Neuquén';
    if (p.includes('costa')) return 'Costa Atlántica';
    return 'Buenos Aires';
  } catch (_) {
    return 'Buenos Aires';
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
    const hrefs = await page.evaluate(() =>
      Array.from(document.querySelectorAll('a[href]')).map((a) => a.href)
    );
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
    province: provinceFor(profileUrl),
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
      // PRIMARY: the advertiser WhatsApp button. Its greeting "Hola <Name>"
      // ties it to THIS profile (so we never pick up the site header number).
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
      // FALLBACK: the structured "Telefono:" detail row.
      out.telefonoField = '';
      for (const li of Array.from(document.querySelectorAll('li'))) {
        const title = li.querySelector('.detail-title');
        if (title && /tel[eé]fono/i.test(title.textContent || '')) {
          const val = title.nextElementSibling;
          out.telefonoField = clean(val ? val.textContent : li.textContent.replace(title.textContent, ''));
          break;
        }
      }
      // FALLBACK: tel: link (the "LLamar" button).
      const tel = document.querySelector('a[href^="tel:"]');
      out.tel = tel ? tel.getAttribute('href') || '' : '';
      // city: the structured "Zona:" detail row.
      out.zona = '';
      for (const li of Array.from(document.querySelectorAll('li'))) {
        const title = li.querySelector('.detail-title');
        if (title && /^\s*zona/i.test(title.textContent || '')) {
          const val = title.nextElementSibling;
          out.zona = clean(val ? val.textContent : '');
          break;
        }
      }
      return out;
    });

    // Resolve the contact number from the most reliable source first.
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
    if (!raw && data.telefonoField) raw = data.telefonoField.replace(/[^0-9]/g, '');
    if (!raw && data.tel) raw = data.tel.replace(/[^0-9]/g, '');

    entry.rawPhone = raw;
    entry.city = data.zona || null;
    // alias: WhatsApp greeting, else a Title-Cased first token of the slug.
    if (!alias) {
      const slug = entry.adId || '';
      const firstWord = slug.split('-')[0];
      alias = firstWord ? firstWord.charAt(0).toUpperCase() + firstWord.slice(1) : null;
    }
    entry.alias = alias;

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
    `[tacosaltos] start — limit=${args.limit}, listings<=${args.listings}, delay=${args.delayMs}ms, mode=${
      args.save ? 'SAVE (DB upsert)' : 'DRY RUN (CSV only)'
    }`
  );

  // IP-SAFE: resolve the proxy (CLI --proxy or SCRAPE_PROXY env) and warn loudly
  // if none is set, since unproxied requests would expose the operator's IP.
  const proxy = parseProxy(args, process.env);
  if (proxy) {
    console.log(`[tacosaltos] routing through proxy ${proxy.server}`);
  } else {
    console.log(
      '[tacosaltos] WARNING: no proxy set — requests go out on your PUBLIC IP. Pass --proxy host:port or set SCRAPE_PROXY to hide it.'
    );
  }

  // RE-RUN SAFE: read what a previous run already captured so we can skip it.
  const existing = loadExisting(args.out);
  const skipPhones = new Set();
  if (args.force) {
    if (existing.rows.length) console.log(`[tacosaltos] --force: ignoring ${existing.rows.length} existing rows, re-fetching all`);
  } else {
    for (const p of existing.phones) skipPhones.add(p);
    if (existing.rows.length) {
      console.log(`[tacosaltos] incremental: ${existing.rows.length} already-captured ads will be skipped (use --force to re-fetch all)`);
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
      userDataDir: path.join(cacheDir, 'pptr-tacosaltos'),
      args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage', ...proxyLaunchArgs(proxy)]
    });
  } catch (e) {
    console.error('[tacosaltos] FAILED to launch Chromium:', e.message);
    process.exit(1);
  }

  const results = [];
  try {
    const page = await newPolitePage(browser, proxy);

    console.log(`[tacosaltos] opening home: ${ORIGIN}/escorts`);
    const home = await page.goto(ORIGIN + '/escorts', { waitUntil: 'domcontentloaded', timeout: 60000 });
    console.log(`[tacosaltos] home HTTP ${home && home.status()} — ${await page.title()}`);
    await dismissBanners(page);

    // 1) DISCOVERY ----------------------------------------------------------
    const listingUrls = SEED_LISTINGS.slice(0, Math.max(args.listings, 1));
    console.log(`[tacosaltos] discovery across up to ${listingUrls.length} listing pages`);

    const seenSlugs = new Set();
    // INCREMENTAL: pre-seed the dedupe set with already-captured slugs so they
    // are never re-discovered/re-opened (unless --force).
    if (!args.force) for (const id of existing.ids) seenSlugs.add(id);
    const profileUrls = [];
    for (const listing of listingUrls) {
      if (profileUrls.length >= args.limit) break;
      const found = await collectProfileUrls(page, listing, seenSlugs);
      if (found.length) {
        console.log(`[tacosaltos]   ${listing} -> +${found.length} new profiles (total ${profileUrls.length + found.length})`);
      }
      profileUrls.push(...found);
      await sleep(600);
    }

    const targets = profileUrls.slice(0, args.limit);
    console.log(`[tacosaltos] discovered ${profileUrls.length} unique profiles; extracting first ${targets.length}`);

    // 2) EXTRACTION ---------------------------------------------------------
    for (let i = 0; i < targets.length; i++) {
      const entry = await extractProfile(page, targets[i]);
      // INCREMENTAL: a re-posted ad (new slug, same phone) — skip without counting.
      if (!args.force && entry.phone && skipPhones.has(entry.phone)) {
        console.log(`[tacosaltos] (${i + 1}/${targets.length}) [DUP ] ${entry.alias || '(no alias)'} | already captured — skipping`);
        if (i < targets.length - 1) await sleep(args.delayMs);
        continue;
      }
      const tag = entry.phone ? 'OK ' : 'SKIP';
      console.log(
        `[tacosaltos] (${i + 1}/${targets.length}) [${tag}] ${entry.alias || '(no alias)'} | ${entry.city ||
          '(no city)'} | ${entry.phone || entry.error}`
      );
      results.push(entry);
      if (i < targets.length - 1) await sleep(args.delayMs);
    }
  } catch (e) {
    console.error('[tacosaltos] FATAL:', e.message);
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

  console.log('\n================ TACOSALTOS RESULTS ================');
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
  console.log(`\n[tacosaltos] new this run: ${newRows.length}, total in file: ${totalInFile} -> ${outPath}`);

  // 5) OPTIONAL DB SAVE -----------------------------------------------------
  if (args.save) {
    if (!newRows.length) {
      console.log('[tacosaltos] --save given but no NEW leads to upsert; skipping DB.');
    } else {
      console.log(`[tacosaltos] --save: upserting ${newRows.length} NEW leads into potential_professionals...`);
      try {
        const { inserted, existed } = await saveToDb(newRows);
        console.log(`[tacosaltos] DB done — inserted ${inserted}, already existed ${existed}`);
      } catch (e) {
        console.error('[tacosaltos] DB save failed:', e.message);
        process.exitCode = 1;
      }
    }
  } else {
    console.log('[tacosaltos] DRY RUN — no database connection opened. Re-run with --save to upsert.');
  }
})();
