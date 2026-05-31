require('dotenv').config();
const connectDB = require('./config/database');
const PotentialProfessional = require('./models/PotentialProfessional');

async function cleanDatabase() {
    await connectDB();
    
    console.log('--- Starting Database Cleanup ---');
    
    const leads = await PotentialProfessional.find({});
    let deletedCount = 0;
    let clearedAliasCount = 0;

    for (const lead of leads) {
        let cleanPhone = (lead.phone || '').replace(/\D/g, '');
        
        // Strip country code to validate the national number
        if (cleanPhone.startsWith('549') && cleanPhone.length >= 13) cleanPhone = cleanPhone.slice(3);
        else if (cleanPhone.startsWith('54') && cleanPhone.length >= 12) cleanPhone = cleanPhone.slice(2);
        
        if (cleanPhone.startsWith('0') && cleanPhone.length >= 11) cleanPhone = cleanPhone.slice(1);

        // Strip the '15' mobile prefix if it's included after the area code
        if (cleanPhone.length === 12) {
            if (cleanPhone.startsWith('1115')) cleanPhone = '11' + cleanPhone.slice(4);
            else if (/^[23]\d{2}15/.test(cleanPhone)) cleanPhone = cleanPhone.slice(0, 3) + cleanPhone.slice(5);
            else if (/^[23]\d{3}15/.test(cleanPhone)) cleanPhone = cleanPhone.slice(0, 4) + cleanPhone.slice(6);
        }

        const alias = (lead.alias || '').toLowerCase();
        const hasJunkAlias = alias.includes('ttyme') || alias.includes('beat') || alias.includes('lofi') || alias.includes('youtube') || alias.includes('rebord') || alias.includes('music') || alias.includes('author') || alias.includes('are you') || alias.includes('scam') || alias.includes('regulations');

        // Delete if national number is not exactly 10 digits, has 6+ repeating digits, or has a junk alias
        if (cleanPhone.length !== 10 || /(.)\1{5,}/.test(cleanPhone) || hasJunkAlias) {
            await PotentialProfessional.findByIdAndDelete(lead._id);
            console.log(`🗑️ Deleted junk lead: ${lead.phone} ${lead.alias ? `(${lead.alias})` : ''}`);
            deletedCount++;
        } else {
            // Clear the alias if it's a generic SEO term or website artifact, but keep the valid phone number
            const isSeoAlias = alias.includes('escort') || alias.includes('puta') || alias.includes('gemidos') || alias.includes('argxp') || alias.includes('baires') || alias.includes('damas de') || alias.includes('connections') || alias.includes('lima leonis') || alias.includes('dream girl');
            
            let needsSave = false;
            
            if (lead.phone !== cleanPhone) {
                lead.phone = cleanPhone;
                needsSave = true;
            }

            if (isSeoAlias && lead.alias !== '') {
                lead.alias = '';
                needsSave = true;
                clearedAliasCount++;
            }

            if (needsSave) {
                try {
                    await lead.save();
                    if (lead.alias === '') console.log(`🧹 Updated lead: ${lead.phone}`);
                } catch(e) {
                    // If duplicate key error occurs because the normalized 10-digit number already exists
                    if (e.code === 11000) {
                        await PotentialProfessional.findByIdAndDelete(lead._id);
                        deletedCount++;
                    }
                }
            }
        }
    }
    
    console.log(`\n✅ Successfully deleted ${deletedCount} bad leads and cleared ${clearedAliasCount} inaccurate aliases.`);
    process.exit(0);
}

cleanDatabase();