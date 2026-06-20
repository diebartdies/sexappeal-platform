const config = require('../config/appConfig');
const smsService = require('./smsService');
const { getPlatformWhatsAppPhone } = require('../utils/whatsappConfig');
const {
  normalizeWhatsAppPhone,
  normalizeE164Digits,
  buildOutreachRegisterUrl
} = require('../utils/professionalInviteMessage');

function isApiModeEnabled() {
  if (process.env.WHATSAPP_USE_WEBJS === 'true') return false;
  if (process.env.TWILIO_WHATSAPP_API === 'false') return false;

  const { accountSid, authToken, whatsappFromNumber, fromNumber } = config.sms;
  if (!accountSid || !authToken) return false;

  if (process.env.TWILIO_WHATSAPP_API === 'true') return true;
  return Boolean(whatsappFromNumber || fromNumber);
}

function isReadySync() {
  if (!isApiModeEnabled()) return false;
  const { whatsappFromNumber, fromNumber } = config.sms;
  if (whatsappFromNumber || fromNumber) return true;
  return process.env.TWILIO_WHATSAPP_API === 'true';
}

function getConfigError() {
  if (!isApiModeEnabled()) return '';
  const { accountSid, authToken } = config.sms;
  if (!accountSid || !authToken) {
    return 'Twilio credentials missing (TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN)';
  }
  return '';
}

function formatWhatsAppAddress(digits) {
  const clean = normalizeE164Digits(digits) || normalizeWhatsAppPhone(digits);
  return clean ? `whatsapp:+${clean}` : '';
}

function resolveMediaUrl(options = {}) {
  if (options.mediaUrl) return options.mediaUrl;
  if (config.sms.whatsappMediaUrl) return config.sms.whatsappMediaUrl;
  const base = (config.platform?.publicUrl || '').replace(/\/$/, '');
  return base ? `${base}/images/outreach-logo.png` : '';
}

function buildContentVariables(options = {}) {
  if (options.contentVariables) return options.contentVariables;
  const alias = (options.alias && String(options.alias).trim()) || 'hermosa';
  const registerUrl = buildOutreachRegisterUrl()
    || config.platform?.registerUrl
    || `${(config.platform?.publicUrl || '').replace(/\/$/, '')}/register.html`;
  return JSON.stringify({
    1: alias,
    2: registerUrl || ''
  });
}

async function resolveFromAddress() {
  const phone = await getPlatformWhatsAppPhone();
  return formatWhatsAppAddress(phone);
}

function isWhatsAppSendingAllowed() {
  if (config.env !== 'production' && !config.sms.allowNonProd) {
    return {
      ok: false,
      reason: `WhatsApp suppressed in ${config.env} (set SMS_ALLOW_NON_PROD=true to allow)`
    };
  }
  return { ok: true };
}

async function sendWhatsAppMessage(toPhone, body, options = {}) {
  if (!isApiModeEnabled()) {
    throw new Error('Twilio WhatsApp API mode is not enabled');
  }

  const configError = getConfigError();
  if (configError) throw new Error(configError);

  const gate = isWhatsAppSendingAllowed();
  if (!gate.ok) throw new Error(gate.reason);

  const to = formatWhatsAppAddress(toPhone);
  if (!to) throw new Error('Invalid WhatsApp recipient phone number');

  const from = await resolveFromAddress();
  if (!from) {
    throw new Error('Platform WhatsApp sender missing — save the number in Admin or set TWILIO_WHATSAPP_FROM_NUMBER');
  }

  const client = smsService.getClient ? smsService.getClient() : null;
  if (!client) {
    throw new Error('Twilio client unavailable (missing creds or twilio package not installed)');
  }

  const contentSid = options.contentSid || config.sms.whatsappContentSid || '';
  const payload = { from, to };

  if (contentSid) {
    payload.contentSid = contentSid;
    payload.contentVariables = buildContentVariables(options);
  } else {
    const text = String(body || '').trim();
    if (!text) throw new Error('Empty WhatsApp message body');
    payload.body = text;
    const mediaUrl = options.mediaPath ? resolveMediaUrl(options) : (options.includeMedia === false ? '' : resolveMediaUrl(options));
    if (mediaUrl) payload.mediaUrl = [mediaUrl];
  }

  const message = await smsService.withTimeout(
    client.messages.create(payload),
    config.sms.sendTimeoutMs,
    'twilio.whatsapp.messages.create'
  );

  return message.sid || true;
}

module.exports = {
  isApiModeEnabled,
  isReadySync,
  getConfigError,
  sendWhatsAppMessage,
  formatWhatsAppAddress,
  resolveFromAddress
};
