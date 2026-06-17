require('dotenv').config();
const connectDB = require('./config/database');
const smsOutreachService = require('./services/smsOutreachService');
const smsService = require('./services/smsService');
const { REGISTER_URL } = require('./utils/professionalInviteMessage');

async function main() {
  console.log('--- Starting SMS Lead Outreach (CLI) ---');
  console.log(`Platform register link: ${REGISTER_URL}`);
  console.log(smsOutreachService.describeSchedule());

  if (!smsService.isConfigured()) {
    console.warn('[SMS] WARNING: Twilio is not fully configured. Set TWILIO_ACCOUNT_SID, '
      + 'TWILIO_AUTH_TOKEN and TWILIO_FROM_NUMBER or TWILIO_MESSAGING_SERVICE_SID. '
      + 'Leads will be skipped (left pending) until configured.');
  }
  console.log('Leads selected: potential_professionals where smsStatus === "pending".');
  console.log('This is a long-lived host process; keep it running so a night-window drip can resume.');

  await connectDB();

  const poll = setInterval(() => {
    const status = smsOutreachService.getStatus();
    if (status.phase === 'waiting_window') {
      const reason = status.waitingReason === 'nightly_cap_reached'
        ? 'nightly cap reached — waiting for next night'
        : 'outside night window — waiting to resume';
      console.log(`Paused (${reason}). Progress ${status.processed}/${status.total}.`);
    }
    if (status.phase === 'sending') {
      console.log(`Sending ${status.processed}/${status.total} — ${status.currentLead || ''}`);
    }
    if (status.phase === 'complete' || status.phase === 'error') {
      clearInterval(poll);
      console.log('\n--- SMS outreach finished ---');
      console.log(status);
      console.log('Press Ctrl+C to exit.');
    }
  }, 3000);

  smsOutreachService.startBulkOutreachBackground();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
