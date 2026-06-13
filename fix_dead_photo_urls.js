require('dotenv').config();
const connectDB = require('./config/database');
const User = require('./models/User');
const { replaceDeadExternalUrl, isExternalUrl } = require('./utils/photoUtils');

/**
 * Rewrite dead Unsplash URLs stored in MongoDB (permanent fix).
 * Run once: node fix_dead_photo_urls.js
 */
async function fixDeadPhotoUrls() {
  await connectDB();
  console.log('--- Replacing dead Unsplash URLs in MongoDB ---');

  const professionals = await User.find({ role: 'professional' });
  let updatedPros = 0;
  let replacedPhotos = 0;

  for (const prof of professionals) {
    const photos = prof.professionalProfile?.photos;
    if (!Array.isArray(photos) || photos.length === 0) continue;

    let changed = false;
    const newPhotos = photos.map((photo) => {
      if (!photo || !isExternalUrl(photo)) return photo;
      const fixed = replaceDeadExternalUrl(photo);
      if (fixed !== photo) {
        changed = true;
        replacedPhotos++;
        console.log(`  ${prof.professionalProfile?.alias || prof.email}: replaced dead link`);
      }
      return fixed;
    });

    if (changed) {
      prof.professionalProfile.photos = newPhotos;
      await prof.save();
      updatedPros++;
    }
  }

  console.log(`\nDone. Professionals updated: ${updatedPros} | Photos replaced: ${replacedPhotos}`);
  process.exit(0);
}

fixDeadPhotoUrls().catch((err) => {
  console.error(err);
  process.exit(1);
});
