require('dotenv').config();
const connectDB = require('../config/database');
const PotentialProfessional = require('../models/PotentialProfessional');
const { normalizeWhatsAppPhone } = require('../utils/professionalInviteMessage');

/**
 * Mark one or more leads as contacted (WhatsApp invite sent manually or via drip).
 *
 * Usage:
 *   node scripts/mark-leads-contacted.js 5491172329908 5491166810068
 *   node scripts/mark-leads-contacted.js +5491172329908
 */
async function main() {
  const rawArgs = process.argv.slice(2);
  if (rawArgs.length === 0) {
    console.error('Provide at least one phone number.');
    console.error('Example: node scripts/mark-leads-contacted.js 5491172329908 5491166810068');
    process.exit(1);
  }

  await connectDB();

  const now = new Date();
  let updated = 0;
  let notFound = 0;

  for (const raw of rawArgs) {
    const phone = normalizeWhatsAppPhone(raw);
    if (!phone) {
      console.warn(`Skipped invalid phone: ${raw}`);
      continue;
    }

    const lead = await PotentialProfessional.findOneAndUpdate(
      { phone },
      { $set: { status: 'contacted', whatsappSentAt: now, whatsappError: null } },
      { new: true }
    );

    if (lead) {
      updated += 1;
      console.log(`Contacted: ${phone} (${lead.alias || '—'})`);
    } else {
      notFound += 1;
      console.warn(`Not found: ${phone}`);
    }
  }

  console.log(`\nDone. Updated ${updated}, not found ${notFound}.`);
  process.exit(0);
}

main().catch((err) => {
  console.error('Failed:', err.message);
  process.exit(1);
});
