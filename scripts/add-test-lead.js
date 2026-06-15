require('dotenv').config();
const connectDB = require('../config/database');
const PotentialProfessional = require('../models/PotentialProfessional');
const { normalizeWhatsAppPhone } = require('../utils/professionalInviteMessage');

/**
 * Add (or reset to pending) one or more phone numbers as potential professional leads.
 * Useful for sending a controlled test invitation before a bulk run.
 *
 * Usage:
 *   node scripts/add-test-lead.js +5491134679434
 *   node scripts/add-test-lead.js +5491134679434 "Test Alias"
 *   node scripts/add-test-lead.js 5491134679434 5491122334455
 */
async function addTestLeads() {
  const rawArgs = process.argv.slice(2);
  if (rawArgs.length === 0) {
    console.error('Provide at least one phone number. Example: node scripts/add-test-lead.js +5491134679434');
    process.exit(1);
  }

  // Optional alias: if exactly two args and the second is non-numeric, treat it as alias
  let phones = rawArgs;
  let alias = '';
  if (rawArgs.length === 2 && /[a-zA-Z]/.test(rawArgs[1])) {
    phones = [rawArgs[0]];
    alias = rawArgs[1];
  }

  await connectDB();

  for (const raw of phones) {
    const normalized = normalizeWhatsAppPhone(raw);
    if (!normalized) {
      console.warn(`Skipped invalid phone: ${raw}`);
      continue;
    }

    const existing = await PotentialProfessional.findOne({ phone: normalized });
    if (existing) {
      existing.status = 'pending';
      if (alias) existing.alias = alias;
      existing.sourceUrl = existing.sourceUrl || 'manual-test';
      await existing.save();
      console.log(`Reset existing lead to pending: ${normalized}${alias ? ` (${alias})` : ''}`);
    } else {
      await PotentialProfessional.create({
        phone: normalized,
        alias: alias || undefined,
        sourceUrl: 'manual-test',
        status: 'pending'
      });
      console.log(`Added new pending lead: ${normalized}${alias ? ` (${alias})` : ''}`);
    }
  }

  console.log('\nDone. Open Admin → Apply Invitations, select ONLY this number, and use "Apply invitation to selected" to send the test.');
  process.exit(0);
}

addTestLeads().catch((err) => {
  console.error('Failed to add test lead:', err);
  process.exit(1);
});
