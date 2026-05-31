require('dotenv').config();
const connectDB = require('./config/database');
const User = require('./models/User');

const adminEmail = 'admin@drsrv.net.ar';
const newPassword = '123456'; // Must be at least 6 characters

async function resetAdminPassword() {
  await connectDB();

  console.log(`Attempting to reset password for: ${adminEmail}`);

  // We need to select the password field as it's excluded by default
  const user = await User.findOne({ email: adminEmail }).select('+password');

  if (!user) {
    console.error('❌ Admin user not found.');
    process.exit(1);
  }

  console.log('Admin user found. Setting new password...');

  user.password = newPassword;
  await user.save(); // The pre-save hook in User.js will automatically hash the new password

  console.log(`✅ Password for ${adminEmail} has been successfully reset to '${newPassword}'.`);
  process.exit(0);
}

resetAdminPassword().catch(err => {
  console.error('An error occurred:', err);
  process.exit(1);
});