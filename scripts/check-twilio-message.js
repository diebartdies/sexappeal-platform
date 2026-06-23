#!/usr/bin/env node
/**
 * Fetch Twilio message delivery status by SID.
 * Usage: node scripts/check-twilio-message.js <MessageSid>
 */
require('dotenv').config();
const smsService = require('../services/smsService');

async function main() {
  const sid = process.argv[2];
  if (!sid) {
    console.error('Usage: node scripts/check-twilio-message.js <MessageSid>');
    process.exit(1);
  }

  const client = smsService.getClient();
  if (!client) {
    console.error('[Twilio] Client unavailable — check TWILIO_ACCOUNT_SID / TWILIO_AUTH_TOKEN');
    process.exit(1);
  }

  const m = await client.messages(sid).fetch();
  const out = {
    sid: m.sid,
    status: m.status,
    errorCode: m.errorCode,
    errorMessage: m.errorMessage,
    from: m.from,
    to: m.to,
    direction: m.direction,
    dateCreated: m.dateCreated,
    dateUpdated: m.dateUpdated,
    dateSent: m.dateSent,
    numSegments: m.numSegments,
    price: m.price,
    priceUnit: m.priceUnit
  };
  console.log(JSON.stringify(out, null, 2));
}

main().catch((err) => {
  console.error('[Twilio]', err.message);
  process.exit(1);
});
