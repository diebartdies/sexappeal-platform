require('dotenv').config();
const connectDB = require('./config/database');
const User = require('./models/User');

const adminEmail = process.env.ADMIN_RESET_EMAIL || 'admin@drsrv.net.ar';
const newPassword = process.env.ADMIN_RESET_PASSWORD || process.argv[2];

async function resetAdminPassword() {
  if (!newPassword || String(newPassword).length < 6) {
    console.error('Usage: ADMIN_RESET_PASSWORD=yourpass node reset_admin_password.js');
    console.error('   or: node reset_admin_password.js yourpass');
    process.exit(1);
  }

  await connectDB();

  console.log(`Attempting to reset password for: ${adminEmail}`);

  const user = await User.findOne({ email: adminEmail }).select('+password');

  if (!user) {
    console.error('Admin user not found.');
    process.exit(1);
  }

  console.log('Admin user found. Setting new password...');

  user.password = newPassword;
  await user.save();

  console.log(`Password for ${adminEmail} has been reset.`);
  process.exit(0);
}

resetAdminPassword().catch((err) => {
  console.error('An error occurred:', err);
  process.exit(1);
});
