#!/usr/bin/env node
/**
 * Mark lead(s) by phone as do-not-contact (outreach block).
 *
 * Usage:
 *   node scripts/block-outreach-phone.js +5491172877783 "Requested stop / legal threat"
 *   node scripts/block-outreach-phone.js 5491172877783 --dry-run
 */
require('dotenv').config();
const connectDB = require('../config/database');
const PotentialProfessional = require('../models/PotentialProfessional');
const { expandPhoneVariants, buildPhoneInQuery } = require('../utils/outreachPhone');

async function main() {
  const phoneArg = process.argv[2];
  const dryRun = process.argv.includes('--dry-run');
  const reasonParts = process.argv.slice(3).filter((a) => a !== '--dry-run');
  const reason = reasonParts.join(' ').trim() || 'Blocked manually';

  if (!phoneArg) {
    console.error('Usage: node scripts/block-outreach-phone.js <phone> [reason] [--dry-run]');
    process.exit(1);
  }

  await connectDB();

  const variants = expandPhoneVariants(phoneArg);
  const query = buildPhoneInQuery(phoneArg);
  if (!query) {
    console.error('Could not normalize phone:', phoneArg);
    process.exit(1);
  }

  const matches = await PotentialProfessional.find(query);
  console.log('Phone variants:', variants.join(', '));
  console.log('Matches:', matches.length);

  if (!matches.length) {
    console.log('No lead found — creating block-only lead row.');
    if (!dryRun) {
      const phone = variants[0];
      await PotentialProfessional.create({
        phone,
        alias: '',
        status: 'rejected',
        doNotContact: true,
        doNotContactReason: reason,
        doNotContactAt: new Date(),
        sourceUrl: 'manual:block-outreach-phone'
      });
      console.log('Created blocked lead for', phone);
    }
    process.exit(0);
  }

  for (const lead of matches) {
    console.log(`- ${lead._id} alias=${lead.alias || '—'} phone=${lead.phone} status=${lead.status}`);
    if (!dryRun) {
      lead.doNotContact = true;
      lead.doNotContactReason = reason;
      lead.doNotContactAt = new Date();
      if (lead.status === 'pending') lead.status = 'rejected';
      await lead.save();
    }
  }

  if (dryRun) console.log('(dry run — no changes written)');
  else console.log('Blocked outreach for', matches.length, 'lead(s).');
  process.exit(0);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
