require('dotenv').config();
const connectDB = require('../config/database');
const ActivityLog = require('../models/ActivityLog');
const sendEmail = require('../sendEmail');

const ALIAS = 'Linda';
const PROFILE_EMAIL = 'rojasbelen291@gmail.com';

const RECIPIENT = process.argv[2] || process.env.SMTP_EMAIL;

function fmt(d) {
  return new Date(d).toLocaleString('es-AR', {
    timeZone: 'America/Argentina/Buenos_Aires',
    day: '2-digit', month: '2-digit', year: 'numeric',
    hour: '2-digit', minute: '2-digit'
  });
}

async function run() {
  await connectDB();

  const logs = await ActivityLog.find({
    action: 'guest_browsing',
    'details.path': new RegExp(ALIAS, 'i')
  }).sort({ createdAt: 1 }).lean();

  const views = logs.filter(l => !/\/whatsapp$/i.test(l.details && l.details.path || ''));
  const whatsapps = logs.filter(l => /\/whatsapp$/i.test(l.details && l.details.path || ''));

  const lines = [];
  lines.push(`Hola ${ALIAS},`);
  lines.push('');
  lines.push('Te compartimos el reporte de actividad de tu perfil en SexAppeal.');
  lines.push('');
  lines.push(`Total de visitas al perfil: ${views.length}`);
  lines.push(`Total de clics a WhatsApp: ${whatsapps.length}`);
  lines.push('');
  lines.push('--- Visitas al perfil ---');
  if (views.length === 0) lines.push('(sin visitas)');
  views.forEach(v => lines.push(`  ${fmt(v.createdAt)}`));
  lines.push('');
  lines.push('--- Clics a WhatsApp ---');
  if (whatsapps.length === 0) lines.push('(sin clics)');
  whatsapps.forEach(w => lines.push(`  ${fmt(w.createdAt)}`));
  lines.push('');
  lines.push('Saludos,');
  lines.push('El equipo de SexAppeal');

  const body = lines.join('\n');

  console.log('----- EMAIL PREVIEW -----');
  console.log('To:', RECIPIENT);
  console.log(body);
  console.log('-------------------------');

  await sendEmail({
    email: RECIPIENT,
    subject: `Reporte de actividad de tu perfil (${ALIAS})`,
    message: body
  });

  console.log('\nEmail enviado a:', RECIPIENT);
  process.exit(0);
}

run().catch(err => { console.error(err); process.exit(1); });
