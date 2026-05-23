const connectDB = require('./config/database');
const User = require('./models/User');
const Province = require('./models/Province');
const City = require('./models/City');
const Neighborhood = require('./models/Neighborhood');
const fs = require('fs');
const path = require('path');

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

const seedData = async () => {
    try {
        await connectDB();
        
        console.log('Clearing old professionals and test admin...');
        await User.deleteMany({ $or: [{ role: 'professional' }, { email: 'admin@drsrv.net.ar' }] });
        
        console.log('Clearing old provinces...');
        await Province.deleteMany();

        console.log('Clearing old cities...');
        await City.deleteMany();

        console.log('Clearing old neighborhoods...');
        await Neighborhood.deleteMany();

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
        await User.create({
            email: 'pro1@example.com',
            password: 'password123',
            role: 'professional',
            verificationStatus: 'approved',
            isVerified: true,
            isEmailVerified: true,
            professionalProfile: {
                alias: 'Scarlett',
                quality: 'Gold',
                bio: 'A sophisticated companion for your most elegant evenings.',
                location: { province: 'Buenos Aires', city: 'CABA', neighborhood: 'Palermo' },
                measurements: '90-60-90',
                height: '170cm',
                services: ['Massage', 'love alchemy'],
                photos: [
                    'https://images.unsplash.com/photo-1524504388940-b1c1722653e1?q=80&w=1887&auto=format&fit=crop'
                ]
            }
        });
        
        await User.create({
            email: 'pro2@example.com',
            password: 'password123',
            role: 'professional',
            verificationStatus: 'approved',
            isVerified: true,
            isEmailVerified: true,
            professionalProfile: {
                alias: 'Isabella',
                quality: 'Standard',
                bio: 'Passionate and fiery, perfect for a spontaneous getaway.',
                location: { province: 'Buenos Aires', city: 'CABA', neighborhood: 'Recoleta' },
                measurements: '95-65-95',
                height: '165cm',
                services: ['Virtual Connection', 'Fantasies'],
                photos: [
                    'https://images.unsplash.com/photo-1517841905240-472988babdf9?q=80&w=1887&auto=format&fit=crop'
                ]
            }
        });
        
        await User.create({
            email: 'pro3@example.com',
            password: 'password123',
            role: 'professional',
            verificationStatus: 'approved',
            isVerified: true,
            isEmailVerified: true,
            professionalProfile: {
                alias: 'Chloe',
                quality: 'Premium',
                bio: 'An adventurous spirit with a love for art and culture. Ready to explore the city\'s hidden gems with you.',
                location: { province: 'Buenos Aires', city: 'CABA', neighborhood: 'San Telmo' },
                measurements: '88-62-92',
                height: '168cm',
                services: ['Massage', 'Virtual Connection', 'Fantasies', 'love alchemy'],
                whatsappNumber: '5491112345678',
                photos: [
                    'https://images.unsplash.com/photo-1580489944761-15a19d654956?q=80&w=1961&auto=format&fit=crop',
                    'https://images.unsplash.com/photo-1611601322175-28e659d4d484?q=80&w=1887&auto=format&fit=crop',
                    'https://images.unsplash.com/photo-1542206395-9feb3edaa68d?q=80&w=1964&auto=format&fit=crop',
                    'https://images.unsplash.com/photo-1604004555489-723a93d6ce74?q=80&w=1887&auto=format&fit=crop',
                    'https://images.unsplash.com/photo-1524504388940-b1c1722653e1?q=80&w=1887&auto=format&fit=crop',
                    'https://images.unsplash.com/photo-1589466725882-6cf1b8957b37?q=80&w=1887&auto=format&fit=crop'
                ]
            }
        });

        await User.create({
            email: 'pro4_test@example.com',
            password: 'password123',
            role: 'professional',
            verificationStatus: 'approved',
            isVerified: true,
            isEmailVerified: true,
            professionalProfile: {
                alias: 'Test Pro',
                quality: 'Standard',
                bio: 'A profile for testing categories like Massage and Wellness.',
                location: { province: 'Buenos Aires', city: 'CABA', neighborhood: 'Palermo' },
                measurements: '90-60-90',
                height: '175cm',
                services: ['Massage', 'Virtual Connection', 'love alchemy'],
                whatsappNumber: '5491122334455',
                photos: [
                    'https://images.unsplash.com/photo-1515378791036-0648a3ef77b2?q=80&w=2070&auto=format&fit=crop',
                    'https://images.unsplash.com/photo-1554151228-14d9def656e4?q=80&w=1886&auto=format&fit=crop'
                ]
            }
        });

        // Seed an Admin user for the dashboard
        await User.create({
            email: 'admin@drsrv.net.ar',
            password: 'adminpassword123',
            role: 'admin',
            verificationStatus: 'approved',
            isVerified: true,
            isEmailVerified: true
        });

        console.log('✅ Four professionals loaded successfully! You can now check the discovery feed.');
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