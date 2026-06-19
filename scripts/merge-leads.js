/*
 * scripts/merge-leads.js
 *
 * Cross-site DEDUPE for the per-site scraper adapters.
 *
 * WHY THIS EXISTS
 * ----------------
 * argxp and its sister sites (simpleescort, sexysabor, gemidos, ...) share the
 * same owner/platform, so the SAME advertiser (same phone) is published across
 * several brands. Counting each site's CSV on its own therefore massively
 * over-states reality: the true universe of unique Argentine leads is close to
 * what a single site reports (~159 on simpleescort), NOT the sum of all sites.
 *
 * This tool reads every per-site export CSV, normalises the phone with the SAME
 * rules the import pipeline uses, and collapses duplicates ACROSS sites. It tells
 * you (a) how many rows each source contributed, (b) how many UNIQUE phones exist
 * across everything, and (c) how much the sources overlap.
 *
 * SAFETY: read-only. Writes a single merged CSV and prints a report. Touches NO
 * database. (Use each adapter's own --save to upsert; this is just analysis.)
 *
 * USAGE
 * -----
 *   node scripts/merge-leads.js                       # merge ONLY the fresh exports/*-leads.csv -> exports/all-leads-deduped.csv
 *   node scripts/merge-leads.js --include-legacy      # also fold in the stale scraped_leads.csv
 *   node scripts/merge-leads.js --in exports --in .   # extra folders to scan for *.csv
 *   node scripts/merge-leads.js --out exports/universe.csv
 *   node scripts/merge-leads.js --files a.csv,b.csv   # add explicit CSV paths on top of the scan
 *
 * Flags:
 *   --in DIR          a directory to scan for "*-leads.csv" / "scraped_leads.csv" (repeatable; default: exports)
 *   --files LIST      comma-separated explicit CSV paths (added on top of the dir scan)
 *   --include-legacy  also include the old scraped_leads.csv (EXCLUDED by default — it's the stale/over-collected set)
 *   --out PATH        merged output CSV (default exports/all-leads-deduped.csv)
 */

const fs = require('fs');
const path = require('path');

