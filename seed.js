const connectDB = require('./config/database');
const User = require('./models/User');
const Province = require('./models/Province');
const City = require('./models/City');
const Neighborhood = require('./models/Neighborhood');
const ActivityLog = require('./models/ActivityLog');
const PotentialProfessional = require('./models/PotentialProfessional');
const fs = require('fs');
const path = require('path');
const sharp = require('sharp');

const approveAllPending = async () => {
    try {
        await connectDB();
        
        console.log('Finding and approving all pending professionals...');
        const result = await User.updateMany(
            { role: 'professional', verificationStatus: 'pending' },
            { $set: { isVerified: true, verificationStatus: 'approved' } }
        );

        if (result.modifiedCount > 0) {
            console.log(`✅ Successfully approved ${result.modifiedCount} pending professionals.`);
        } else {
            console.log('No pending professionals were found to approve.');
        }
        
        process.exit();
    } catch (err) {
        console.error('Error approving professionals:', err);
        process.exit(1);
    }
};

// --- Node.js Image Compression Algorithm ---
async function getCompressedBase64FromUrl(url) {
    try {
        const response = await fetch(url);
        const arrayBuffer = await response.arrayBuffer();
        const buffer = Buffer.from(arrayBuffer);
        const compressedBuffer = await sharp(buffer)
            .resize({ width: 1080, withoutEnlargement: true })
            .jpeg({ quality: 75 })
            .toBuffer();
        return `data:image/jpeg;base64,${compressedBuffer.toString('base64')}`;
    } catch (err) {
        console.error(`Error compressing ${url}:`, err.message);
        return url; // Fallback to URL if compression fails
    }
}

