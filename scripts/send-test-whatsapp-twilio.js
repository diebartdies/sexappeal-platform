#!/usr/bin/env node
/**
 * Send one test WhatsApp via Twilio API (template watext_updated when CONTENT_SID is set).
 * Step 1 only: {{1}} = alias. Register link is sent manually in step 2 after she replies.
 * Usage: node scripts/send-test-whatsapp-twilio.js 5491178280156 [alias]
 */
require('dotenv').config();
const twilioWa = require('../services/twilioWhatsAppService');
const { buildSanitizedWhatsAppCaption } = require('../utils/professionalInviteMessage');

async function main() {
  const to = process.argv[2];
  const alias = process.argv[3] || twilioWa.WATEXT_TEMPLATE_EXAMPLES['1'];

  if (!to) {
    console.error('Usage: node scripts/send-test-whatsapp-twilio.js <phone> [alias]');
    process.exit(1);
  }

  if (!twilioWa.isApiModeEnabled()) {
    const cfg = require('../config/appConfig');
    console.error('[WA] Twilio WhatsApp API mode is off.');
    console.error('[WA] TWILIO_WHATSAPP_FROM_NUMBER =', process.env.TWILIO_WHATSAPP_FROM_NUMBER ? 'set' : 'MISSING');
    console.error('[WA] TWILIO_ACCOUNT_SID =', cfg.sms.accountSid ? 'set' : 'MISSING');
    process.exit(1);
  }

  const err = twilioWa.getConfigError();
  if (err) {
    console.error('[WA]', err);
    process.exit(1);
  }

  const block = twilioWa.getColdOutreachBlockReason();
  if (block) {
    console.error('[WA]', block);
    process.exit(1);
  }

  const contentVariables = twilioWa.buildContentVariables({ alias });

  console.log('[WA] Template watext_updated (step 1):');
  console.log('  {{1}} alias example:', alias);
  console.log('[WA] contentVariables JSON:', contentVariables);
  console.log('[WA] Sending test to', to, '...');

  const body = buildSanitizedWhatsAppCaption(alias);
  const sid = await twilioWa.sendWhatsAppMessage(to, body, {
    alias,
    useTemplate: true,
    includeMedia: false
  });
  console.log('[WA] Sent OK. SID:', sid);
}

main().catch((err) => {
  console.error('[WA] Failed:', err.message);
  process.exit(1);
});
