require('dotenv').config();
const connectDB = require('../config/database');
const User = require('../models/User');
const ActivityLog = require('../models/ActivityLog');
const Connection = require('../models/Connection');
const ConnectionRequest = require('../models/ConnectionRequest');
const Review = require('../models/Review');
const Statistic = require('../models/Statistic');
const Specialty = require('../models/Specialty');
const Professional = require('../models/Professional');

const USER_DEPENDENT_COLLECTIONS = [
  { name: 'ActivityLog', model: ActivityLog },
  { name: 'Connection', model: Connection },
  { name: 'ConnectionRequest', model: ConnectionRequest },
  { name: 'Review', model: Review },
  { name: 'Statistic', model: Statistic },
  { name: 'Specialty', model: Specialty },
  { name: 'Professional (legacy)', model: Professional }
];

const NON_ADMIN_USER_FILTER = { role: { $ne: 'admin' } };

async function countAll() {
  const counts = {};
  for (const { name, model } of USER_DEPENDENT_COLLECTIONS) {
    counts[name] = await model.countDocuments();
  }
  counts['User (non-admin)'] = await User.countDocuments(NON_ADMIN_USER_FILTER);
  counts['User (admin, kept)'] = await User.countDocuments({ role: 'admin' });
  return counts;
}

async function cleanUsers({ dryRun = false } = {}) {
  await connectDB();

  const before = await countAll();
  const totalDependent = USER_DEPENDENT_COLLECTIONS.reduce((sum, { name }) => sum + before[name], 0);
  const nonAdminUsers = before['User (non-admin)'];

  console.log('--- User cleanup (admin accounts preserved) ---');
  console.log('Documents to remove:');
  for (const { name } of USER_DEPENDENT_COLLECTIONS) {
    console.log(`  ${name}: ${before[name]}`);
  }
  console.log(`  User (non-admin): ${nonAdminUsers}`);
  console.log(`  User (admin, kept): ${before['User (admin, kept)']}`);

  if (nonAdminUsers === 0 && totalDependent === 0) {
    console.log('\nNothing to clean — no non-admin users or dependent data found.');
    if (before['User (admin, kept)'] > 0) {
      console.log(`Admin account(s) unchanged (${before['User (admin, kept)']}).`);
    }
    process.exit(0);
  }

  if (dryRun) {
    console.log('\nDry run only — no documents were deleted.');
    console.log('Run with --confirm to delete non-admin users and dependencies.');
    process.exit(0);
  }

  for (const { name, model } of USER_DEPENDENT_COLLECTIONS) {
    const result = await model.deleteMany({});
    console.log(`Deleted ${result.deletedCount} from ${name}`);
  }

  const userResult = await User.deleteMany(NON_ADMIN_USER_FILTER);
  console.log(`Deleted ${userResult.deletedCount} non-admin User document(s)`);

  const adminCount = await User.countDocuments({ role: 'admin' });
  console.log(`\n✅ Cleanup complete. ${adminCount} admin account(s) preserved.`);
  if (adminCount === 0) {
    console.log('No admin user found — create one or restore from backup, then run reset_admin_password.js if needed.');
  }
  process.exit(0);
}

const args = process.argv.slice(2);
const dryRun = args.includes('--dry-run');
const confirmed = args.includes('--confirm');

if (!dryRun && !confirmed) {
  console.error('Refusing to delete without --confirm (use --dry-run to preview counts).');
  console.error('Example: node scripts/clean-users.js --confirm');
  process.exit(1);
}

if (process.env.NODE_ENV === 'production' && confirmed) {
  console.error('Refusing to run user cleanup with NODE_ENV=production.');
  console.error('Unset NODE_ENV or run on a non-production database only.');
  process.exit(1);
}

cleanUsers({ dryRun }).catch((err) => {
  console.error('User cleanup failed:', err);
  process.exit(1);
});
