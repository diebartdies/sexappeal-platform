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
 *   - exports/leads-contacts.vcf  (vCard 3.0 - import on the outreach phone)
 *
 * PHONE vs GOOGLE: vCard has no universal field that forces "device only" storage.
 * At import time you must pick Teléfono / Dispositivo / Phone (NOT your Gmail).
 * Do NOT import via contacts.google.com. Optional --google-csv writes a CSV meant
 * only for Google Contacts web (off by default).
 *
 * NAMING: Each contact uses the lead's real `alias` from the DB or CSV. Empty
 * aliases fall back to "Contacto" plus the last four phone digits. Duplicate
 * display names get a numeric suffix ("Megan 2"). The TEL;TYPE=CELL:+549...
 * value is kept exactly (that is what WhatsApp matches).
 *
 * Usage:
 *   node scripts/export-contacts-vcf.js
 *   node scripts/export-contacts-vcf.js --pending-only
 *   node scripts/export-contacts-vcf.js --from-csv exports/all-leads-deduped.csv
 *   node scripts/export-contacts-vcf.js --google-csv    # also write Google Contacts CSV
 *   node scripts/export-contacts-vcf.js --sample        # offline: write a tiny demo .vcf, no DB
 *
 * Env overrides:
 *   MONGO_URI=...                                     (DB connection, mirrors the rest of the project)
 */

// ---------------------------------------------------------------------------
// CLI / config parsing
// ---------------------------------------------------------------------------
function parseArgs(argv) {
  const args = { pendingOnly: false, sample: false, googleCsv: false, fromCsv: null };
  for (let i = 0; i < argv.length; i += 1) {
    const a = argv[i];
    if (a === '--pending-only') {
      args.pendingOnly = true;
    } else if (a === '--sample') {
      args.sample = true;
    } else if (a === '--google-csv') {
      args.googleCsv = true;
    } else if (a === '--from-csv') {
      args.fromCsv = argv[++i] || null;
    } else if (a.startsWith('--from-csv=')) {
      args.fromCsv = a.slice('--from-csv='.length) || null;
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
    const alias = lead.alias != null ? String(lead.alias).trim() : '';
    seen.set(normalized, { phone: normalized, alias });
  }

  return { contacts: Array.from(seen.values()), skipped, duplicates };
}

// ---------------------------------------------------------------------------
// Naming: use each lead's alias; suffix duplicates; fallback when missing.
// ---------------------------------------------------------------------------
function sanitizeAlias(value) {
  return String(value || '')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, 80);
}

function fallbackName(phone) {
  const digits = String(phone || '').replace(/\D/g, '');
  const tail = digits.slice(-4) || '????';
  return `Contacto ${tail}`;
}

function assignAliases(contacts) {
  const used = new Map();
  let fromAlias = 0;
  let fromFallback = 0;
  let renamedDuplicates = 0;

  for (const contact of contacts) {
    let base = sanitizeAlias(contact.alias);
    if (base) {
      fromAlias += 1;
    } else {
      base = fallbackName(contact.phone);
      fromFallback += 1;
    }

    const key = base.toLowerCase();
    const count = used.get(key) || 0;
    used.set(key, count + 1);
    if (count === 0) {
      contact.name = base;
    } else {
      contact.name = `${base} ${count + 1}`;
      renamedDuplicates += 1;
    }
  }

  return { fromAlias, fromFallback, renamedDuplicates };
}

function writeOutputs(contacts) {
  fs.mkdirSync(EXPORT_DIR, { recursive: true });

  const vcf = contacts.map((c) => buildVCard(c.name, c.phone)).join('\r\n') + '\r\n';
  fs.writeFileSync(VCF_PATH, vcf, 'utf8');

  if (!cli.googleCsv) return;

  // Google Contacts web import only — do NOT use for phone-local storage.
  const header = ['Name', 'Given Name', 'Phone 1 - Type', 'Phone 1 - Value'];
  const rows = contacts.map((c) => [
    csvEscape(c.name),
    csvEscape(c.name),
    'Mobile',
    csvEscape(c.phone)
  ].join(','));
  fs.writeFileSync(CSV_PATH, [header.join(','), ...rows].join('\r\n') + '\r\n', 'utf8');
}

function printPhoneImportInstructions() {
  console.log('');
  console.log('Importar SOLO en el teléfono (no Google):');
  console.log('  1. Pasá leads-contacts.vcf al celular de outreach (USB, Telegram, etc.)');
  console.log('  2. Abrí la app Contactos (no Gmail ni contacts.google.com)');
  console.log('  3. Menú → Administrar contactos → Importar → elegí el .vcf');
  console.log('  4. Destino: Teléfono / Dispositivo / Phone — NO tu cuenta Gmail');
  console.log('  5. Si abrís el .vcf desde Drive/Gmail, puede ir directo a Google;');
  console.log('     usá siempre Importar dentro de la app Contactos.');
  console.log('');
}

