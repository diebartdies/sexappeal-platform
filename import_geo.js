require('dotenv').config();
const fs = require('fs');
const connectDB = require('./config/database');
const ArgNumGeo = require('./models/ArgNumGeo');

async function importGeoData() {
    await connectDB();
    
    console.log('Reading geographic CSV file...');
    const filePath = 'd:\\Numeración Geográfica Nuevo.csv';
    
    if (!fs.existsSync(filePath)) {
        console.error(`❌ File not found at ${filePath}`);
        process.exit(1);
    }

    const data = fs.readFileSync(filePath, 'utf8');
    const lines = data.split('\n');
    
    const docs = [];
    
    // Skip header (index 0)
    for (let i = 1; i < lines.length; i++) {
        const line = lines[i].trim();
        if (!line) continue;
        
        const [operador, servicio, modalidad, localidad, indicativo, bloque, resolucion, fecha] = line.split(';');
        
        docs.push({ operador, servicio, modalidad, localidad, indicativo, bloque, resolucion, fecha });
    }

    console.log(`Parsed ${docs.length} records. Clearing old data and inserting...`);
    
    try {
        await ArgNumGeo.deleteMany({}); // Clear existing data to avoid duplicates
        
        await ArgNumGeo.insertMany(docs);
        console.log(`\n✅ Successfully imported ${docs.length} geographic records into the 'Arg_num_geo' table!`);
    } catch (error) {
        console.error('❌ Error importing data:', error);
    }
    
    process.exit(0);
}

importGeoData();