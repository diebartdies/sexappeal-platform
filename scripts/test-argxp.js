/*
 * scripts/test-argxp.js  (PROBE / TEST ONLY — do not deploy, do not commit)
 *
 * Verifies whether we can programmatically reach the WhatsApp/phone contact of
 * Argentine escort listings on https://argentinaxp.com/.
 *
 * Flow:
 *   1. Load the homepage (JS-rendered listing grid).
 *   2. For each listing card (.more-escorts__card) read the profile link (a.link-pv).
 *   3. Open each profile and extract the WhatsApp contact (a.client__whatsapp),
 *      then parse the phone number from the web.whatsapp.com/wa.me URL.
 *
 * Usage:
 *   node scripts/test-argxp.js            # probes first 5 profiles (default)
 *   node scripts/test-argxp.js --limit 3  # probes first 3 profiles
 *
 * Constraints: tiny volume, polite delay between profiles. This is a feasibility
 * probe, NOT a production scraper.
 */

const puppeteer = require('puppeteer');

const HOME_URL = 'https://argentinaxp.com/';
const USER_AGENT =
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36';

// --- selectors discovered by inspecting the real DOM ---
const SEL_CARD = '.more-escorts__card';
const SEL_PROFILE_LINK = 'a.link-pv'; // anchor inside each card -> profile URL
const SEL_WHATSAPP = 'a.client__whatsapp'; // contact button on profile page

function parseArgs(argv) {
  const args = { limit: 5, delayMs: 1500 };
  for (let i = 2; i < argv.length; i++) {
    if (argv[i] === '--limit') args.limit = parseInt(argv[++i], 10) || args.limit;
    else if (argv[i] === '--delay') args.delayMs = parseInt(argv[++i], 10) || args.delayMs;
  }
  return args;
}

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

function extractPhoneFromWhatsappUrl(href) {
  if (!href) return null;
  try {
    const u = new URL(href);
    // web.whatsapp.com/send?phone=...  or  api.whatsapp.com/send?phone=...
    const qp = u.searchParams.get('phone');
    if (qp) return qp.replace(/[^\d]/g, '');
    // wa.me/<number>
    if (/wa\.me$/i.test(u.hostname)) {
      const m = u.pathname.replace(/[^\d]/g, '');
      if (m) return m;
    }
  } catch (_) {
    // fallback regex
    const m = href.match(/phone=(\d+)/) || href.match(/wa\.me\/(\d+)/);
    if (m) return m[1];
  }
  return null;
}

async function newPolitePage(browser) {
  const page = await browser.newPage();
  await page.setUserAgent(USER_AGENT);
  await page.setViewport({ width: 1366, height: 900 });
  return page;
}

(async () => {
  const { limit, delayMs } = parseArgs(process.argv);
  console.log(`[argxp] starting probe — limit=${limit}, delay=${delayMs}ms`);

  let browser;
  try {
    browser = await puppeteer.launch({
      headless: 'new',
      args: ['--no-sandbox', '--disable-setuid-sandbox'],
    });
  } catch (e) {
    console.error('[argxp] FAILED to launch Chromium:', e.message);
    process.exit(1);
  }

  const results = [];
  try {
    const page = await newPolitePage(browser);

    console.log(`[argxp] loading homepage: ${HOME_URL}`);
    const resp = await page.goto(HOME_URL, { waitUntil: 'domcontentloaded', timeout: 60000 });
    const status = resp && resp.status();
    console.log(`[argxp] homepage HTTP ${status} — title: ${await page.title()}`);
    if (status && status >= 400) {
      throw new Error(`Homepage returned HTTP ${status} (possible block).`);
    }

    // Wait for listing cards to be present (JS-rendered).
    try {
      await page.waitForSelector(SEL_CARD, { timeout: 15000 });
    } catch (_) {
      console.warn('[argxp] listing cards not found within 15s — site layout may have changed.');
    }
    await sleep(2000);

    // Collect profile URLs from the cards.
    const profileUrls = await page.evaluate(
      (selCard, selLink) => {
        const cards = Array.from(document.querySelectorAll(selCard));
        const urls = [];
        for (const card of cards) {
          const a = card.querySelector(selLink) || card.querySelector('a[href]');
          if (a && a.href && !urls.includes(a.href)) urls.push(a.href);
        }
        return urls;
      },
      SEL_CARD,
      SEL_PROFILE_LINK
    );

    console.log(`[argxp] found ${profileUrls.length} profile links on homepage.`);
    const targets = profileUrls.slice(0, limit);
    console.log(`[argxp] probing first ${targets.length}:`);
    targets.forEach((u, i) => console.log(`   ${i + 1}. ${u}`));

    for (let i = 0; i < targets.length; i++) {
      const profileUrl = targets[i];
      const entry = { index: i + 1, profileUrl, whatsappUrl: null, phone: null, name: null, status: null, error: null };
      const profPage = await newPolitePage(browser);
      try {
        console.log(`\n[argxp] (${i + 1}/${targets.length}) opening: ${profileUrl}`);
        const r = await profPage.goto(profileUrl, { waitUntil: 'domcontentloaded', timeout: 60000 });
        entry.status = r && r.status();
        entry.name = await profPage.title();
        console.log(`[argxp]   HTTP ${entry.status} — ${entry.name}`);

        await profPage.waitForSelector(SEL_WHATSAPP, { timeout: 8000 });
        const whatsappUrl = await profPage.$eval(SEL_WHATSAPP, (el) => el.href);
        entry.whatsappUrl = whatsappUrl;
        entry.phone = extractPhoneFromWhatsappUrl(whatsappUrl);
        console.log(`[argxp]   WhatsApp: ${whatsappUrl}`);
        console.log(`[argxp]   phone:    ${entry.phone || '(could not parse)'}`);
      } catch (err) {
        entry.error = err.message;
        console.log(`[argxp]   FAILED: ${err.message}`);
      } finally {
        await profPage.close();
        results.push(entry);
      }
      if (i < targets.length - 1) await sleep(delayMs); // be polite
    }
  } catch (e) {
    console.error('[argxp] FATAL:', e.message);
  } finally {
    if (browser) await browser.close();
  }

  // --- summary ---
  console.log('\n================ RESULTS ================');
  const ok = results.filter((r) => r.phone);
  for (const r of results) {
    if (r.phone) {
      console.log(`[OK]  #${r.index} ${r.profileUrl}\n      phone=${r.phone}  wa=${r.whatsappUrl}`);
    } else {
      console.log(`[ERR] #${r.index} ${r.profileUrl}\n      ${r.error || 'no whatsapp element found'}`);
    }
  }
  console.log(`\n[argxp] success: ${ok.length}/${results.length} profiles yielded a phone number.`);
  console.log(JSON.stringify(results, null, 2));
})();
