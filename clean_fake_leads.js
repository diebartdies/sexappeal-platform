require('dotenv').config();
const connectDB = require('./config/database');
const PotentialProfessional = require('./models/PotentialProfessional');

async function cleanFakeLeads() {
    await connectDB();
    
    const leads = await PotentialProfessional.find({});
    let deletedCount = 0;
    
    for (const lead of leads) {
        const cleanPhone = lead.phone.replace(/\D/g, '');
        
        // If the number has 6 or more of the SAME digit consecutively, it's a fake number
        if (/(.)\1{5,}/.test(cleanPhone)) {
            console.log(`🗑️ Deleting fake number: ${lead.phone}`);
            await PotentialProfessional.findByIdAndDelete(lead._id);
            deletedCount++;
        }
    }
    
    console.log(`\n✅ Successfully deleted ${deletedCount} fake numbers from the database.`);
    process.exit(0);
}

cleanFakeLeads();