#!/usr/bin/env node
require('dotenv').config();
const connectDB = require('../config/database');
const PotentialProfessional = require('../models/PotentialProfessional');

const LIMIT = Math.max(1, parseInt(process.argv[2] || '20', 10));

function sourceHost(sourceUrl = '') {
  try {
    return new URL(sourceUrl).hostname.replace(/^www\./, '') || '—';
  } catch {
    return String(sourceUrl || '—').slice(0, 40) || '—';
  }
}

function shuffle(arr) {
  const copy = [...arr];
  for (let i = copy.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

async function main() {
  await connectDB();

  const pending = await PotentialProfessional.find({
    status: { $in: ['pending', null] },
    phone: { $exists: true, $nin: ['', null] }
  })
    .select('alias phone sourceUrl status createdAt')
    .lean();

  const pool = pending.filter((l) => String(l.phone).replace(/\D/g, '').length >= 10);
  const pick = shuffle(pool).slice(0, LIMIT);

  pick.forEach((lead, i) => {
    const phone = String(lead.phone).replace(/\D/g, '');
    console.log([
      i + 1,
      lead.alias || '—',
      `+${phone}`,
      sourceHost(lead.sourceUrl)
    ].join('|'));
  });

  console.error(`pending_total=${pool.length}`);
  process.exit(0);
}

main().catch((err) => {
  console.error('Failed:', err.message);
  process.exit(1);
});
