/**
 * List unverified registrations (pending email verification).
 *
 * Usage:
 *   node scripts/list-pending-registrations.js
 *   node scripts/list-pending-registrations.js --expired
 *   node scripts/list-pending-registrations.js --active
 *   node scripts/list-pending-registrations.js --purge-expired --confirm
 */

require('dotenv').config();
const connectDB = require('../config/database');
const User = require('../models/User');
const { purgeExpiredUnverifiedUsers } = require('../utils/pendingRegistration');

const args = process.argv.slice(2);
const showExpired = args.includes('--expired');
const showActive = args.includes('--active');
const purgeExpired = args.includes('--purge-expired');
const confirm = args.includes('--confirm');
const now = new Date();

function formatRow(u) {
  const expire = u.emailVerificationCodeExpire;
  const expired = !expire || expire.getTime() <= now.getTime();
  const status = expired ? 'EXPIRED' : 'ACTIVE';
  const alias = u.professionalProfile?.alias || '—';
  const mode = u.registrationMode || '—';
  const expireLabel = expire ? expire.toISOString() : 'no code';
  return `${u.email} | role=${u.role} | mode=${mode} | alias=${alias} | ${status} | code_expires=${expireLabel}`;
}

async function main() {
  await connectDB();

  if (purgeExpired) {
    if (!confirm) {
      const count = await User.countDocuments({
        isEmailVerified: false,
        emailVerificationCodeExpire: { $lt: now }
      });
      console.log(`${count} expired unverified account(s). Re-run with --purge-expired --confirm to delete.`);
      process.exit(0);
    }
    const removed = await purgeExpiredUnverifiedUsers();
    console.log(`Purged ${removed} expired unverified account(s).`);
    process.exit(0);
  }

  const baseFilter = { isEmailVerified: false, role: { $ne: 'admin' } };
  let filter = baseFilter;

  if (showExpired && !showActive) {
    filter = { ...baseFilter, emailVerificationCodeExpire: { $lt: now } };
  } else if (showActive && !showExpired) {
    filter = { ...baseFilter, emailVerificationCodeExpire: { $gt: now } };
  }

  const users = await User.find(filter)
    .select('email role registrationMode isEmailVerified emailVerificationCodeExpire professionalProfile.alias createdAt')
    .sort({ createdAt: -1 });

  const expiredCount = await User.countDocuments({
    ...baseFilter,
    emailVerificationCodeExpire: { $lt: now }
  });
  const activeCount = await User.countDocuments({
    ...baseFilter,
    emailVerificationCodeExpire: { $gt: now }
  });
  const totalUnverified = await User.countDocuments(baseFilter);

  console.log('--- Pending email verification (not isEmailVerified) ---');
  console.log(`Total unverified (non-admin): ${totalUnverified}`);
  console.log(`  Active code (waiting for verify): ${activeCount}`);
  console.log(`  Expired / stale (should be purged): ${expiredCount}`);
  console.log('');

  if (!users.length) {
    console.log('No matching rows for current filter.');
    process.exit(0);
  }

  console.log(`Showing ${users.length} row(s):`);
  for (const u of users) {
    console.log(`  ${formatRow(u)}`);
  }

  if (expiredCount > 0) {
    console.log('\nTip: purge stale rows with: node scripts/list-pending-registrations.js --purge-expired --confirm');
  }

  process.exit(0);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
