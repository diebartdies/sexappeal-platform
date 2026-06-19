/*
 * scripts/scrape-gemidos.js
 *
 * ACCURATE per-site adapter for Gemidos.tv (an additional lead source).
 *
 * WHY THIS EXISTS
 * ----------------
 * Gemidos.tv is an INTERNATIONAL directory: every country lives under its own
 * top-level path (/argentina, /brasil, /chile, /espana, /mexico, ...). A naive
 * whole-page phone regex (like the legacy public/js/scrape_phones.js) would
 * over-collect — it would grab "related profiles", site chrome and, worst of
 * all, NON-Argentine numbers (Brazil +55, Chile +56, ...). This adapter follows
 * the same per-site-adapter model proven by scripts/scrape-simpleescorts.js.
 *
 * WHAT THIS DOES (mirrors the SimpleEscort adapter)
 *   1. ARGENTINA FILTER = the site's OWN country classification. Gemidos.tv
 *      segregates each country onto a URL path prefix; Argentina lives under
 *      /argentina and its province sub-listings /argentina-<province>[...]. We
 *      NEVER crawl any other country path, so we can only collect Argentine
 *      ads. (We additionally assert the contact phone is +54 as a second guard.)
 *   2. PROFILE DISCOVERY = crawl the Argentine section ( /argentina plus busy
 *      province listings ) and collect profile cards. Each card is an
 *      <a class="story"> carrying data-pub_link (profile URL), data-pub_id
 *      (stable ad id) and data-pub_title (alias). Deduped by data-pub_id.
 *   3. REAL CONTACT EXTRACTION = on each profile page we read the SPECIFIC
 *      contact element, not the whole page. The canonical contact phone is
 *      carried as STRUCTURED DATA on the WhatsApp trigger:
 *        - primary:  <div data-trigger="Whatsapp.send"
 *                         data-whatsapp-phone="549XXXXXXXXXX"
 *                         data-stats_value="<pubId>"> ... </div>
 *        - fallback: <a href="tel://+549XXXXXXXXXX">
 *        - fallback: the visible <span>+549XXXXXXXXXX</span>
 *      alias = <h1> (the profile name, e.g. "Rebekka Freya"), and province /
 *      city come from the Argentine breadcrumb links ( /argentina-<province>
 *      ... -<city> ), with the "I'm located in ..." heading as a fallback.
 *      (Gemidos profiles expose NO schema.org JSON-LD and no dataLayer, so the
 *      data-whatsapp-* attributes ARE the structured source here.)
 *
 * SAFETY
 * ------
 * - DRY RUN by default: writes exports/gemidos-leads.csv and touches NO
 *   database. Pass --save to upsert into potential_professionals.
 * - Small, polite volume: bounded --limit, delays between requests, dedupe.
 * - This is a validation/collection tool. Do NOT mass-run it.
 *
 * USAGE
 * -----
 *   node scripts/scrape-gemidos.js                  # dry run, 10 profiles -> CSV
 *   node scripts/scrape-gemidos.js --limit 5        # smaller sample
 *   node scripts/scrape-gemidos.js --limit 25 --save    # also upsert to DB
 *   node scripts/scrape-gemidos.js --out exports/foo.csv
 *   node scripts/scrape-gemidos.js --headful        # watch the browser
 *   node scripts/scrape-gemidos.js --proxy user:pass@host:port  # hide your IP
 *   node scripts/scrape-gemidos.js --force          # re-fetch everything
 *
 * Flags:
 *   --limit N        max profiles to OPEN+extract (default 10)
 *   --listings N     max listing pages to crawl during discovery (default 8)
 *   --delay MS       polite delay between profile fetches (default 1500)
 *   --out PATH       output CSV path (default exports/gemidos-leads.csv)
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

const ORIGIN = 'https://gemidos.tv';
const USER_AGENT =
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36';

// Seed Argentine listing pages. /argentina is the country landing (hundreds of
// ads on its own); the province listings broaden coverage. Discovery stays
// entirely within the /argentina* namespace — that is the country filter.
const SEED_LISTINGS = [
  '/argentina',
  '/argentina-capital-federal',
  '/argentina-buenos-aires',
  '/argentina-cordoba',
  '/argentina-santa-fe-rosario',
  '/argentina-buenos-aires-mar-del-plata',
  '/argentina-mendoza',
  '/argentina-tucuman'
];

// --- selectors / patterns discovered by inspecting the live DOM ---
// Listing profile card: <a class="story" data-pub_link data-pub_id data-pub_title>
const SEL_PROFILE_CARD = 'a.story[data-pub_link]';
// Profile contact: <div data-trigger="Whatsapp.send" data-whatsapp-phone="549..." data-stats_value="<pubId>">
const SEL_WHATSAPP = '[data-whatsapp-phone]';
const RE_PUB_FROM_TEXT = /\/pub\/(\d+)/; // data-whatsapp-text embeds .../pub/<pubId>
// Only Argentine breadcrumb links carry province/city (hyphenated path form).
const RE_AR_CRUMB = /^\/argentina-/;

function parseArgs(argv) {
  const args = {
    limit: 10,
    listings: 8,
    delayMs: 1500,
    out: path.join('exports', 'gemidos-leads.csv'),
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
        /^(aceptar|accept|entrar|ingresar|continuar|enter|agree)$/i.test((b.textContent || '').trim())
      );
      if (accept) accept.click();
    });
  } catch (_) {}
}

// Collect profile cards from one Argentine listing page. Each card carries the
// stable pub id (data-pub_id), the profile URL (data-pub_link) and the alias
// (data-pub_title). Dedupe across listings by pub id.
async function collectProfileCards(page, listingPath, seenPubIds) {
  const found = [];
  try {
    const resp = await page.goto(ORIGIN + listingPath, {
      waitUntil: 'domcontentloaded',
      timeout: 45000
    });
    if (!resp || resp.status() >= 400) return found;
    await dismissBanners(page);
    await sleep(800);
    const cards = await page.evaluate((sel) => {
      return Array.from(document.querySelectorAll(sel)).map((a) => ({
        pubId: a.getAttribute('data-pub_id') || '',
        link: a.getAttribute('data-pub_link') || a.href || '',
        title: (a.getAttribute('data-pub_title') || '').replace(/\s+/g, ' ').trim()
      }));
    }, SEL_PROFILE_CARD);
    for (const c of cards) {
      if (!c.link || !c.pubId || seenPubIds.has(c.pubId)) continue;
      seenPubIds.add(c.pubId);
      found.push({
        profileUrl: c.link.split('#')[0].split('?')[0],
        pubId: c.pubId,
        title: c.title
      });
    }
  } catch (_) {}
  return found;
}

async function extractProfile(page, card) {
  const entry = {
    profileUrl: card.profileUrl,
    adId: card.pubId || null,
    rawPhone: null,
    phone: null,
    alias: card.title || null,
    province: null,
    city: null,
    status: null,
    error: null,
    argentina: false
  };
  try {
    const r = await page.goto(card.profileUrl, { waitUntil: 'domcontentloaded', timeout: 45000 });
    entry.status = r && r.status();
    if (!r || r.status() >= 400) {
      entry.error = `HTTP ${entry.status}`;
      return entry;
    }
    await dismissBanners(page);
    const data = await page.evaluate(
      (waSel, arCrumbReSrc) => {
        const out = {};
        const clean = (s) => (s || '').replace(/\s+/g, ' ').trim();
        const h1 = document.querySelector('h1');
        out.h1 = clean(h1 ? h1.textContent : '');

        // PRIMARY structured contact source: the WhatsApp trigger element.
        const wa = document.querySelector(waSel);
        out.waPhone = wa ? wa.getAttribute('data-whatsapp-phone') || '' : '';
        out.waText = wa ? wa.getAttribute('data-whatsapp-text') || '' : '';
        out.waStats = wa ? wa.getAttribute('data-stats_value') || '' : '';

        // fallback contacts
        const tel = document.querySelector('a[href^="tel:"]');
        out.tel = tel ? tel.getAttribute('href') || '' : '';
        const span = Array.from(document.querySelectorAll('span')).find((s) =>
          /^\+?\d[\d\s]{7,}$/.test(clean(s.textContent))
        );
        out.span = span ? clean(span.textContent) : '';

        // province / city from the Argentine breadcrumb links. Path depth
        // increases from province -> city -> neighbourhood; take the shallowest
        // as province and the deepest as city.
        const re = new RegExp(arCrumbReSrc);
        const crumbInfo = [];
        for (const a of Array.from(document.querySelectorAll('a'))) {
          const h = a.getAttribute('href') || '';
          if (re.test(h) && !/\/categoria|\/servicio/.test(h)) {
            crumbInfo.push({
              depth: (h.match(/-/g) || []).length,
              text: clean(a.textContent).replace(/^Escorts?\s+/i, '')
            });
          }
        }
        out.crumbCount = crumbInfo.length;
        if (crumbInfo.length) {
          const sorted = crumbInfo.slice().sort((a, b) => a.depth - b.depth);
          out.province = sorted[0].text || '';
          out.city = sorted[sorted.length - 1].text || '';
        } else {
          out.province = '';
          out.city = '';
        }

        // raw "I'm located in <City> <Province> <Country>" heading (fallback)
        const locH = Array.from(document.querySelectorAll('h5')).find((h) =>
          /located in/i.test(h.textContent || '')
        );
        out.locHeading = locH ? clean(locH.textContent) : '';
        return out;
      },
      SEL_WHATSAPP,
      RE_AR_CRUMB.source
    );

    // alias: prefer the on-page <h1> (the real profile name), fall back to the
    // listing card title.
    entry.alias = data.h1 || entry.alias || null;
    entry.province = data.province || null;
    entry.city = data.city || null;

    // Resolve the raw contact number from the most reliable source available:
    // data-whatsapp-phone (structured) -> tel: link -> visible span.
    let raw = null;
    if (data.waPhone) raw = data.waPhone.replace(/[^0-9]/g, '');
    if (!raw && data.tel) raw = data.tel.replace(/[^0-9]/g, '');
    if (!raw && data.span) raw = data.span.replace(/[^0-9]/g, '');
    entry.rawPhone = raw;

    // AdId: prefer the WhatsApp trigger's data-stats_value / pub link, else the
    // pub id collected from the listing card.
    if (data.waStats) entry.adId = data.waStats;
    else if (data.waText) {
      const m = data.waText.match(RE_PUB_FROM_TEXT);
      if (m) entry.adId = m[1];
    }

    if (!raw) {
      entry.error = 'no contact element found';
      return entry;
    }

    // ARGENTINA GUARD #2: Gemidos exposes Argentine contacts as +54 (the
    // data-whatsapp-phone is "549" + 10 national digits). Reject anything that
    // does not begin with the Argentine country code or that fails to normalise
    // to an Argentine 549 + 10 number (e.g. Brazil +55, Chile +56).
    const digits = raw.replace(/[^0-9]/g, '');
    const looksArg = digits.startsWith('54') || digits.length === 10; // intl 54... or bare national
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
    `[gemidos] start — limit=${args.limit}, listings<=${args.listings}, delay=${args.delayMs}ms, mode=${
      args.save ? 'SAVE (DB upsert)' : 'DRY RUN (CSV only)'
    }`
  );

  // IP-SAFE: resolve the proxy (CLI --proxy or SCRAPE_PROXY env) and warn loudly
  // if none is set, since unproxied requests would expose the operator's IP.
  const proxy = parseProxy(args, process.env);
  if (proxy) {
    console.log(`[gemidos] routing through proxy ${proxy.server}`);
  } else {
    console.log(
      '[gemidos] WARNING: no proxy set — requests go out on your PUBLIC IP. Pass --proxy host:port or set SCRAPE_PROXY to hide it.'
    );
  }

  // RE-RUN SAFE: read what a previous run already captured so we can skip it.
  const existing = loadExisting(args.out);
  const skipPhones = new Set();
  if (args.force) {
    if (existing.rows.length) console.log(`[gemidos] --force: ignoring ${existing.rows.length} existing rows, re-fetching all`);
  } else {
    for (const p of existing.phones) skipPhones.add(p);
    if (existing.rows.length) {
      console.log(`[gemidos] incremental: ${existing.rows.length} already-captured ads will be skipped (use --force to re-fetch all)`);
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
      userDataDir: path.join(cacheDir, 'pptr-gemidos'),
      args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage', ...proxyLaunchArgs(proxy)]
    });
  } catch (e) {
    console.error('[gemidos] FAILED to launch Chromium:', e.message);
    process.exit(1);
  }

  const results = [];
  try {
    const page = await newPolitePage(browser, proxy);

    console.log(`[gemidos] opening Argentina section: ${ORIGIN}/argentina`);
    const home = await page.goto(ORIGIN + '/argentina', { waitUntil: 'domcontentloaded', timeout: 60000 });
    console.log(`[gemidos] section HTTP ${home && home.status()} — ${await page.title()}`);
    await dismissBanners(page);

    // 1) DISCOVERY ----------------------------------------------------------
    const listingUrls = [...new Set(SEED_LISTINGS)].slice(0, Math.max(args.listings, 1));
    console.log(`[gemidos] discovery across up to ${listingUrls.length} Argentine listing pages`);

    const seenPubIds = new Set();
    // INCREMENTAL: pre-seed the dedupe set with already-captured pub ids so they
    // are never re-discovered/re-opened (unless --force).
    if (!args.force) for (const id of existing.ids) seenPubIds.add(id);
    const cards = [];
    for (const listing of listingUrls) {
      if (cards.length >= args.limit) break;
      const found = await collectProfileCards(page, listing, seenPubIds);
      if (found.length) {
        console.log(`[gemidos]   ${listing} -> +${found.length} new ads (total ${cards.length + found.length})`);
      }
      cards.push(...found);
      await sleep(600);
    }

    const targets = cards.slice(0, args.limit);
    console.log(`[gemidos] discovered ${cards.length} unique Argentine ads; extracting first ${targets.length}`);

    // 2) EXTRACTION ---------------------------------------------------------
    for (let i = 0; i < targets.length; i++) {
      const entry = await extractProfile(page, targets[i]);
      // INCREMENTAL: a re-posted ad (new id, same phone) — skip without counting.
      if (!args.force && entry.phone && skipPhones.has(entry.phone)) {
        console.log(`[gemidos] (${i + 1}/${targets.length}) [DUP ] ${entry.alias || '(no alias)'} | already captured — skipping`);
        if (i < targets.length - 1) await sleep(args.delayMs);
        continue;
      }
      const tag = entry.phone ? 'OK ' : 'SKIP';
      console.log(
        `[gemidos] (${i + 1}/${targets.length}) [${tag}] ${entry.alias || '(no alias)'} | ${entry.city ||
          '(no city)'} | ${entry.phone || entry.error}`
      );
      results.push(entry);
      if (i < targets.length - 1) await sleep(args.delayMs);
    }
  } catch (e) {
    console.error('[gemidos] FATAL:', e.message);
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

  console.log('\n================ GEMIDOS RESULTS ================');
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
  console.log(`\n[gemidos] new this run: ${newRows.length}, total in file: ${totalInFile} -> ${outPath}`);

  // 5) OPTIONAL DB SAVE -----------------------------------------------------
  if (args.save) {
    if (!newRows.length) {
      console.log('[gemidos] --save given but no NEW leads to upsert; skipping DB.');
    } else {
      console.log(`[gemidos] --save: upserting ${newRows.length} NEW leads into potential_professionals...`);
      try {
        const { inserted, existed } = await saveToDb(newRows);
        console.log(`[gemidos] DB done — inserted ${inserted}, already existed ${existed}`);
      } catch (e) {
        console.error('[gemidos] DB save failed:', e.message);
        process.exitCode = 1;
      }
    }
  } else {
    console.log('[gemidos] DRY RUN — no database connection opened. Re-run with --save to upsert.');
  }
})();
