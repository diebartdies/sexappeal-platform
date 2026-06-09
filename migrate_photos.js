require('dotenv').config();
const mongoose = require('mongoose');
const connectDB = require('./config/database');
const User = require('./models/User');
const fs = require('fs');
const path = require('path');

const uploadsDir = path.join(__dirname, 'public', 'uploads', 'photos');
if (!fs.existsSync(uploadsDir)) {
    fs.mkdirSync(uploadsDir, { recursive: true });
}

async function migratePhotos() {
    await connectDB();
    console.log('--- Starting Base64 to File Migration ---');
    
    const professionals = await User.find({ role: 'professional' });
    let updatedCount = 0;
    let convertedPhotos = 0;

    for (const prof of professionals) {
        if (!prof.professionalProfile || !prof.professionalProfile.photos) continue;

        let needsSave = false;
        const newPhotos = [];

        for (let i = 0; i < prof.professionalProfile.photos.length; i++) {
            const photoData = prof.professionalProfile.photos[i];
            
            if (photoData && photoData.startsWith('data:image/')) {
                try {
                    const matches = photoData.match(/^data:image\/([a-zA-Z0-9]+);base64,(.+)$/);
                    if (!matches || matches.length !== 3) { newPhotos.push(photoData); continue; }

                    const ext = matches[1] === 'jpeg' ? 'jpg' : matches[1];
                    const buffer = Buffer.from(matches[2], 'base64');
                    const filename = `migrated_${prof._id}_${i}_${Date.now()}.${ext}`;
                    
                    fs.writeFileSync(path.join(uploadsDir, filename), buffer);
                    newPhotos.push(`/uploads/photos/${filename}`);
                    
                    needsSave = true;
                    convertedPhotos++;
                    console.log(`✅ Converted photo for ${prof.email} -> /uploads/photos/${filename}`);
                } catch (err) {
                    console.error(`❌ Error converting photo for ${prof.email}:`, err.message);
                    newPhotos.push(photoData);
                }
            } else { newPhotos.push(photoData); }
        }
        if (needsSave) { prof.professionalProfile.photos = newPhotos; await prof.save(); updatedCount++; }
    }

    console.log(`\n🎉 Migration Complete! Professionals updated: ${updatedCount} | Photos converted: ${convertedPhotos}`);
    process.exit(0);
}

migratePhotos();