/**
 * Import scraped leads (scraped_leads.csv) into the `potential_professionals`
 * collection, normalizing Argentine mobile numbers to WhatsApp international
 * format (549 + area code + subscriber number, 13 digits total).
 *
 * Usage:
 *   node import_leads.js                # DRY RUN (default) — no DB connection, prints what WOULD happen
 *   node import_leads.js --dry-run      # same as above (explicit)
 *   node import_leads.js --confirm      # CONNECTS to MONGO_URI and upserts the leads
 *   node import_leads.js --confirm --file=other.csv
 *
 * DRY RUN is pure file parsing + normalization + dedupe. It never opens a DB
 * connection, so it is safe to run anywhere (it cannot touch dev or prod).
 *
 * On --confirm it upserts by `phone`:
 *   - new docs: $setOnInsert {phone, alias, sourceUrl} and force status:'pending'
 *   - existing docs: left untouched (idempotent; will NOT reset a 'contacted' lead)
 *
 * ---------------------------------------------------------------------------
 * NORMALIZATION RULES (Argentine mobiles -> 549 + 10 national digits)
 * ---------------------------------------------------------------------------
 * The Argentine "national significant number" (area code + subscriber) is
 * always 10 digits. The WhatsApp/international mobile form is:
 *     54  (country code) + 9 (mobile marker) + <10 national digits> = 13 digits
 *
 * Steps applied to each raw Phone value:
 *   1. Strip everything that is not a digit (+, spaces, dashes, parens, etc.).
 *   2. Determine the 10-digit "national" part, handling the country code / trunk:
 *        - 13 digits starting with "549"  -> already correct; national = digits[3..]
 *        - 12 digits starting with "54"   -> has country code but missing the
 *                                            mobile "9"; national = digits[2..]
 *                                            (final becomes 549 + national)
 *        - starts with a single trunk "0" -> strip the leading 0(s), rest = national
 *        - otherwise (bare number)        -> national = digits as-is
 *      (We only treat a leading "54" as a country code when the length is 12/13,
 *       so a legit 10-digit local number that merely starts with "54" is NOT
 *       mis-parsed.)
 *   3. Drop a domestic mobile "15" prefix when it is clearly present and removing
 *      it yields exactly 10 digits (e.g. AMBA "11 15 XXXXXXXX" = 12 digits).
 *   4. Validate the national part:
 *        - must be exactly 10 numeric digits
 *        - reject obvious junk: all-same-digit, <=2 distinct digits, or known
 *          sentinel values (e.g. 2147483647 = int max, a scraper placeholder)
 *      Anything that fails is flagged "needs manual review" and NOT imported.
 *   5. Final number = "549" + national (13 digits). Dedupe by this value.
 * ---------------------------------------------------------------------------
 */

const fs = require('fs');
const path = require('path');

const args = process.argv.slice(2);
const confirmed = args.includes('--confirm');
const dryRun = !confirmed; // dry-run is the DEFAULT
const fileArg = (args.find((a) => a.startsWith('--file=')) || '').split('=')[1];
const csvPath = path.resolve(fileArg || path.join(__dirname, 'scraped_leads.csv'));

// Known junk/sentinel "phone" values that are never real numbers.
const JUNK_SENTINELS = new Set([
  '2147483647', // 2^31 - 1, classic int-max placeholder
  '1234567890',
  '0000000000',
  '1111111111'
]);

/**
 * Parse one CSV line into fields, honouring double-quoted values
 * (alias may be quoted and could in theory contain commas).
 */
function parseCsvLine(line) {
  const out = [];
  let cur = '';
  let inQuotes = false;
  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (inQuotes) {
      if (ch === '"') {
        if (line[i + 1] === '"') { cur += '"'; i++; } // escaped quote
        else inQuotes = false;
      } else cur += ch;
    } else if (ch === '"') {
      inQuotes = true;
    } else if (ch === ',') {
      out.push(cur); cur = '';
    } else {
      cur += ch;
    }
  }
  out.push(cur);
  return out;
}

function distinctDigitCount(s) {
  return new Set(s.split('')).size;
}

/**
 * Normalize a raw phone string.
 * @returns {{ ok: boolean, phone?: string, reason?: string }}
 */
function normalizePhone(raw) {
  const digits = String(raw == null ? '' : raw).replace(/[^0-9]/g, '');
  if (!digits) return { ok: false, reason: 'empty / non-numeric' };

  let national;
  if (digits.length >= 12 && digits.startsWith('54')) {
    // Has country code.
    national = digits.startsWith('549') ? digits.slice(3) : digits.slice(2);
  } else if (digits.startsWith('0')) {
    // Domestic trunk prefix.
    national = digits.replace(/^0+/, '');
  } else {
    national = digits;
  }

  // Drop a domestic mobile "15" prefix when removing it lands us on 10 digits.
  // Handles e.g. "11 15 XXXXXXXX" (12) and 3-digit-area "XXX 15 XXXXXX" (11+2).
  if (national.length > 10) {
    for (const areaLen of [2, 3, 4]) {
      if (
        national.length === areaLen + 2 + 8 &&
        national.slice(areaLen, areaLen + 2) === '15'
      ) {
        national = national.slice(0, areaLen) + national.slice(areaLen + 2);
        break;
      }
    }
  }

  if (national.length !== 10) {
    return { ok: false, reason: `unexpected length (${national.length} national digits)` };
  }
  if (JUNK_SENTINELS.has(national)) {
    return { ok: false, reason: 'known junk sentinel' };
  }
  if (distinctDigitCount(national) <= 2) {
    return { ok: false, reason: 'too few distinct digits (likely placeholder)' };
  }

  return { ok: true, phone: '549' + national };
}