const seedData = async () => {
    try {
        await connectDB();
        
        console.log('Clearing old professionals and test admin...');
        await User.deleteMany({ $or: [{ role: 'professional' }, { email: 'admin@drsrv.net.ar' }] });
        
        console.log('Clearing old activity logs...');
        await ActivityLog.deleteMany();

        console.log('Clearing old provinces...');
        await Province.deleteMany();

        console.log('Clearing old cities...');
        await City.deleteMany();

        console.log('Clearing old neighborhoods...');
        await Neighborhood.deleteMany();

        console.log('Clearing old potential professionals (leads)...');
        await PotentialProfessional.deleteMany();

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

            // Fetch newly created provinces to get their ObjectIds
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

                        // Map text file province names to our DB names
                        if (pRaw.includes('Buenos Aires')) currentProvinceName = 'Buenos Aires (Province)';
                        else if (pRaw.includes('Tierra del Fuego')) currentProvinceName = 'Tierra del Fuego, Antártida e Islas del Atlántico Sur';
                        else currentProvinceName = pRaw.replace(' Province', '').split(',')[0].trim();
                    }
                } else if (line.startsWith('* [[')) {
                    const match = line.match(/\*\s*\[\[(.*?)\]\]/);
                    if (match && currentProvinceName) {
                        let cRaw = match[1];
                        // Handle wiki pipe links and commas
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

        console.log('Seeding new verified professionals...');
        const photoSet = [
            'https://images.unsplash.com/photo-1580489944761-15a19d654956?q=80&w=1961&auto=format&fit=crop',
            'https://images.unsplash.com/photo-1611601322175-28e659d4d484?q=80&w=1887&auto=format&fit=crop',
            'https://images.unsplash.com/photo-1542206395-9feb3edaa68d?q=80&w=1964&auto=format&fit=crop',
            'https://images.unsplash.com/photo-1604004555489-723a93d6ce74?q=80&w=1887&auto=format&fit=crop',
            'https://images.unsplash.com/photo-1524504388940-b1c1722653e1?q=80&w=1887&auto=format&fit=crop',
            'https://images.unsplash.com/photo-1589466725882-6cf1b8957b37?q=80&w=1887&auto=format&fit=crop'
        ];

        console.log('Downloading and compressing sample photos (this may take a moment)...');
        const compressedPhotoSet = [];
        for (const url of photoSet) {
            const base64 = await getCompressedBase64FromUrl(url);
            compressedPhotoSet.push(base64);
        }

        const locationPool = [
            // CABA
            { province: 'CABA', neighborhood: 'Palermo' },
            { province: 'CABA', neighborhood: 'Recoleta' },
            { province: 'CABA', neighborhood: 'Belgrano' },
            { province: 'CABA', neighborhood: 'Puerto Madero' },
            { province: 'CABA', neighborhood: 'San Telmo' },
            { province: 'CABA', neighborhood: 'Caballito' },
            { province: 'CABA', neighborhood: 'Villa Urquiza' },
            { province: 'CABA', neighborhood: 'Colegiales' },
            
            // Buenos Aires (Province)
            { province: 'Buenos Aires (Province)', city: 'Mar del Plata', neighborhood: 'Centro' },
            { province: 'Buenos Aires (Province)', city: 'Mar del Plata', neighborhood: 'Güemes' },
            { province: 'Buenos Aires (Province)', city: 'La Plata', neighborhood: 'Tolosa' },
            { province: 'Buenos Aires (Province)', city: 'La Plata', neighborhood: 'Casco Urbano' },
            { province: 'Buenos Aires (Province)', city: 'Tigre', neighborhood: 'Nordelta' },
            { province: 'Buenos Aires (Province)', city: 'Quilmes', neighborhood: 'Centro' },
            { province: 'Buenos Aires (Province)', city: 'San Isidro', neighborhood: 'Acassuso' },
            { province: 'Buenos Aires (Province)', city: 'Vicente López', neighborhood: 'Olivos' },
            { province: 'Buenos Aires (Province)', city: 'Lomas de Zamora', neighborhood: 'Las Lomitas' },
            
            // Santa Fe
            { province: 'Santa Fe', city: 'Rosario', neighborhood: 'Pichincha' },
            { province: 'Santa Fe', city: 'Rosario', neighborhood: 'Centro' },
            { province: 'Santa Fe', city: 'Rosario', neighborhood: 'Alberdi' },
            { province: 'Santa Fe', city: 'Santa Fe', neighborhood: 'Centro' },
            
            // Mendoza
            { province: 'Mendoza', city: 'Mendoza', neighborhood: 'Centro' },
            { province: 'Mendoza', city: 'Godoy Cruz', neighborhood: 'Centro' },
            { province: 'Mendoza', city: 'Luján de Cuyo', neighborhood: 'Chacras de Coria' }
        ];

        const testPros = [];
        for (let i = 1; i <= 100; i++) {
            const loc = locationPool[i % locationPool.length];
            testPros.push({
                email: `pro${i}@example.com`,
                password: 'password123',
                role: 'professional',
                verificationStatus: 'approved',
                isVerified: true,
                isEmailVerified: true,
                professionalProfile: {
                    alias: `Test Pro ${i}`,
                    quality: i % 5 === 0 ? 'Elite' : (i % 4 === 0 ? 'Premium' : (i % 3 === 0 ? 'Gold' : (i % 2 === 0 ? 'Silver' : 'Standard'))),
                    bio: `A profile for testing professional number ${i}.`,
                    location: loc,
                    measurements: '90-60-90',
                    height: '175cm',
                    services: i % 2 === 0 ? ['Massage', 'Virtual Connection'] : ['love alchemy', 'Fantasies'],
                    whatsappNumber: `54911223344${(i % 100).toString().padStart(2, '0')}`,
                    photos: compressedPhotoSet
                }
            });
        }
        await User.create(testPros);

        // Seed an Admin user for the dashboard
        await User.create({
            email: 'admin@drsrv.net.ar',
            password: 'adminpassword123',
            role: 'admin',
            verificationStatus: 'approved',
            isVerified: true,
            isEmailVerified: true
        });

        console.log('Seeding dummy Traces (Activity Logs)...');
        const profs = await User.find({ role: 'professional' }).limit(2);
        if (profs.length >= 2) {
            await ActivityLog.create([
                {
                    action: 'guest_browsing',
                    isGuest: true,
                    ipAddress: '190.55.123.45',
                    userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/114.0',
                    details: { path: '/api/v1/professionals', query: { quality: 'Premium' } }
                },
                {
                    action: 'guest_browsing',
                    isGuest: true,
                    ipAddress: '181.12.99.102',
                    userAgent: 'iPhone; CPU iPhone OS 16_0 like Mac OS X',
                    details: { path: `/api/v1/professionals/${profs[0].professionalProfile.alias}`, query: {} }
                }
            ]);

            await ActivityLog.create([
                { professional: profs[0]._id, action: 'login', ipAddress: '10.0.0.5', userAgent: 'Macintosh; Intel Mac OS X 10_15_7' },
                { professional: profs[1]._id, action: 'update_profile', ipAddress: '10.0.0.6', userAgent: 'Windows NT 10.0; Win64; x64' }
            ]);
        }

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

        console.log('✅ 100 professionals and dummy traces loaded successfully!');
        process.exit();
    } catch (err) {
        console.error('Error seeding data:', err);
        process.exit(1);
    }
};

if (process.argv[2] === '--approve') {
    console.log('Running approval script...');
    approveAllPending();
} else {
    console.log('Running default seeder to reset professionals...');
    seedData();
}