let normalizePhone;
try {
  ({ normalizePhone } = require('../import_leads'));
} catch (_) {
  normalizePhone = null;
}
if (typeof normalizePhone !== 'function') {
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

function parseArgs(argv) {
  const args = { inDirs: [], files: [], out: path.join('exports', 'all-leads-deduped.csv'), includeLegacy: false };
  for (let i = 2; i < argv.length; i++) {
    const a = argv[i];
    if (a === '--in') args.inDirs.push(argv[++i]);
    else if (a === '--files') args.files.push(...(argv[++i] || '').split(',').map((s) => s.trim()).filter(Boolean));
    else if (a === '--out') args.out = argv[++i] || args.out;
    else if (a === '--include-legacy') args.includeLegacy = true;
  }
  // DEFAULT: only the FRESH per-site adapter exports. The legacy scraped_leads.csv
  // is the stale/over-collected dataset and is EXCLUDED unless --include-legacy.
  if (!args.inDirs.length && !args.files.length) args.inDirs = ['exports'];
  if (args.includeLegacy) args.files.push('scraped_leads.csv');
  return args;
}

// Minimal CSV line splitter that respects double-quoted fields.
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

function csvEscape(v) {
  const s = String(v == null ? '' : v);
  return /[",\r\n]/.test(s) ? '"' + s.replace(/"/g, '""') + '"' : s;
}

// The source SITE (host) a record came from, derived from its "Source URL"
// column (e.g. https://www.sexysabor.com/escort/x -> sexysabor.com). Falls back
// to a label derived from the file name when the row has no Source URL.
function siteFromUrl(url) {
  try {
    return new URL(url).hostname.replace(/^www\./i, '').toLowerCase();
  } catch (_) {
    return null;
  }
}
function siteFromFile(tag) {
  return String(tag)
    .replace(/-leads\.csv$/i, '')
    .replace(/\.csv$/i, '');
}

// Resolve a column index by header name (case-insensitive, loose).
function colIndex(header, names) {
  const norm = header.map((h) => h.toLowerCase().replace(/[^a-z]/g, ''));
  for (const n of names) {
    const idx = norm.indexOf(n);
    if (idx !== -1) return idx;
  }
  return -1;
}

function collectFiles(args) {
  const found = new Set();
  // Scan directories for per-site adapter exports.
  for (const dir of args.inDirs) {
    let entries = [];
    try {
      entries = fs.readdirSync(dir);
    } catch (_) {
      continue;
    }
    for (const e of entries) {
      if (/-leads\.csv$/i.test(e) || /^scraped_leads\.csv$/i.test(e)) {
        found.add(path.join(dir, e));
      }
    }
  }
  // Add any explicitly-listed files (e.g. the legacy scraped_leads.csv via --include-legacy).
  for (const f of args.files) {
    if (fs.existsSync(f)) found.add(f);
  }
  return [...found];
}

(function main() {
  const args = parseArgs(process.argv);
  const files = collectFiles(args);
  if (!files.length) {
    console.error('[merge] no CSV files found. Looked in:', args.inDirs.join(', ') || args.files.join(', '));
    process.exit(1);
  }
  console.log(`[merge] reading ${files.length} file(s):\n  - ${files.join('\n  - ')}`);

  // phone -> { phone, alias, province, city, sources:Set, sourceUrls:Set }
  const byPhone = new Map();
  const perFile = {};
  let totalRows = 0;
  let badRows = 0;

  for (const file of files) {
    let text;
    try {
      text = fs.readFileSync(file, 'utf8');
    } catch (e) {
      console.error(`[merge] cannot read ${file}: ${e.message}`);
      continue;
    }
    const lines = text.split(/\r?\n/).filter((l) => l.trim().length);
    if (!lines.length) continue;
    const header = splitCsvLine(lines[0]);
    const iPhone = colIndex(header, ['phone', 'telephone', 'telefono', 'numero']);
    const iAlias = colIndex(header, ['alias', 'name', 'nombre']);
    const iProv = colIndex(header, ['province', 'provincia']);
    const iCity = colIndex(header, ['city', 'ciudad', 'localidad']);
    const iSrc = colIndex(header, ['sourceurl', 'source', 'fuente', 'url']);
    const tag = path.basename(file);
    perFile[tag] = { rows: 0, ok: 0, bad: 0 };

    const startRow = iPhone === -1 ? 0 : 1; // if no header match, treat all lines as data
    for (let i = startRow; i < lines.length; i++) {
      const cells = splitCsvLine(lines[i]);
      perFile[tag].rows++;
      totalRows++;
      const rawPhone = iPhone === -1 ? cells[0] : cells[iPhone];
      const norm = normalizePhone(rawPhone);
      if (!norm.ok) {
        perFile[tag].bad++;
        badRows++;
        continue;
      }
      perFile[tag].ok++;
      const phone = norm.phone;
      let rec = byPhone.get(phone);
      if (!rec) {
        rec = { phone, alias: '', province: '', city: '', sites: new Set(), files: new Set(), sourceUrls: new Set() };
        byPhone.set(phone, rec);
      }
      if (!rec.alias && iAlias !== -1 && cells[iAlias]) rec.alias = cells[iAlias];
      if (!rec.province && iProv !== -1 && cells[iProv]) rec.province = cells[iProv];
      if (!rec.city && iCity !== -1 && cells[iCity]) rec.city = cells[iCity];
      rec.files.add(tag);
      const srcVal = iSrc !== -1 ? cells[iSrc] : '';
      if (srcVal) rec.sourceUrls.add(srcVal);
      // record the source SITE (host), preferring the row's Source URL
      rec.sites.add(siteFromUrl(srcVal) || siteFromFile(tag));
    }
  }

  const unique = [...byPhone.values()];

  // ---- report ----
  console.log('\n================ MERGE / DEDUPE REPORT ================');
  console.log(`Files merged:            ${files.length}`);
  console.log(`Total data rows read:    ${totalRows}`);
  console.log(`Rows rejected (bad #):   ${badRows}`);
  console.log(`UNIQUE phones overall:   ${unique.length}`);

  console.log('\n--- Per-file contribution ---');
  for (const [tag, s] of Object.entries(perFile)) {
    console.log(`  ${tag.padEnd(34)} rows=${String(s.rows).padStart(5)}  valid=${String(s.ok).padStart(5)}  rejected=${String(s.bad).padStart(4)}`);
  }

  // How many phones appear in N distinct SITES (overlap across sister sites)
  const byCount = {};
  let multi = 0;
  for (const r of unique) {
    const n = r.sites.size;
    byCount[n] = (byCount[n] || 0) + 1;
    if (n > 1) multi++;
  }
  console.log('\n--- Overlap (a phone appearing in N distinct sites) ---');
  Object.keys(byCount)
    .map(Number)
    .sort((a, b) => a - b)
    .forEach((n) => console.log(`  in ${n} site(s): ${byCount[n]} phones`));
  console.log(`  -> ${multi} phones are shared across 2+ sites (the sister-site overlap).`);

  // Per-site totals (how many unique leads each site contributes)
  const perSite = {};
  for (const r of unique) {
    for (const s of r.sites) perSite[s] = (perSite[s] || 0) + 1;
  }
  console.log('\n--- Unique leads per source site ---');
  Object.entries(perSite)
    .sort((a, b) => b[1] - a[1])
    .forEach(([s, n]) => console.log(`  ${String(s).padEnd(28)} ${n}`));

  // ---- write merged CSV ----
  const outPath = path.resolve(args.out);
  fs.mkdirSync(path.dirname(outPath), { recursive: true });
  const headerOut = 'Phone,Alias,Province,City,SiteCount,SourceSites';
  const outLines = [headerOut];
  for (const r of unique) {
    outLines.push(
      [r.phone, r.alias, r.province, r.city, r.sites.size, [...r.sites].sort().join('|')]
        .map(csvEscape)
        .join(',')
    );
  }
  fs.writeFileSync(outPath, outLines.join('\n') + '\n', 'utf8');
  console.log(`\n[merge] wrote ${unique.length} unique leads -> ${outPath}`);
})();
