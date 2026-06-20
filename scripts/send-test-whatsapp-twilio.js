#!/usr/bin/env node
/**
 * Send one test WhatsApp via Twilio API (no QR).
 * Usage: node scripts/send-test-whatsapp-twilio.js 5491178280156 [alias]
 */
require('dotenv').config();
const twilioWa = require('../services/twilioWhatsAppService');
const { buildSanitizedWhatsAppCaption } = require('../utils/professionalInviteMessage');

async function main() {
  const to = process.argv[2];
  const alias = process.argv[3] || 'hermosa';

  if (!to) {
    console.error('Usage: node scripts/send-test-whatsapp-twilio.js <phone> [alias]');
    process.exit(1);
  }

  if (!twilioWa.isApiModeEnabled()) {
    const cfg = require('../config/appConfig');
    console.error('[WA] Twilio WhatsApp API mode is off.');
    console.error('[WA] Checks:');
    console.error('  WHATSAPP_USE_WEBJS =', process.env.WHATSAPP_USE_WEBJS || '(unset)');
    console.error('  TWILIO_WHATSAPP_API =', process.env.TWILIO_WHATSAPP_API || '(unset)');
    console.error('  TWILIO_WHATSAPP_FROM_NUMBER =', process.env.TWILIO_WHATSAPP_FROM_NUMBER ? 'set' : 'MISSING');
    console.error('  TWILIO_ACCOUNT_SID =', cfg.sms.accountSid ? 'set' : 'MISSING');
    console.error('  TWILIO_AUTH_TOKEN =', cfg.sms.authToken ? 'set' : 'MISSING');
    console.error('[WA] On prod: add TWILIO_WHATSAPP_FROM_NUMBER=15559340276 to /root/SexAppeal-platform/.env');
    console.error('[WA] Then: docker compose up -d --force-recreate app');
    process.exit(1);
  }

  const err = twilioWa.getConfigError();
  if (err) {
    console.error('[WA]', err);
    process.exit(1);
  }

  const body = buildSanitizedWhatsAppCaption(alias);
  console.log('[WA] Sending test to', to, '...');

  const sid = await twilioWa.sendWhatsAppMessage(to, body, { alias, includeMedia: true });
  console.log('[WA] Sent OK. SID:', sid);
}

main().catch((err) => {
  console.error('[WA] Failed:', err.message);
  process.exit(1);
});
