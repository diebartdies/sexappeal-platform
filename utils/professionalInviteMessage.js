const config = require('../config/appConfig');

const PUBLIC_URL = config.platform?.publicUrl || 'https://sexappeal.drsrv.net.ar';
const REGISTER_URL = config.platform?.registerUrl || `${PUBLIC_URL}/register.html`;

function normalizeWhatsAppPhone(phone) {
  if (!phone) return '';
  let cleanPhone = String(phone).replace(/\D/g, '');
  if (!cleanPhone) return '';

  if (!cleanPhone.startsWith('54')) {
    cleanPhone = '549' + cleanPhone.replace(/^0+/, '');
  } else if (cleanPhone.startsWith('54') && !cleanPhone.startsWith('549')) {
    cleanPhone = cleanPhone.slice(0, 2) + '9' + cleanPhone.slice(2);
  }
  return cleanPhone;
}

function buildProfessionalInviteMessage(alias) {
  const name = (alias && String(alias).trim()) || 'hermosa';

  return `Hola ${name} ✨

Bienvenida a SexAppeal, el santuario donde tu presencia se convierte en una Living Treasure.

✨ TU PRIMER MES, SIN COSTO
Durante los próximos 30 días disfrutás de un período de evaluación completamente gratuito. Es tu oportunidad de conocer la plataforma, recibir contactos reales y descubrir el valor de estar visible en un espacio exclusivo, discreto y sin comisiones por conexión.

📂 CATEGORÍA DURANTE LA EVALUACIÓN
En este primer mes, tu perfil aparecerá en una categoría asignada al azar entre todas las participantes activas.

Cuando finalice tu mes gratuito y tu primer pago sea validado por nuestro equipo, pasarás automáticamente a la categoría que elijas al registrarte — y pagarás únicamente la tarifa correspondiente a esa categoría.

🏖️ VACACIONES
Si necesitás ausentarte, podés registrar vacaciones desde tu panel. Durante ese período tu perfil figurará como inactivo y, en tu facturación mensual, se descontarán hasta 15 días de vacaciones del saldo a abonar.

💰 FACTURACIÓN INTELIGENTE POR CATEGORÍA
Tu abono mensual se calcula según la categoría que elijas (Standard, Silver, Gold, Premium o Elite). Si durante el mes cambiás de categoría por decisión propia, el sistema registra la fecha del cambio y prorratea automáticamente los días en cada tarifa — sin sorpresas ni cálculos manuales.

🔒 PLATAFORMA SEGURA Y TRAZABLE
Perfiles verificados con documentación y selfie de gesto, contacto protegido anti-scraping, registro de actividad trazable (incluso navegación anónima sin cookies de seguimiento) y acuerdo de respeto integrado en cada interacción.

🔗 REGISTRATE EN LA PLATAFORMA
${REGISTER_URL}

🌐 Visitanos también en:
${PUBLIC_URL}

Gracias por confiar en la Arquitectura de la Intimidad.

— Equipo SexAppeal`;
}

function buildWhatsAppUrl(phone, alias) {
  const cleanPhone = normalizeWhatsAppPhone(phone);
  if (!cleanPhone) return null;
  const text = encodeURIComponent(buildProfessionalInviteMessage(alias));
  return `https://wa.me/${cleanPhone}?text=${text}`;
}

module.exports = {
  PUBLIC_URL,
  REGISTER_URL,
  normalizeWhatsAppPhone,
  buildProfessionalInviteMessage,
  buildWhatsAppUrl
};
