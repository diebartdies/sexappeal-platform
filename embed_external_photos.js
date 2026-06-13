require('dotenv').config();
const connectDB = require('./config/database');
const User = require('./models/User');
const {
  isDataUri,
  isExternalUrl,
  isUploadPath,
  filePathToDataUri,
  replaceDeadExternalUrl,
  WORKING_SAMPLE_PHOTO_URLS
} = require('./utils/photoUtils');

async function urlToDataUri(url) {
  const response = await fetch(url);
  if (!response.ok) throw new Error(`HTTP ${response.status}`);
  const buffer = Buffer.from(await response.arrayBuffer());
  const contentType = response.headers.get('content-type') || 'image/jpeg';
  return `data:${contentType.split(';')[0]};base64,${buffer.toString('base64')}`;
}

/**
 * Embed external http(s) photo URLs and legacy /uploads paths as base64 in MongoDB.
 * Run once: node embed_external_photos.js
 */
async function embedExternalPhotos() {
  await connectDB();
  console.log('--- Embedding external photos into MongoDB (base64) ---');

  const professionals = await User.find({ role: 'professional' });
  let updatedCount = 0;
  let convertedCount = 0;

  for (const prof of professionals) {
    if (!prof.professionalProfile?.photos?.length) continue;

    let needsSave = false;
    const newPhotos = [];

    for (const photo of prof.professionalProfile.photos) {
      if (!photo || typeof photo !== 'string') continue;

      if (isDataUri(photo)) {
        newPhotos.push(photo);
        continue;
      }

      if (isUploadPath(photo)) {
        const dataUri = filePathToDataUri(photo);
        if (dataUri) {
          newPhotos.push(dataUri);
          needsSave = true;
          convertedCount++;
        }
        continue;
      }

      if (isExternalUrl(photo)) {
        const candidates = [replaceDeadExternalUrl(photo), ...WORKING_SAMPLE_PHOTO_URLS];
        let embedded = false;
        for (const candidate of candidates) {
          try {
            const dataUri = await urlToDataUri(candidate);
            newPhotos.push(dataUri);
            needsSave = true;
            convertedCount++;
            embedded = true;
            if (candidate !== photo) {
              console.log(`Replaced dead URL for ${prof.professionalProfile?.alias || prof.email}`);
            }
            break;
          } catch (err) {
            continue;
          }
        }
        if (!embedded) {
          console.warn(`All download attempts failed for ${prof.professionalProfile?.alias || prof.email}`);
        }
        continue;
      }

      newPhotos.push(photo);
    }

    if (needsSave) {
      prof.professionalProfile.photos = newPhotos;
      await prof.save();
      updatedCount++;
    }
  }

  console.log(`\nDone. Professionals updated: ${updatedCount} | Photos embedded: ${convertedCount}`);
  process.exit(0);
}

embedExternalPhotos().catch((err) => {
  console.error(err);
  process.exit(1);
});
