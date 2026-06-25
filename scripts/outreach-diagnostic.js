#!/usr/bin/env node
require('dotenv').config();
const mongoose = require('mongoose');
const connectDB = require('../config/database');
const PotentialProfessional = require('../models/PotentialProfessional');
const WhatsAppInboundMessage = require('../models/WhatsAppInboundMessage');
const WhatsAppOutboundMessage = require('../models/WhatsAppOutboundMessage');
const User = require('../models/User');

async function main() {
  await connectDB();

  const since = new Date(Date.now() - 48 * 60 * 60 * 1000);

  const statusCounts = await PotentialProfessional.aggregate([
    { $group: { _id: { $ifNull: ['$status', 'pending'] }, count: { $sum: 1 } } },
    { $sort: { count: -1 } }
  ]);

  const contactedTotal = await PotentialProfessional.countDocuments({ status: 'contacted' });
  const contactedWithWaSent = await PotentialProfessional.countDocuments({
    status: 'contacted',
    whatsappSentAt: { $exists: true, $ne: null }
  });
  const contactedManualOnly = contactedTotal - contactedWithWaSent;

  const recentContacted = await PotentialProfessional.find({
    status: 'contacted',
    $or: [
      { whatsappSentAt: { $gte: since } },
      { createdAt: { $gte: since } }
    ]
  })
    .sort({ whatsappSentAt: -1, updatedAt: -1 })
    .limit(30)
    .select('alias phone status whatsappSentAt whatsappError smsStatus smsSentAt createdAt')
    .lean();

  const inboundTotal = await WhatsAppInboundMessage.countDocuments({});
  const inboundRecent = await WhatsAppInboundMessage.find({})
    .sort({ createdAt: -1 })
    .limit(10)
    .select('fromPhone body createdAt')
    .lean();

  const outboundTotal = await WhatsAppOutboundMessage.countDocuments({});
  const outboundRecent = await WhatsAppOutboundMessage.find({})
    .sort({ createdAt: -1 })
    .limit(10)
    .select('toPhone body status error createdAt')
    .lean();

  const expressRegs = await User.countDocuments({
    role: 'professional',
    registrationMode: 'express',
    createdAt: { $gte: since }
  });

  console.log('=== LEAD STATUS COUNTS ===');
  statusCounts.forEach((row) => console.log(`${row._id}: ${row.count}`));

  console.log('\n=== CONTACTED BREAKDOWN ===');
  console.log(`contacted_total: ${contactedTotal}`);
  console.log(`contacted_with_whatsappSentAt: ${contactedWithWaSent}`);
  console.log(`contacted_manual_mark_only: ${contactedManualOnly}`);

  console.log('\n=== INBOUND REPLIES (Twilio webhook) ===');
  console.log(`inbound_total: ${inboundTotal}`);
  inboundRecent.forEach((m, i) => {
    console.log(`${i + 1}|+${m.fromPhone}|${(m.body || '').slice(0, 80)}|${m.createdAt?.toISOString?.() || m.createdAt}`);
  });

  console.log('\n=== OUTBOUND LOG (Twilio/manual) ===');
  console.log(`outbound_total: ${outboundTotal}`);
  outboundRecent.forEach((m, i) => {
    console.log(`${i + 1}|+${m.toPhone}|${m.status || '—'}|${(m.body || '').slice(0, 60)}|${m.createdAt?.toISOString?.() || m.createdAt}`);
  });

  console.log('\n=== RECENT CONTACTED LEADS (48h) ===');
  recentContacted.forEach((l, i) => {
    const sent = l.whatsappSentAt ? 'WA_SENT' : 'MANUAL_ONLY';
    console.log(`${i + 1}|${l.alias || '—'}|+${l.phone}|${sent}|${l.whatsappSentAt?.toISOString?.() || '—'}|sms:${l.smsStatus || '—'}`);
  });

  console.log('\n=== NEW EXPRESS REGISTRATIONS (48h) ===');
  console.log(`count: ${expressRegs}`);

  await mongoose.disconnect();
}

main().catch((err) => {
  console.error('Failed:', err.message);
  process.exit(1);
});
