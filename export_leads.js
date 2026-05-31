require('dotenv').config();
const fs = require('fs');
const connectDB = require('./config/database');
const PotentialProfessional = require('./models/PotentialProfessional');
const ArgNumGeo = require('./models/ArgNumGeo');

async function exportList() {
    await connectDB();
    const leads = await PotentialProfessional.find({});
    const geoData = await ArgNumGeo.find({});
    
    // Create a lookup map for the indicativos
    const geoMap = {};
    geoData.forEach(geo => {
        if (geo.indicativo) {
            geoMap[geo.indicativo.trim()] = geo.localidad.trim();
        }
    });
    
    let csvContent = "Phone,Alias,Source URL,Status,Province,City\n";
    leads.forEach(lead => {
        const cleanPhone = lead.phone.replace(/\D/g, '');
        let phoneStr = cleanPhone;
        
        // Remove country code and mobile prefix to get the national number
        if (phoneStr.startsWith('549') && phoneStr.length >= 13) phoneStr = phoneStr.slice(3);
        else if (phoneStr.startsWith('54') && phoneStr.length >= 12) phoneStr = phoneStr.slice(2);
        
        if (phoneStr.startsWith('0') && phoneStr.length >= 11) phoneStr = phoneStr.slice(1);

        // Strip the '15' mobile prefix if it's included after the area code
        if (phoneStr.length === 12) {
            if (phoneStr.startsWith('1115')) phoneStr = '11' + phoneStr.slice(4);
            else if (/^[23]\d{2}15/.test(phoneStr)) phoneStr = phoneStr.slice(0, 3) + phoneStr.slice(5);
            else if (/^[23]\d{3}15/.test(phoneStr)) phoneStr = phoneStr.slice(0, 4) + phoneStr.slice(6);
        }

        let province = 'Unknown';
        let city = 'Unknown';

        // Check for 4-digit, 3-digit, or 2-digit indicativos
        const prefix4 = phoneStr.substring(0, 4);
        const prefix3 = phoneStr.substring(0, 3);
        const prefix2 = phoneStr.substring(0, 2);

        const indicativo = geoMap[prefix4] ? prefix4 : (geoMap[prefix3] ? prefix3 : (geoMap[prefix2] ? prefix2 : null));

        if (indicativo) {
            const localidad = geoMap[indicativo];
            // Example format: "MERLO (PROV.  BUENOS AIRES)"
            const match = localidad.match(/(.*?)\s*\((.*?)\)/);
            if (match) {
                city = match[1].trim();
                province = match[2].replace(/PROV\.\s*/i, '').trim();
            } else {
                city = province = localidad.trim();
            }
        }
        const safeAlias = (lead.alias || '').replace(/[\r\n\t]+/g, ' ').replace(/\s+/g, ' ').replace(/"/g, '""').trim();
        csvContent += `${cleanPhone},"${safeAlias}",${lead.sourceUrl},${lead.status},"${province}","${city}"\n`;
  });
    
    fs.writeFileSync('scraped_leads.csv', csvContent);
    
    console.log(`\n✅ Successfully exported ${leads.length} leads to 'scraped_leads.csv'`);
    process.exit(0);
}

exportList();