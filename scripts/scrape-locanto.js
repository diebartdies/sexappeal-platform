/*
 * scripts/scrape-locanto.js
 *
 * Per-site adapter for Locanto.com.ar (a giant generalist Argentine classifieds
 * site), built on the per-site-adapter model proven by
 * scripts/scrape-simpleescorts.js.
 *
 * ============================ VIABILITY / LIMITATION =======================
 * Locanto is the HARD case in this batch. Two obstacles were confirmed by live
 * DOM inspection of the Buenos Aires Escorts section:
 *
 *   1. ANTI-BOT: the site sits behind Cloudflare ("Estamos verificando tu
 *      navegador" / "Just a moment..."). A fresh hit shows the interstitial for
 *      ~10-20s before the real listing renders. We mitigate by reusing a
 *      persistent Chromium profile (userDataDir) and waiting for the challenge
 *      to clear; in headless mode Cloudflare may still block — run --headful and
 *      pass the check once to warm the profile if so.
 *
 *   2. PHONE IS LOGIN-WALLED: on a profile (/buenosaires/ID_<id>/<slug>.html)
 *      the number is NOT in the page anywhere when logged out:
 *        - there is NO tel: link, NO schema.org "telephone", NO data-attribute
 *          and NO dataLayer carrying the number (verified: zero matches in the
 *          full page HTML);
 *        - the advertiser description has its phone STRIPPED by Locanto;
 *        - the "Llamar" (Call) button is rendered DISABLED and clicking the
 *          call link opens an "Iniciar sesión" (login) modal — the number is
 *          only fetched server-side AFTER login.
 *
 * CONCLUSION: the contact number is NOT reliably extractable without a logged-in
 * account, so — per the task's instruction not to force it — this adapter does
 * NOT fake a whole-page regex. It accurately discovers ads and extracts the
 * structured metadata it CAN confirm (alias, location, ad id, profile URL), and
 * attempts the legitimate contact sources (JSON-LD telephone / tel: / a +54
 * number embedded in the description) with the same +54 guard as the other
 * adapters. In practice the phone yield is ~0 while logged out; the CSV will
 * usually contain 0 rows and the run logs the login-wall limitation. If a
 * session cookie for a logged-in Locanto account is present in the reused
 * profile, the same SEL_CALL element can be revealed and parsed.
 * ===========================================================================
 *
 * SAFETY
 * ------
 * - DRY RUN by default: writes exports/locanto-leads.csv and touches NO
 *   database. Pass --save to upsert into potential_professionals.
 * - Small, polite volume: bounded --limit, delays between requests, dedupe.
 * - This is a validation/collection tool. Do NOT mass-run it.
 *
 * USAGE
 * -----
 *   node scripts/scrape-locanto.js                 # dry run, 10 profiles -> CSV
 *   node scripts/scrape-locanto.js --limit 5       # smaller sample
 *   node scripts/scrape-locanto.js --headful       # watch the browser (pass CF)
 *   node scripts/scrape-locanto.js --out exports/foo.csv
 *   node scripts/scrape-locanto.js --limit 25 --save   # also upsert to DB
 *   node scripts/scrape-locanto.js --proxy user:pass@host:port  # hide your IP
 *   node scripts/scrape-locanto.js --force         # re-fetch everything
 *
 * Flags:
 *   --limit N        max profiles to OPEN+extract (default 10)
 *   --listings N     max listing pages to crawl during discovery (default 8)
 *   --delay MS       polite delay between profile fetches (default 1500)
 *   --out PATH       output CSV path (default exports/locanto-leads.csv)
 *   --save           CONNECT to Mongo and upsert leads (otherwise dry run)
 *   --headful        launch a visible browser (debugging / pass Cloudflare)
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

const ORIGIN = 'https://www.locanto.com.ar';
const USER_AGENT =
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36';

// Seed listing: the Buenos Aires Escorts section. Pagination is ?page=N.
const SEED_LISTING = '/buenosaires/Escorts/20905/';

// --- selectors / patterns discovered by inspecting the live DOM ---
const SEL_PROFILE_LINK = 'a[href*="/ID_"]'; // listing card -> /buenosaires/ID_<id>/<slug>.html
const RE_AD_ID = /\/ID_([0-9]+)\//i;
// A +54 / domestic Argentine mobile written into free text (best-effort only;
// Locanto strips most numbers from descriptions, so this rarely matches).
const RE_AR_PHONE = /(?:\+?54\s?9?|\b0?)(?:11|15|2\d{1,3}|3\d{1,3})[\s.\-]?\d{2,4}[\s.\-]?\d{4}/g;

function parseArgs(argv) {
  const args = {
    limit: 10,
    listings: 8,
    delayMs: 1500,
    out: path.join('exports', 'locanto-leads.csv'),
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
        /^(aceptar|accept|entrar|ingresar|continuar|de acuerdo|si|sí)$/i.test((b.textContent || '').trim())
      );
      if (accept) accept.click();
    });
  } catch (_) {}
}

// Wait for the Cloudflare "Just a moment" / "verificando tu navegador"
// interstitial to clear. Returns true once the real page is up.
async function waitForCloudflare(page, maxMs) {
  const started = Date.now();
  while (Date.now() - started < maxMs) {
    const blocked = await page
      .evaluate(() => {
        const t = (document.title || '') + ' ' + (document.body ? document.body.innerText.slice(0, 200) : '');
        return /just a moment|verificando tu navegador|checking your browser/i.test(t);
      })
      .catch(() => false);
    if (!blocked) return true;
    await sleep(1500);
  }
  return false;
}

async function collectProfileUrls(page, listingUrl, seenAdIds) {
  const found = [];
  try {
    const resp = await page.goto(listingUrl, { waitUntil: 'domcontentloaded', timeout: 60000 });
    if (!resp || resp.status() >= 400) return found;
    await waitForCloudflare(page, 25000);
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
    province: 'Buenos Aires',
    city: 'Buenos Aires',
    status: null,
    error: null,
    argentina: false,
    loginWalled: false
  };
  try {
    const r = await page.goto(profileUrl, { waitUntil: 'domcontentloaded', timeout: 60000 });
    entry.status = r && r.status();
    if (!r || r.status() >= 400) {
      entry.error = `HTTP ${entry.status}`;
      return entry;
    }
    await waitForCloudflare(page, 25000);
    await dismissBanners(page);
    const data = await page.evaluate(() => {
      const out = {};
      const clean = (s) => (s || '').replace(/\s+/g, ' ').trim();
      const h1 = document.querySelector('h1');
      out.h1 = clean(h1 ? h1.textContent : '');
      out.title = document.title || '';
      // alias: the poster's user name link, if present.
      const user = document.querySelector('.js-user_name, [class*=user_name], a[href*="/g/"]');
      out.user = clean(user ? user.textContent : '');
      // location line, e.g. "Buenos Aires 1609 , Argentina".
      const loc = document.querySelector('[class*=vap_header] [class*=location], .header__location, .js-vap_location');
      out.loc = clean(loc ? loc.textContent : '');
      // LEGITIMATE contact sources (all normally EMPTY while logged out):
      // schema.org telephone, a tel: link, and the description free text.
      out.jsonld = '';
      for (const s of Array.from(document.querySelectorAll('script[type="application/ld+json"]'))) {
        const txt = s.textContent || '';
        if (txt.includes('"telephone"')) {
          out.jsonld = txt;
          break;
        }
      }
      const tel = document.querySelector('a[href^="tel:"]');
      out.tel = tel ? tel.getAttribute('href') || '' : '';
      const desc = document.querySelector('.simple__description, .vap_user_content__description, [class*=description]');
      out.desc = clean(desc ? desc.textContent : '');
      // Is the phone gated behind login? (disabled "Llamar" / login prompt.)
      const callBtn = document.querySelector('button.js-vap_call_button, a.js-vap_call');
      out.callDisabled = callBtn ? (callBtn.hasAttribute('disabled') || /logged-out/i.test(callBtn.getAttribute('data-d2') || '')) : false;
      return out;
    });

    entry.alias = data.user || data.h1 || null;
    entry.loginWalled = !!data.callDisabled;

    // Try the legitimate contact sources, most reliable first.
    let raw = null;
    if (data.jsonld) {
      try {
        const parsed = JSON.parse(data.jsonld);
        const arr = Array.isArray(parsed) ? parsed : (parsed['@graph'] && Array.isArray(parsed['@graph']) ? parsed['@graph'] : [parsed]);
        const node = arr.find((o) => o && o.telephone);
        if (node) raw = String(node.telephone).replace(/[^0-9]/g, '');
      } catch (_) {}
    }
    if (!raw && data.tel) raw = data.tel.replace(/[^0-9]/g, '');
    if (!raw && data.desc) {
      const matches = data.desc.match(RE_AR_PHONE);
      if (matches && matches.length) raw = matches[0];
    }
    entry.rawPhone = raw;

    if (!raw) {
      entry.error = entry.loginWalled ? 'phone login-walled (no public contact)' : 'no contact element found';
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
    `[locanto] start — limit=${args.limit}, listings<=${args.listings}, delay=${args.delayMs}ms, mode=${
      args.save ? 'SAVE (DB upsert)' : 'DRY RUN (CSV only)'
    }`
  );

  // IP-SAFE: resolve the proxy (CLI --proxy or SCRAPE_PROXY env) and warn loudly
  // if none is set, since unproxied requests would expose the operator's IP.
  const proxy = parseProxy(args, process.env);
  if (proxy) {
    console.log(`[locanto] routing through proxy ${proxy.server}`);
  } else {
    console.log(
      '[locanto] WARNING: no proxy set — requests go out on your PUBLIC IP. Pass --proxy host:port or set SCRAPE_PROXY to hide it.'
    );
  }

  // RE-RUN SAFE: read what a previous run already captured so we can skip it.
  const existing = loadExisting(args.out);
  const skipPhones = new Set();
  if (args.force) {
    if (existing.rows.length) console.log(`[locanto] --force: ignoring ${existing.rows.length} existing rows, re-fetching all`);
  } else {
    for (const p of existing.phones) skipPhones.add(p);
    if (existing.rows.length) {
      console.log(`[locanto] incremental: ${existing.rows.length} already-captured ads will be skipped (use --force to re-fetch all)`);
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
      userDataDir: path.join(cacheDir, 'pptr-locanto'),
      args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage', ...proxyLaunchArgs(proxy)]
    });
  } catch (e) {
    console.error('[locanto] FAILED to launch Chromium:', e.message);
    process.exit(1);
  }

  const results = [];
  try {
    const page = await newPolitePage(browser, proxy);

    console.log(`[locanto] opening listing: ${ORIGIN}${SEED_LISTING}`);
    const home = await page.goto(ORIGIN + SEED_LISTING, { waitUntil: 'domcontentloaded', timeout: 60000 });
    const passed = await waitForCloudflare(page, 25000);
    console.log(`[locanto] listing HTTP ${home && home.status()} — ${await page.title()}${passed ? '' : ' (Cloudflare NOT cleared — try --headful)'}`);
    await dismissBanners(page);

    // 1) DISCOVERY (paginated via ?page=N) ----------------------------------
    const seenAdIds = new Set();
    // INCREMENTAL: pre-seed the dedupe set with already-captured ad ids so they
    // are never re-discovered/re-opened (unless --force).
    if (!args.force) for (const id of existing.ids) seenAdIds.add(id);
    const profileUrls = [];
    for (let p = 1; p <= args.listings && profileUrls.length < args.limit; p++) {
      const listingUrl = ORIGIN + SEED_LISTING + (p > 1 ? `?page=${p}` : '');
      const found = await collectProfileUrls(page, listingUrl, seenAdIds);
      if (found.length) {
        console.log(`[locanto]   page ${p} -> +${found.length} new ads (total ${profileUrls.length + found.length})`);
      }
      profileUrls.push(...found);
      await sleep(700);
    }

    const targets = profileUrls.slice(0, args.limit);
    console.log(`[locanto] discovered ${profileUrls.length} unique ads; extracting first ${targets.length}`);

    // 2) EXTRACTION ---------------------------------------------------------
    for (let i = 0; i < targets.length; i++) {
      const entry = await extractProfile(page, targets[i]);
      // INCREMENTAL: a re-posted ad (new id, same phone) — skip without counting.
      if (!args.force && entry.phone && skipPhones.has(entry.phone)) {
        console.log(`[locanto] (${i + 1}/${targets.length}) [DUP ] ${entry.alias || '(no alias)'} | already captured — skipping`);
        if (i < targets.length - 1) await sleep(args.delayMs);
        continue;
      }
      const tag = entry.phone ? 'OK ' : 'SKIP';
      console.log(
        `[locanto] (${i + 1}/${targets.length}) [${tag}] ${entry.alias || '(no alias)'} | ${entry.city ||
          '(no city)'} | ${entry.phone || entry.error}`
      );
      results.push(entry);
      if (i < targets.length - 1) await sleep(args.delayMs);
    }
  } catch (e) {
    console.error('[locanto] FATAL:', e.message);
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
  const loginWalled = rejected.filter((r) => r.loginWalled).length;

  console.log('\n================ LOCANTO RESULTS ================');
  console.log(`Ads opened:                 ${results.length}`);
  console.log(`Passed Argentina filter:    ${passed.length} (unique phones)`);
  console.log(`Duplicates collapsed:       ${dupes}`);
  console.log(`Rejected / no contact:      ${rejected.length}  (login-walled: ${loginWalled})`);
  if (rejected.length) {
    const reasons = {};
    rejected.forEach((r) => (reasons[r.error || 'unknown'] = (reasons[r.error || 'unknown'] || 0) + 1));
    console.log('  reject reasons:', JSON.stringify(reasons));
  }
  if (!passed.length) {
    console.log('\n[locanto] NOTE: the phone number on Locanto is behind a LOGIN WALL (no');
    console.log('          public tel:/JSON-LD/data-attr; descriptions are stripped). With no');
    console.log('          logged-in session, 0 contacts are extractable — this is expected.');
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
  console.log(`\n[locanto] new this run: ${newRows.length}, total in file: ${totalInFile} -> ${outPath}`);

  // 5) OPTIONAL DB SAVE -----------------------------------------------------
  if (args.save) {
    if (!newRows.length) {
      console.log('[locanto] --save given but no NEW leads to upsert; skipping DB.');
    } else {
      console.log(`[locanto] --save: upserting ${newRows.length} NEW leads into potential_professionals...`);
      try {
        const { inserted, existed } = await saveToDb(newRows);
        console.log(`[locanto] DB done — inserted ${inserted}, already existed ${existed}`);
      } catch (e) {
        console.error('[locanto] DB save failed:', e.message);
        process.exitCode = 1;
      }
    }
  } else {
    console.log('[locanto] DRY RUN — no database connection opened. Re-run with --save to upsert.');
  }
})();
