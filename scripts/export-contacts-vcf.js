require('dotenv').config();
const fs = require('fs');
const path = require('path');
const connectDB = require('../config/database');
const PotentialProfessional = require('../models/PotentialProfessional');
const { normalizeSmsPhone } = require('../utils/professionalInviteSms');

/**
 * Export every outreach lead as importable phone contacts.
 *
 * WHY: Saving our lead numbers as contacts on the outreach phone makes WhatsApp
 * treat them as "known contacts" - this improves deliverability and reduces the
 * chance of being flagged as spam.
 *
 * WHAT: Reads the `potential_professionals` collection, normalizes each `phone`
 * to E.164 (+549...) with the project's shared normalizer, de-duplicates by
 * number, and writes:
 *   - exports/leads-contacts.vcf  (vCard 3.0 - primary Android import format)
 *   - exports/leads-contacts.csv  (Google Contacts CSV - secondary import option)
 *
 * NAMING: Contacts are named like natural EVENT GUEST LISTS so the saved batch
 * does not look like a scraped bulk import. A small set of "roots" (event names)
 * is distributed across the contacts using configurable WEIGHTS (scaled to the
 * real total contact count), then each contact gets `"<root> <i>"` with a
 * sequential per-root index (e.g. "Cumpleanos Victor 137"). The lead alias and
 * phone are NOT used in the display name anymore. The TEL;TYPE=CELL:+549...
 * value is kept exactly (that is what WhatsApp matches).
 *
 * Usage:
 *   node scripts/export-contacts-vcf.js
 *   node scripts/export-contacts-vcf.js --pending-only
 *   node scripts/export-contacts-vcf.js --sample        # offline: write a tiny demo .vcf, no DB
 *
 * Env overrides:
 *   CONTACTS_ROOTS='[{"label":"Foo","weight":10}]'   (override roots/weights; JSON array)
 *   MONGO_URI=...                                     (DB connection, mirrors the rest of the project)
 */

// ---------------------------------------------------------------------------
// Roots / weights config (event-guest-list naming)
// ---------------------------------------------------------------------------
// Default roots + weights. The weights are treated as PROPORTIONS and scaled to
// the real total contact count N at runtime. "Cumplea\u00f1os" is written with a
// unicode escape so this source file stays pure ASCII (robust to any tooling),
// while the generated .vcf/.csv still contain the proper accented characters.
const DEFAULT_ROOTS = [
  { label: 'Fiesta de 15 Mariela', weight: 178 },
  { label: 'Cumplea\u00f1os Victor', weight: 205 },
  { label: 'Bautismo Clemente', weight: 83 },
  { label: 'Bar Mitzvah Roque', weight: 200 }
];

function loadRoots() {
  if (process.env.CONTACTS_ROOTS) {
    try {
      const parsed = JSON.parse(process.env.CONTACTS_ROOTS);
      if (Array.isArray(parsed) && parsed.length) {
        const cleaned = parsed
          .map((r) => ({ label: String(r.label), weight: Number(r.weight) || 0 }))
          .filter((r) => r.label && r.weight > 0);
        if (cleaned.length) return cleaned;
      }
    } catch (err) {
      console.warn('Invalid CONTACTS_ROOTS env, using defaults:', err.message);
    }
  }
  return DEFAULT_ROOTS;
}

const ROOTS = loadRoots();

// ---------------------------------------------------------------------------
// CLI / config parsing
// ---------------------------------------------------------------------------
function parseArgs(argv) {
  const args = { pendingOnly: false, sample: false };
  for (let i = 0; i < argv.length; i += 1) {
    const a = argv[i];
    if (a === '--pending-only') {
      args.pendingOnly = true;
    } else if (a === '--sample') {
      args.sample = true;
    }
  }
  return args;
}

const cli = parseArgs(process.argv.slice(2));

const EXPORT_DIR = path.resolve(__dirname, '..', 'exports');
const VCF_PATH = path.join(EXPORT_DIR, 'leads-contacts.vcf');
const CSV_PATH = path.join(EXPORT_DIR, 'leads-contacts.csv');

