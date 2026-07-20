require('dotenv').config({path:'D:\\SexAppeal-platform\\.env'});
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const connectDB = require('../config/database');

async function main() {
  await connectDB();
  const salt = await bcrypt.genSalt(10);
  const hash = await bcrypt.hash('admin123', salt);
  const r = await mongoose.connection.db.collection('users').updateOne(
    { email: 'admin@drsrv.net.ar' },
    { 
      $setOnInsert: { 
        email: 'admin@drsrv.net.ar',
        password: hash,
        role: 'admin',
        isEmailVerified: true,
        verificationStatus: 'approved',
        isVerified: true,
        createdAt: new Date()
      }
    },
    { upsert: true }
  );
  console.log('Upserted:', r.upsertedCount, 'Modified:', r.modifiedCount);
  await mongoose.disconnect();
}
main().catch(e => console.error(e));