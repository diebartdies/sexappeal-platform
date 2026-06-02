require('dotenv').config();
const connectDB = require('./config/database');
const User = require('./models/User');

async function assignElite() {
    // Connect to the database
    await connectDB();
    
    console.log('🔍 Finding 4 random Standard professionals...');
    
    // Find 4 random professionals who currently have the "Standard" quality
    const standardProfs = await User.aggregate([
        { $match: { role: 'professional', 'professionalProfile.quality': 'Standard' } },
        { $sample: { size: 4 } }
    ]);

    if (standardProfs.length === 0) {
        console.log('❌ No Standard professionals found to upgrade.');
        process.exit(0);
    }

    // Extract their unique IDs
    const idsToUpgrade = standardProfs.map(p => p._id);

    // Update their category to "Elite"
    const result = await User.updateMany(
        { _id: { $in: idsToUpgrade } },
        { $set: { 'professionalProfile.quality': 'Elite' } }
    );

    console.log(`✅ Successfully upgraded ${result.modifiedCount} professionals to the Elite category!`);
    process.exit(0);
}

assignElite();