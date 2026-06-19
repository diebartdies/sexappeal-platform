/*
 * scripts/scrape-selfiscorts.js
 *
 * ============================================================================
 *  NON-VIABLE SITE — NO ADAPTER BUILT (intentional stub)
 * ============================================================================
 *
 * Target that was requested:
 *   https://selfiscorts.com/escorts/escort_ubicacion/capital-federal-capital-federal/
 *
 * VERIFICATION (live, 2026-06-19, via browser MCP + independent HTTP fetch):
 *   - Browser navigation to https://selfiscorts.com/ ,
 *     https://www.selfiscorts.com/ , https://selfiscorts.com/escorts/ and the
 *     requested deep listing URL ALL resolved to chrome-error://chromewebdata/
 *     (the page never loaded — no DOM, no content).
 *   - An independent server-side fetch of https://selfiscorts.com/ returned
 *     HTTP 503 Service Unavailable (the domain's DNS resolves, but the origin
 *     serves no usable content — down / parked-with-error / anti-bot wall).
 *   - There is no legitimate web/search presence for "selfiscorts.com" as an
 *     Argentine escort directory.
 *
 * CONCLUSION: the site is NOT a reachable, live directory right now, so there
 * are no listing pages, profile pages, or contact elements to target. Per the
 * task's hard constraint ("If a site is dead/parked/captcha-walled, DO NOT build
 * a fake adapter — REPORT it as not-viable and skip / leave a minimal stub
 * clearly marked NON-VIABLE"), NO scraping logic was written.
 *
 * IF THE SITE COMES BACK: re-validate it live in the browser (confirm it is a
 * real Argentine directory and not parked/spam), discover the listing +
 * pagination + profile-URL pattern, identify the SPECIFIC contact element
 * (schema.org JSON-LD telephone, a data-attribute/dataLayer, or a WhatsApp /
 * tel: element — NEVER a whole-page phone regex), then build the adapter by
 * copying scripts/scrape-simpleescorts.js (and the sibling scrape-bairesgirls.js
 * / scrape-pkadoras.js adapters) exactly: same flags
 * (--limit/--listings/--delay/--out/--save/--headful), DRY-RUN CSV default that
 * opens NO DB unless --save, normalizePhone reuse from import_leads.js, the +54
 * guard, dedupe, polite delays, CSV header
 * "Phone,Alias,Source URL,Status,Province,City,AdId,ProfileUrl", Status='pending',
 * and the Windows-safe Chromium launch (project-local .cache/tmp + userDataDir).
 */

const SITE = 'selfiscorts.com';

console.error(
  `[selfiscorts] NON-VIABLE: ${SITE} did not load (browser -> chrome-error; ` +
    `independent fetch -> HTTP 503). No adapter built; nothing scraped, no CSV, no DB. ` +
    `See the header comment in this file for how to build it if the site returns.`
);

// Exit non-zero so this can never be mistaken for a successful scrape run.
process.exit(2);
