require('dotenv').config({ path: 'D:\\SexAppeal-platform\\.env' });
const path = require('path');
const fs = require('fs');
const sendEmail = require('../sendEmail');

const APK_PATH = 'D:\\FullMinent\\android\\app\\build\\outputs\\apk\\debug\\app-debug.apk';
const TO = 'carlonid@hotmail.com';

async function main() {
  if (!fs.existsSync(APK_PATH)) {
    console.error('APK not found at', APK_PATH);
    process.exit(1);
  }
  const sizeMB = (fs.statSync(APK_PATH).size / (1024 * 1024)).toFixed(1);
  console.log(`Sending APK (${sizeMB} MB) to ${TO} ...`);

  await sendEmail({
    email: TO,
    subject: 'KuraTe APK (app-debug)',
    message: 'Adjunto el APK de la app KuraTe para instalar en el teléfono.\n\n' +
      'Para instalar: abrí el archivo en el teléfono y habilitá "Instalar de orígenes desconocidos".\n' +
      'Nota: la app se conecta al servidor en http://192.168.1.8:8080 (misma WiFi).',
    attachments: [
      { filename: 'app-debug.apk', path: APK_PATH }
    ]
  });

  console.log('Sent.');
}

main().catch(e => { console.error('Failed:', e.message); process.exit(1); });