function readRows() {
  if (!fs.existsSync(csvPath)) {
    throw new Error(`CSV not found: ${csvPath}`);
  }
  const text = fs.readFileSync(csvPath, 'utf8');
  const lines = text.split(/\r?\n/).filter((l) => l.trim() !== '');
  if (!lines.length) return [];
  // Drop header.
  const body = lines.slice(1);
  return body.map((line) => {
    const f = parseCsvLine(line);
    return {
      rawPhone: (f[0] || '').trim(),
      alias: (f[1] || '').trim(),
      sourceUrl: (f[2] || '').trim(),
      status: (f[3] || '').trim()
    };
  });
}

function analyze() {
  const rows = readRows();
  const valid = new Map();       // normalized phone -> { phone, alias, sourceUrl, rawSamples:[] }
  const needsReview = [];        // { rawPhone, reason, sourceUrl }
  const samples = [];            // before -> after for display
  let duplicatesCollapsed = 0;

  for (const row of rows) {
    const res = normalizePhone(row.rawPhone);
    if (!res.ok) {
      needsReview.push({ rawPhone: row.rawPhone, reason: res.reason, sourceUrl: row.sourceUrl });
      continue;
    }
    if (samples.length < 15) {
      samples.push({ before: row.rawPhone, after: res.phone });
    }
    if (valid.has(res.phone)) {
      duplicatesCollapsed++;
      const existing = valid.get(res.phone);
      // Keep an alias if we find one on a later duplicate row.
      if (!existing.alias && row.alias) existing.alias = row.alias;
      existing.rawSamples.push(row.rawPhone);
    } else {
      valid.set(res.phone, {
        phone: res.phone,
        alias: row.alias || '',
        sourceUrl: row.sourceUrl || '',
        rawSamples: [row.rawPhone]
      });
    }
  }

  return { rows, valid, needsReview, samples, duplicatesCollapsed };
}

function printReport({ rows, valid, needsReview, samples, duplicatesCollapsed }) {
  console.log('=== Leads import — DRY RUN analysis ===');
  console.log(`CSV file:                 ${csvPath}`);
  console.log(`Total data rows:          ${rows.length}`);
  console.log(`Valid after normalize:    ${valid.size}  (unique normalized phones)`);
  console.log(`Duplicates collapsed:     ${duplicatesCollapsed}`);
  console.log(`Needs manual review:      ${needsReview.length}`);
  console.log(`Expected final inserts:   ${valid.size}  (before counting any already in DB)`);

  console.log('\n--- Sample before -> after (first 15 valid) ---');
  for (const s of samples) {
    console.log(`  ${String(s.before).padEnd(16)} ->  ${s.after}`);
  }

  if (needsReview.length) {
    console.log('\n--- Needs manual review (examples, up to 20) ---');
    const byReason = {};
    for (const r of needsReview) byReason[r.reason] = (byReason[r.reason] || 0) + 1;
    console.log('  reasons:', JSON.stringify(byReason));
    for (const r of needsReview.slice(0, 20)) {
      console.log(`  ${String(r.rawPhone).padEnd(16)}  (${r.reason})  ${r.sourceUrl}`);
    }
  }

  return valid;
}

async function run() {
  const analysis = analyze();
  printReport(analysis);

  if (dryRun) {
    console.log('\nDRY RUN — no database connection was opened and nothing was written.');
    console.log('Run again with --confirm to upsert into potential_professionals.');
    return 0;
  }

  // --- WRITE PATH (only with --confirm) ---
  require('dotenv').config();
  const mongoose = require('mongoose');
  const connectDB = require('./config/database');
  const PotentialProfessional = require('./models/PotentialProfessional');

  await connectDB();

  let inserted = 0;
  let matchedExisting = 0;
  const docs = Array.from(analysis.valid.values());
  for (const d of docs) {
    const result = await PotentialProfessional.updateOne(
      { phone: d.phone },
      {
        $setOnInsert: {
          phone: d.phone,
          alias: d.alias,
          sourceUrl: d.sourceUrl,
          status: 'pending',
          createdAt: new Date()
        }
      },
      { upsert: true }
    );
    if (result.upsertedCount && result.upsertedCount > 0) inserted++;
    else matchedExisting++;
  }

  console.log('\n=== Import complete ===');
  console.log(`Inserted (new):           ${inserted}`);
  console.log(`Already existed (kept):   ${matchedExisting}`);
  console.log(`Needs manual review (skipped): ${analysis.needsReview.length}`);

  await mongoose.disconnect();
  return 0;
}

if (require.main === module) {
  run()
    .then((code) => { process.exitCode = code; })
    .catch((err) => {
      console.error('Lead import failed:', err);
      process.exitCode = 1;
    });
} else {
  module.exports = { normalizePhone, parseCsvLine, analyze };
}
