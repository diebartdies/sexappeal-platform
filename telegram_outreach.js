require('dotenv').config();
const readline = require('readline');
const connectDB = require('./config/database');
const telegramOutreachService = require('./services/telegramOutreachService');
const { REGISTER_URL } = require('./utils/professionalInviteMessage');

async function main() {
  const args = process.argv.slice(2);
  const loginMode = args.includes('--login');

  console.log('--- Telegram Lead Outreach ---');
  console.log(`Platform register link: ${REGISTER_URL}`);
  console.log(telegramOutreachService.describeSchedule());

  if (loginMode) {
    console.log('\n[Telegram] Login mode — authenticate your Telegram account.\n');

    if (!process.env.TELEGRAM_CODE) {
      const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
      const code = await new Promise((resolve) => {
        rl.question('Enter the Telegram code sent to your phone: ', (answer) => {
          rl.close();
          resolve(answer.trim());
        });
      });
      if (code) process.env.TELEGRAM_CODE = code;
    }

    if (!process.env.TELEGRAM_2FA_PASSWORD) {
      const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
      const pw = await new Promise((resolve) => {
        rl.question('Enter your Telegram 2FA password (or leave blank if none): ', (answer) => {
          rl.close();
          resolve(answer.trim());
        });
      });
      if (pw) process.env.TELEGRAM_2FA_PASSWORD = pw;
    }

    await telegramOutreachService.loginOnly();
    return;
  }

  await connectDB();

  console.log('\n[Telegram] Starting bulk outreach. Leads selected: potential_professionals with telegramStatus === "pending".');

  const poll = setInterval(() => {
    const status = telegramOutreachService.getStatus();
    if (status.phase === 'logging_in') {
    }
    if (status.phase === 'waiting_window') {
      const reason = status.waitingReason === 'nightly_cap_reached'
        ? 'nightly cap reached — waiting for next night'
        : 'outside night window — waiting to resume';
      console.log(`Paused (${reason}). Progress ${status.processed}/${status.total}.`);
    }
    if (status.phase === 'sending') {
      console.log(`Sending ${status.sent + status.failed + status.skipped}/${status.total} — ${status.currentLead || ''}`);
    }
    if (status.phase === 'complete' || status.phase === 'error') {
      clearInterval(poll);
      console.log('\n--- Telegram outreach finished ---');
      console.log(status);
      console.log('Press Ctrl+C to exit.');
    }
  }, 3000);

  telegramOutreachService.startBulkOutreachBackground();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
