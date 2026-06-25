#!/usr/bin/env node
require('dotenv').config();
const mongoose = require('mongoose');
const connectDB = require('../config/database');
const ActivityLog = require('../models/ActivityLog');

const IPS = process.argv.slice(2);
if (!IPS.length) {
  console.error('Usage: node scripts/lookup-log-ips.js 1.2.3.4 ...');
  process.exit(1);
}

async function main() {
  await connectDB();
  for (const ip of IPS) {
    const logs = await ActivityLog.find({ ipAddress: ip })
      .sort({ createdAt: -1 })
      .limit(20)
      .select('action actorType ipAddress userAgent details createdAt')
      .lean();
    console.log(`\n=== ${ip} (${logs.length} events shown, max 20) ===`);
    if (!logs.length) {
      console.log('  (no ActivityLog rows)');
      continue;
    }
    logs.forEach((l, i) => {
      const ua = (l.userAgent || '').slice(0, 55);
      console.log(`${i + 1}|${l.createdAt.toISOString()}|${l.action}|${l.actorType || '—'}|${ua}`);
    });
  }
  await mongoose.disconnect();
}

main().catch((e) => { console.error(e.message); process.exit(1); });
