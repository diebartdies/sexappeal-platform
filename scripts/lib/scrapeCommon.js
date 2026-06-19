/*
 * scripts/lib/scrapeCommon.js
 *
 * SHARED helper for the per-site scraper adapters (scrape-*.js). It exists so the
 * two cross-cutting capabilities below live in ONE place and never diverge across
 * the ~12 adapters:
 *
 *   1. RE-RUN SAFE / INCREMENTAL  — loadExisting() reads an adapter's previous
 *      output CSV so a re-run can (a) pre-seed the discovery dedupe set with the
 *      ad ids it already captured (so they are never re-opened) and (b) preserve
 *      the rows it already wrote (so a re-run only APPENDS new leads, never loses
 *      earlier ones).
 *
 *   2. IP-SAFE / PROXY  — parseProxy() + proxyLaunchArgs() let every adapter route
 *      Chromium through an HTTP/SOCKS proxy (a --proxy flag or the SCRAPE_PROXY
 *      env var) so the operator's bare public IP is never exposed to the targets.
 *
 * Dependency-free on purpose (only Node's built-in `fs`).
 */

const fs = require('fs');

// Minimal CSV line splitter that respects double-quoted fields (copied from
// scripts/merge-leads.js so the two stay byte-for-byte compatible).
function splitCsvLine(line) {
  const out = [];
  let cur = '';
  let inQ = false;
  for (let i = 0; i < line.length; i++) {
    const c = line[i];
    if (inQ) {
      if (c === '"') {
        if (line[i + 1] === '"') {
          cur += '"';
          i++;
        } else inQ = false;
      } else cur += c;
    } else if (c === '"') inQ = true;
    else if (c === ',') {
      out.push(cur);
      cur = '';
    } else cur += c;
  }
  out.push(cur);
  return out;
}

/*
 * loadExisting(outPath)
 *
 * Reads an adapter's existing output CSV (if present) and returns what was
 * already captured so a re-run can be incremental:
 *   {
 *     rows:   string[]      // RAW data lines (no header) — written back verbatim
 *     phones: Set<string>   // values of the "Phone" column (already-captured leads)
 *     ids:    Set<string>   // values of the "AdId" column (already-captured ads)
 *   }
 * Returns empty rows/sets if the file does not exist or is empty. The Phone and
 * AdId columns are located by parsing the header (case-insensitive); if no header
 * is recognised, every line is treated as data and the phone is taken from col 0.
 */
function loadExisting(outPath) {
  const empty = { rows: [], phones: new Set(), ids: new Set() };
  if (!outPath) return empty;
  let text;
  try {
    text = fs.readFileSync(outPath, 'utf8');
  } catch (_) {
    return empty; // file does not exist (or is unreadable) -> nothing captured yet
  }
  const lines = text.split(/\r?\n/).filter((l) => l.trim().length > 0);
  if (!lines.length) return empty;

  const header = splitCsvLine(lines[0]);
  const norm = header.map((h) => h.toLowerCase().replace(/[^a-z]/g, ''));
  const iPhone = norm.indexOf('phone');
  const iId = norm.indexOf('adid');

  const rows = [];
  const phones = new Set();
  const ids = new Set();
  // If the header was not recognised, treat ALL lines as data (phone in col 0).
  const startRow = iPhone === -1 ? 0 : 1;
  for (let i = startRow; i < lines.length; i++) {
    const raw = lines[i];
    rows.push(raw);
    const cells = splitCsvLine(raw);
    const ph = (iPhone === -1 ? cells[0] : cells[iPhone]) || '';
    if (ph.trim()) phones.add(ph.trim());
    if (iId !== -1) {
      const id = (cells[iId] || '').trim();
      if (id) ids.add(id);
    }
  }
  return { rows, phones, ids };
}

/*
 * parseProxy(args, env)
 *
 * Resolves a proxy configuration from a `--proxy` CLI value (carried on
 * args.proxy) or the SCRAPE_PROXY environment variable. Accepts:
 *   host:port
 *   http://host:port            (or https://, socks5://, ... — scheme preserved)
 *   user:pass@host:port
 *   http://user:pass@host:port
 * Returns { server, username, password } or null when no proxy was given.
 * Credentials are split OUT of `server` because Chromium's --proxy-server does
 * not accept embedded credentials; they are applied via page.authenticate().
 */
function parseProxy(args, env) {
  const raw = ((args && args.proxy) || (env && env.SCRAPE_PROXY) || '').trim();
  if (!raw) return null;

  let s = raw;
  let scheme = '';
  const schemeMatch = s.match(/^([a-z0-9]+):\/\//i);
  if (schemeMatch) {
    scheme = schemeMatch[1].toLowerCase() + '://';
    s = s.slice(schemeMatch[0].length);
  }

  let username = null;
  let password = null;
  const at = s.lastIndexOf('@');
  if (at !== -1) {
    const creds = s.slice(0, at);
    s = s.slice(at + 1);
    const ci = creds.indexOf(':');
    if (ci !== -1) {
      username = creds.slice(0, ci);
      password = creds.slice(ci + 1);
    } else {
      username = creds;
      password = '';
    }
  }

  const server = scheme + s; // host:port, with the scheme kept if one was given
  if (!s) return null; // nothing left after stripping creds/scheme -> invalid
  return { server, username, password };
}

/*
 * proxyLaunchArgs(proxy)
 *
 * Returns the Chromium launch flag(s) for a parsed proxy: ['--proxy-server=...']
 * or [] when no proxy is configured. Spread into puppeteer.launch({ args: [...] }).
 */
function proxyLaunchArgs(proxy) {
  return proxy && proxy.server ? ['--proxy-server=' + proxy.server] : [];
}

module.exports = { loadExisting, parseProxy, proxyLaunchArgs, splitCsvLine };