function printSummary({ total, written, skipped, duplicates, mode, naming }) {
  console.log('--------------------------------------------------');
  console.log('Lead contacts export summary');
  console.log('--------------------------------------------------');
  console.log(`Mode:                ${mode}`);
  console.log(`Total leads read:    ${total}`);
  console.log(`Contacts written:    ${written}`);
  console.log(`Skipped (no/invalid phone): ${skipped}`);
  console.log(`Duplicates removed:  ${duplicates}`);
  if (naming) {
    console.log(`Named from alias:    ${naming.fromAlias}`);
    console.log(`Fallback names:      ${naming.fromFallback}`);
    console.log(`Duplicate aliases:   ${naming.renamedDuplicates}`);
  }
  console.log(`vCard output:        ${VCF_PATH}`);
  if (cli.googleCsv) {
    console.log(`CSV output:          ${CSV_PATH} (Google Contacts web only)`);
  } else {
    console.log('CSV output:          (skipped — use --google-csv if you need Google web import)');
  }
  console.log('--------------------------------------------------');
  printPhoneImportInstructions();
}

// ---------------------------------------------------------------------------
// Sample mode: no DB. Emits a tiny demo file so the format is verifiable.
// ---------------------------------------------------------------------------
function runSample() {
  const fabricated = [
    { phone: '1134679434', alias: 'Rubi Alba' },
    { phone: '+5491122334455', alias: 'Solcito' },
    { phone: '011 6789 0123', alias: '' }
  ];
  const { contacts, skipped, duplicates } = buildContacts(fabricated);
  const naming = assignAliases(contacts);
  writeOutputs(contacts);
  printSummary({
    total: fabricated.length,
    written: contacts.length,
    skipped,
    duplicates,
    naming,
    mode: 'SAMPLE (fabricated rows, no DB)'
  });
}

// ---------------------------------------------------------------------------
// CSV mode: read Phone column from a merged export (no DB).
// ---------------------------------------------------------------------------
function splitCsvLine(line) {
  const out = [];
  let cur = '';
  let inQ = false;
  for (let i = 0; i < line.length; i += 1) {
    const c = line[i];
    if (inQ) {
      if (c === '"') {
        if (line[i + 1] === '"') {
          cur += '"';
          i += 1;
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

function readLeadsFromCsv(csvPath) {
  const resolved = path.resolve(csvPath);
  if (!fs.existsSync(resolved)) {
    throw new Error(`CSV not found: ${resolved}`);
  }
  const lines = fs.readFileSync(resolved, 'utf8').split(/\r?\n/).filter((l) => l.trim());
  if (lines.length < 2) return [];
  const header = splitCsvLine(lines[0]).map((h) => h.trim().toLowerCase());
  const phoneIdx = header.indexOf('phone');
  const aliasIdx = header.indexOf('alias');
  if (phoneIdx === -1) throw new Error('CSV must have a Phone column');
  const leads = [];
  for (let i = 1; i < lines.length; i += 1) {
    const cols = splitCsvLine(lines[i]);
    const phone = (cols[phoneIdx] || '').trim();
    const alias = aliasIdx >= 0 ? (cols[aliasIdx] || '').trim() : '';
    if (phone) leads.push({ phone, alias });
  }
  return leads;
}

function runFromCsv(csvPath) {
  const leads = readLeadsFromCsv(csvPath);
  const { contacts, skipped, duplicates } = buildContacts(leads);
  const naming = assignAliases(contacts);
  writeOutputs(contacts);
  printSummary({
    total: leads.length,
    written: contacts.length,
    skipped,
    duplicates,
    naming,
    mode: `CSV (${path.basename(csvPath)})`
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
  const naming = assignAliases(contacts);
  writeOutputs(contacts);
  printSummary({
    total: leads.length,
    written: contacts.length,
    skipped,
    duplicates,
    naming,
    mode: cli.pendingOnly ? 'LIVE (--pending-only)' : 'LIVE (all leads)'
  });
}

(async () => {
  if (cli.sample) {
    runSample();
    process.exit(0);
  }
  if (cli.fromCsv) {
    runFromCsv(cli.fromCsv);
    process.exit(0);
  }
  await runLive();
  process.exit(0);
})().catch((err) => {
  console.error('Export failed:', (err && err.message) || String(err));
  process.exit(1);
});
