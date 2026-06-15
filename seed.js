const connectDB = require('./config/database');
const Province = require('./models/Province');
const City = require('./models/City');
const Neighborhood = require('./models/Neighborhood');
const PotentialProfessional = require('./models/PotentialProfessional');
const fs = require('fs');
const path = require('path');

/**
 * Geography + optional lead seeding only.
 * User accounts are never created or deleted here — use real registrations or backup restore.
 */
const seedData = async () => {
  try {
    await connectDB();

    console.log('Seeding reference data only (provinces, cities, neighborhoods, optional leads).');
    console.log('User accounts are excluded from this process.');

    console.log('Clearing old provinces...');
  await Province.deleteMany();

  console.log('Clearing old cities...');
  await City.deleteMany();

  console.log('Clearing old neighborhoods...');
  await Neighborhood.deleteMany();

  if (process.argv.includes('--with-leads')) {
    console.log('Clearing old potential professionals (leads)...');
    await PotentialProfessional.deleteMany();
  }

  console.log('Seeding provinces...');
  const provincesList = [
    'Buenos Aires (Province)', 'Catamarca', 'Chaco', 'Chubut', 'Córdoba',
    'Corrientes', 'Entre Ríos', 'Formosa', 'Jujuy', 'La Pampa', 'La Rioja',
    'Mendoza', 'Misiones', 'Neuquén', 'Río Negro', 'Salta', 'San Juan',
    'San Luis', 'Santa Cruz', 'Santa Fe', 'Santiago del Estero',
    'Tierra del Fuego, Antártida e Islas del Atlántico Sur', 'Tucumán', 'CABA'
  ];

  await Province.insertMany(provincesList.map(name => ({ name, countryCode: '054' })));

  console.log('Parsing cities from text file...');
  const citiesFilePath = path.join(__dirname, 'cities by province.txt');
  if (fs.existsSync(citiesFilePath)) {
    const content = fs.readFileSync(citiesFilePath, 'utf8');
    const lines = content.split('\n');

    const dbProvinces = await Province.find();
    const provinceMap = {};
    dbProvinces.forEach(p => {
      provinceMap[p.name] = p._id;
    });

    let currentProvinceName = null;
    const cityDocs = [];

    for (let line of lines) {
      line = line.trim();
      if (line.startsWith('=== [[')) {
        const match = line.match(/===\s*\[\[(.*?)\]\]\s*===/);
        if (match) {
          let pRaw = match[1];
          if (pRaw.includes('|')) pRaw = pRaw.split('|')[1];

          if (pRaw.includes('Buenos Aires')) currentProvinceName = 'Buenos Aires (Province)';
          else if (pRaw.includes('Tierra del Fuego')) currentProvinceName = 'Tierra del Fuego, Antártida e Islas del Atlántico Sur';
          else currentProvinceName = pRaw.replace(' Province', '').split(',')[0].trim();
        }
      } else if (line.startsWith('* [[')) {
        const match = line.match(/\*\s*\[\[(.*?)\]\]/);
        if (match && currentProvinceName) {
          let cRaw = match[1];
          if (cRaw.includes('|')) cRaw = cRaw.split('|')[1];
          else if (cRaw.includes(',')) cRaw = cRaw.split(',')[0];

          cRaw = cRaw.trim();
          const provinceId = provinceMap[currentProvinceName];

          if (provinceId) cityDocs.push({ name: cRaw, province: provinceId });
        }
      }
    }

    console.log(`Seeding ${cityDocs.length} cities...`);
    await City.insertMany(cityDocs);
  } else {
    console.log('⚠️ cities by province.txt not found. Skipping cities seeding.');
  }

  console.log('Seeding CABA neighborhoods from file...');
  const cabaProvince = await Province.findOne({ name: 'CABA' });
  if (cabaProvince) {
    const neighborhoodsFilePath = path.join(__dirname, 'Barrios porteños.txt');
    if (fs.existsSync(neighborhoodsFilePath)) {
      const content = fs.readFileSync(neighborhoodsFilePath, 'utf8');
      const cabaNeighborhoods = content
        .split('\n')
        .map(line => line.trim())
        .filter(line => line.length > 0);

      console.log(`Seeding ${cabaNeighborhoods.length} CABA neighborhoods...`);
      await Neighborhood.insertMany(cabaNeighborhoods.map(name => ({ name, province: cabaProvince._id })));
    } else {
      console.log('⚠️ Barrios porteños.txt not found. Skipping neighborhoods seeding.');
    }
  }

  if (process.argv.includes('--with-leads')) {
    console.log('Seeding dummy potential professionals (scraped leads)...');
    const dummyLeads = [];
    for (let i = 1; i <= 25; i++) {
      dummyLeads.push({
        phone: `+54 9 11 4444-55${(i % 100).toString().padStart(2, '0')}`,
        sourceUrl: `https://example-escorts-directory.com/profile/${i}`,
        status: i % 3 === 0 ? 'contacted' : (i % 5 === 0 ? 'rejected' : 'pending')
      });
    }
    await PotentialProfessional.insertMany(dummyLeads);
  }

  console.log('✅ Reference data seeded (no User documents created).');
  process.exit(0);
  } catch (err) {
    console.error('Error seeding data:', err);
    process.exit(1);
  }
};

if (process.argv.includes('--approve')) {
  console.log('Moved: use node scripts/approve-pending-professionals.js');
  require('./scripts/approve-pending-professionals.js');
} else {
  seedData();
}
