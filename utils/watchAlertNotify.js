const https = require('https');
const sendEmail = require('../sendEmail');
const { sendWatchWhatsAppAlert } = require('../services/watchWhatsAppSender');
const { getPlatformWhatsAppPhone } = require('./whatsappConfig');

function whatsappEnabled() {
  return process.env.WATCH_ALERT_WHATSAPP !== 'off';
}

function emailFallbackEnabled() {
  return process.env.WATCH_EMAIL_FALLBACK === '1' || process.env.WATCH_EMAIL_FALLBACK === 'true';
}

async function alertWhatsAppNumber() {
  return getPlatformWhatsAppPhone();
}

function callMeBotSend(phone, text, apiKey) {
  const query = new URLSearchParams({
    phone: phone.startsWith('+') ? phone : `+${phone}`,
    text,
    apikey: apiKey
  });

  return new Promise((resolve, reject) => {
    const req = https.get(`https://api.callmebot.com/whatsapp.php?${query.toString()}`, (res) => {
      res.resume();
      if (res.statusCode >= 200 && res.statusCode < 300) {
        resolve(true);
        return;
      }
      reject(new Error(`CallMeBot HTTP ${res.statusCode}`));
    });
    req.on('error', reject);
    req.setTimeout(15000, () => {
      req.destroy();
      reject(new Error('CallMeBot timeout'));
    });
  });
}

async function sendWhatsAppAlert(message) {
  const phone = await alertWhatsAppNumber();
  const apiKey = process.env.WATCH_CALLMEBOT_API_KEY;

  if (apiKey) {
    await callMeBotSend(phone, message, apiKey);
    console.log('[server-watch] WhatsApp alert sent via CallMeBot to', phone);
    return true;
  }

  if (!process.stdout.isTTY) {
    throw new Error(
      'Scheduled Task cannot show QR. Register WhatsApp in Admin Dashboard → Dashboard Config first, ' +
      'or set WATCH_CALLMEBOT_API_KEY in .env'
    );
  }

  console.log('[server-watch] Using WhatsApp Web session (scan QR if prompted)...');
  await sendWatchWhatsAppAlert(phone, message, { showQr: true });
  console.log('[server-watch] WhatsApp alert sent to', phone);
  return true;
}

async function sendEmailAlert(subject, message, emailTo) {
  if (!process.env.SMTP_HOST || !process.env.SMTP_EMAIL) {
    return false;
  }
  await sendEmail({ email: emailTo, subject, message });
  console.log('[server-watch] Email alert sent to', emailTo);
  return true;
}

/**
 * Primary: WhatsApp. Optional email fallback if WATCH_EMAIL_FALLBACK=1 or WhatsApp fails.
 */
async function notifyAlert({ subject, message, emailTo }) {
  const waMessage = `${subject}\n\n${message}`;

  if (whatsappEnabled()) {
    try {
      return await sendWhatsAppAlert(waMessage);
    } catch (err) {
      console.error('[server-watch] WhatsApp alert failed:', err.message);
      if (emailFallbackEnabled()) {
        return sendEmailAlert(subject, message, emailTo);
      }
      return false;
    }
  }

  console.error('[server-watch] No alert channel succeeded.');
  console.error(subject);
  console.error(message);
  return false;
}

module.exports = {
  notifyAlert,
  alertWhatsAppNumber
};
