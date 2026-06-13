require('dotenv').config();
const mongoose = require('mongoose');
const connectDB = require('./config/database');
const User = require('./models/User');
const { filePathToDataUri, isDataUri, isUploadPath } = require('./utils/photoUtils');

/**
 * Migrate legacy /uploads/photos/* paths into MongoDB as base64 data URIs.
 * Run once after deploy: node migrate_photos.js
 */
async function migratePhotosToDatabase() {
    await connectDB();
    console.log('--- Migrating file-path photos to MongoDB (base64) ---');

    const professionals = await User.find({ role: 'professional' });
    let updatedCount = 0;
    let convertedPhotos = 0;

    for (const prof of professionals) {
        if (!prof.professionalProfile || !prof.professionalProfile.photos) continue;

        let needsSave = false;
        const newPhotos = [];

        for (const photoData of prof.professionalProfile.photos) {
            if (isDataUri(photoData)) {
                newPhotos.push(photoData);
                continue;
            }

            if (isUploadPath(photoData)) {
                const dataUri = filePathToDataUri(photoData);
                if (dataUri) {
                    newPhotos.push(dataUri);
                    needsSave = true;
                    convertedPhotos++;
                    console.log(`Converted ${prof.email}: ${photoData} -> base64 in DB`);
                    continue;
                }
                console.warn(`Removing broken file reference for ${prof.email}: ${photoData}`);
                needsSave = true;
                continue;
            }

            newPhotos.push(photoData);
        }

        if (needsSave) {
            prof.professionalProfile.photos = newPhotos;
            await prof.save();
            updatedCount++;
        }
    }

    console.log(`\nMigration complete. Professionals updated: ${updatedCount} | Photos converted: ${convertedPhotos}`);
    process.exit(0);
}

migratePhotosToDatabase().catch((err) => {
    console.error(err);
    process.exit(1);
});
