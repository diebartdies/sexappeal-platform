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
    console.error('[WA] Twilio WhatsApp API mode is off. Set TWILIO_WHATSAPP_FROM_NUMBER + creds on the server .env.');
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
