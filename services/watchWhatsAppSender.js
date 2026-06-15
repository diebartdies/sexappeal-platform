const platformService = require('./whatsappPlatformService');
const { getPlatformWhatsAppPhone, formatWhatsAppPhoneDisplay } = require('../utils/whatsappConfig');
const { normalizeWhatsAppPhone } = require('../utils/professionalInviteMessage');

async function loginWatchWhatsAppSession() {
  const phone = await getPlatformWhatsAppPhone();
  console.log('\n========================================');
  console.log(`  Scan with WhatsApp on ${formatWhatsAppPhoneDisplay(phone)}`);
  console.log('  Menu: Linked devices → Link a device');
  console.log('========================================\n');

  let qrcode;
  try {
    qrcode = require('qrcode-terminal');
  } catch {
    qrcode = null;
  }

  const qrPoll = setInterval(() => {
    const qr = platformService.getQrCode();
    if (qr && qrcode) {
      console.clear();
      console.log(`Scan with WhatsApp on ${formatWhatsAppPhoneDisplay(phone)}\n`);
      qrcode.generate(qr, { small: true });
      console.log('');
    }
  }, 2000);

  try {
    await platformService.startRegistration();
    await platformService.waitForReady();
    console.log('[whatsapp] Platform WhatsApp session saved.');
  } finally {
    clearInterval(qrPoll);
    await platformService.destroyClient();
  }
}

async function sendWatchWhatsAppAlert(phone, message, options = {}) {
  const cleanPhone = normalizeWhatsAppPhone(phone);
  if (!cleanPhone) {
    throw new Error('Invalid WhatsApp alert phone number');
  }

  const showQr = options.showQr !== false && process.stdout.isTTY;
  const originPhone = await getPlatformWhatsAppPhone();

  if (showQr) {
    console.log('\n========================================');
    console.log(`  Scan with WhatsApp on ${formatWhatsAppPhoneDisplay(originPhone)}`);
    console.log('  Menu: Linked devices → Link a device');
    console.log('========================================\n');
  }

  try {
    await platformService.sendMessage(cleanPhone, message, {
      timeoutMs: options.timeoutMs || (showQr ? platformService.DEFAULT_TIMEOUT_MS : 90000)
    });
    console.log('[whatsapp] Message sent to +' + cleanPhone);
    return true;
  } finally {
    if (options.destroyAfter !== false && !process.env.KEEP_WHATSAPP_CLIENT) {
      await platformService.destroyClient();
    }
  }
}

module.exports = {
  sendWatchWhatsAppAlert,
  loginWatchWhatsAppSession
};
