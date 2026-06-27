#!/usr/bin/env node
require('dotenv').config();
const mongoose = require('mongoose');
const connectDB = require('../config/database');
const ActivityLog = require('../models/ActivityLog');
const PublicIpIntel = require('../models/PublicIpIntel');
const { formatIpIntelSummary } = require('../services/ipIntelService');

const IPS = process.argv.slice(2);

async function main() {
  await connectDB();

  if (!IPS.length) {
    console.error('Usage: node scripts/lookup-log-ips.js 1.2.3.4 ...');
    process.exit(1);
  }

  for (const ip of IPS) {
    const intel = await PublicIpIntel.findOne({ ip }).lean();
    console.log(`\n=== ${ip} ===`);
    if (intel) {
      console.log(`INTEL|${intel.status}|${formatIpIntelSummary(intel)}`);
      if (intel.status === 'success') {
        console.log(`  lat/lon: ${intel.lat}, ${intel.lon}`);
        console.log(`  isp: ${intel.isp || '—'}`);
        console.log(`  org: ${intel.org || '—'}`);
        console.log(`  asn: ${intel.as || '—'}`);
        console.log(`  proxy/mobile/hosting: ${intel.proxy}/${intel.mobile}/${intel.hosting}`);
      }
    } else {
      console.log('INTEL|(not cached — run: node scripts/enrich-ip.js ' + ip + ')');
    }

    const logs = await ActivityLog.find({ ipAddress: ip })
      .sort({ createdAt: -1 })
      .limit(20)
      .select('action actorType ipAddress userAgent details createdAt')
      .lean();
    console.log(`LOGS (${logs.length} shown, max 20):`);
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
