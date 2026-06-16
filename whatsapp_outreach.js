const qrcode = require('qrcode-terminal');
const connectDB = require('./config/database');
const outreachService = require('./services/whatsappOutreachService');
const { REGISTER_URL } = require('./utils/professionalInviteMessage');

async function main() {
  console.log('--- Starting WhatsApp Lead Outreach (CLI) ---');
  console.log(`Platform register link: ${REGISTER_URL}`);
  console.log(outreachService.describeSchedule());
  console.log('This is a long-lived host process: keep it running overnight so it can');
  console.log('pause outside the night window and resume when the window reopens.');

  await connectDB();

  const poll = setInterval(() => {
    const status = outreachService.getStatus();
    if (status.phase === 'qr' && status.qr) {
      console.log('\n📱 Scan this QR code with WhatsApp:');
      qrcode.generate(status.qr, { small: true });
    }
    if (status.phase === 'waiting_window') {
      const reason = status.waitingReason === 'nightly_cap_reached'
        ? 'nightly cap reached — waiting for next night'
        : 'outside night window — waiting to resume';
      console.log(`Paused (${reason}). Progress ${status.sent + status.failed + status.skipped}/${status.total}.`);
    }
    if (status.phase === 'sending') {
      console.log(`Sending ${status.sent + status.failed + status.skipped}/${status.total} — ${status.currentLead || ''}`);
    }
    if (status.phase === 'complete' || status.phase === 'error') {
      clearInterval(poll);
      console.log('\n--- Outreach finished ---');
      console.log(status);
      console.log('Listening for replies is not enabled in service mode. Press Ctrl+C to exit.');
    }
  }, 3000);

  outreachService.startBulkOutreachBackground();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