// ---------------------------------------------------------------------------
// Formatting helpers
// ---------------------------------------------------------------------------

// Escape a value for vCard 3.0 text fields: backslash, comma, semicolon and newlines.
function vcardEscape(value) {
  return String(value)
    .replace(/\\/g, '\\\\')
    .replace(/\n/g, '\\n')
    .replace(/,/g, '\\,')
    .replace(/;/g, '\\;');
}

// Escape a value for CSV (RFC-4180 style): wrap in quotes if it contains a comma,
// quote or newline, and double any embedded quotes.
function csvEscape(value) {
  const s = String(value == null ? '' : value);
  if (/[",\n\r]/.test(s)) {
    return `"${s.replace(/"/g, '""')}"`;
  }
  return s;
}

// One vCard 3.0 record. FN is the display name; N keeps the name in the
// "given name" slot. TEL;TYPE=CELL holds the +549... number (this exact shape
// is what lets WhatsApp match the saved contact).
function buildVCard(name, phone) {
  const safeName = vcardEscape(name);
  return [
    'BEGIN:VCARD',
    'VERSION:3.0',
    `N:;${safeName};;;`,
    `FN:${safeName}`,
    `TEL;TYPE=CELL:${phone}`,
    'END:VCARD'
  ].join('\r\n');
}

// ---------------------------------------------------------------------------
// Core: turn a list of { alias, phone } leads into deduped contacts + summary
// ---------------------------------------------------------------------------
function buildContacts(leads) {
  const seen = new Map(); // normalizedPhone -> contact
  let skipped = 0;
  let duplicates = 0;

  for (const lead of leads) {
    const normalized = normalizeSmsPhone(lead.phone);
    if (!normalized || !/^\+\d{6,}$/.test(normalized)) {
      skipped += 1;
      continue;
    }
    if (seen.has(normalized)) {
      duplicates += 1;
      continue;
    }
    seen.set(normalized, { phone: normalized });
  }

  return { contacts: Array.from(seen.values()), skipped, duplicates };
}

// ---------------------------------------------------------------------------
// Naming: distribute roots across contacts by weight, then number sequentially.
// ---------------------------------------------------------------------------

// Fisher-Yates in-place shuffle so root assignment is random w.r.t. phone order.
function shuffle(arr) {
  for (let i = arr.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    const tmp = arr[i];
    arr[i] = arr[j];
    arr[j] = tmp;
  }
  return arr;
}

// Per-root counts = round(weight / sumWeights * N), with rounding drift added to
// (or subtracted from) the root with the largest weight so the counts sum to N.
function computeRootCounts(n, roots) {
  const sumWeights = roots.reduce((acc, r) => acc + r.weight, 0) || 1;
  const counts = roots.map((r) => Math.round((r.weight / sumWeights) * n));
  const total = counts.reduce((acc, c) => acc + c, 0);
  let drift = n - total;
  if (drift !== 0) {
    let largestIdx = 0;
    for (let i = 1; i < roots.length; i += 1) {
      if (roots[i].weight > roots[largestIdx].weight) largestIdx = i;
    }
    counts[largestIdx] += drift;
    // Spill negative overflow onto other roots if the largest cannot absorb it.
    let idx = 0;
    while (counts[largestIdx] < 0 && idx < counts.length) {
      if (idx !== largestIdx && counts[idx] > 0) {
        const take = Math.min(counts[idx], -counts[largestIdx]);
        counts[idx] -= take;
        counts[largestIdx] += take;
      }
      idx += 1;
    }
    if (counts[largestIdx] < 0) counts[largestIdx] = 0;
    drift = 0;
  }
  return counts;
}

// Shuffle contacts, compute per-root counts, then assign sequential names.
function assignNames(contacts) {
  shuffle(contacts);
  const counts = computeRootCounts(contacts.length, ROOTS);
  const perRoot = {};
  ROOTS.forEach((r) => { perRoot[r.label] = 0; });

  let idx = 0;
  for (let r = 0; r < ROOTS.length; r += 1) {
    const label = ROOTS[r].label;
    for (let k = 1; k <= counts[r] && idx < contacts.length; k += 1) {
      contacts[idx].name = `${label} ${k}`;
      perRoot[label] += 1;
      idx += 1;
    }
  }
  // Safety net: any leftover contacts (rounding edge cases) join the last root.
  if (idx < contacts.length) {
    const label = ROOTS[ROOTS.length - 1].label;
    while (idx < contacts.length) {
      perRoot[label] += 1;
      contacts[idx].name = `${label} ${perRoot[label]}`;
      idx += 1;
    }
  }

  return { counts, perRoot };
}

function writeOutputs(contacts) {
  fs.mkdirSync(EXPORT_DIR, { recursive: true });

  const vcf = contacts.map((c) => buildVCard(c.name, c.phone)).join('\r\n') + '\r\n';
  fs.writeFileSync(VCF_PATH, vcf, 'utf8');

  // Google Contacts-friendly CSV (Name + phone columns).
  const header = ['Name', 'Given Name', 'Phone 1 - Type', 'Phone 1 - Value'];
  const rows = contacts.map((c) => [
    csvEscape(c.name),
    csvEscape(c.name),
    'Mobile',
    csvEscape(c.phone)
  ].join(','));
  fs.writeFileSync(CSV_PATH, [header.join(','), ...rows].join('\r\n') + '\r\n', 'utf8');
}

function printSummary({ total, written, skipped, duplicates, mode, perRoot }) {
  console.log('--------------------------------------------------');
  console.log('Lead contacts export summary');
  console.log('--------------------------------------------------');
  console.log(`Mode:                ${mode}`);
  console.log(`Total leads read:    ${total}`);
  console.log(`Contacts written:    ${written}`);
  console.log(`Skipped (no/invalid phone): ${skipped}`);
  console.log(`Duplicates removed:  ${duplicates}`);
  console.log('Per-root counts:');
  ROOTS.forEach((r) => {
    console.log(`  - ${r.label}: ${(perRoot && perRoot[r.label]) || 0}`);
  });
  console.log(`vCard output:        ${VCF_PATH}`);
  console.log(`CSV output:          ${CSV_PATH}`);
  console.log('--------------------------------------------------');
}

// ---------------------------------------------------------------------------
// Sample mode: no DB. Emits a tiny demo file so the format is verifiable.
// ---------------------------------------------------------------------------
function runSample() {
  const fabricated = [
    { phone: '1134679434' },
    { phone: '+5491122334455' },
    { phone: '011 6789 0123' }
  ];
  const { contacts, skipped, duplicates } = buildContacts(fabricated);
  const { perRoot } = assignNames(contacts);
  writeOutputs(contacts);
  printSummary({
    total: fabricated.length,
    written: contacts.length,
    skipped,
    duplicates,
    perRoot,
    mode: 'SAMPLE (fabricated rows, no DB)'
  });
}

// ---------------------------------------------------------------------------
// Live mode: read all (or pending-only) leads from MongoDB.
// ---------------------------------------------------------------------------
async function runLive() {
  await connectDB();

  // --pending-only selects leads not yet contacted on the WhatsApp lifecycle
  // (`status` is 'pending' / missing / null). Default = ALL leads.
  const filter = cli.pendingOnly
    ? { $or: [{ status: 'pending' }, { status: { $exists: false } }, { status: null }] }
    : {};

  const leads = await PotentialProfessional
    .find(filter)
    .select('phone alias status')
    .lean();

  const { contacts, skipped, duplicates } = buildContacts(leads);
  const { perRoot } = assignNames(contacts);
  writeOutputs(contacts);
  printSummary({
    total: leads.length,
    written: contacts.length,
    skipped,
    duplicates,
    perRoot,
    mode: cli.pendingOnly ? 'LIVE (--pending-only)' : 'LIVE (all leads)'
  });
}

(async () => {
  if (cli.sample) {
    runSample();
    process.exit(0);
  }
  await runLive();
  process.exit(0);
})().catch((err) => {
  console.error('Export failed:', (err && err.message) || String(err));
  process.exit(1);
});
