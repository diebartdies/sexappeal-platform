const path = require('path');
const config = require('../config/appConfig');

const PUBLIC_URL = config.platform?.publicUrl || 'https://sexappeal.drsrv.net.ar';
const REGISTER_URL = config.platform?.registerUrl || `${PUBLIC_URL}/register.html`;

// WhatsApp contact (E.164 digits, no '+') leads can reply to. Contains no banned
// words, so it is safe to keep in the message text.
const WHATSAPP_CONTACT_URL = 'https://wa.me/5491178280156';

// Outreach drip image (PNG/JPG). Default outreach-logo.png uses the SelfAppeal
// wordmark (no "sex" in OCR text). Site pages use brand-logo.png separately.
// Overridable via WHATSAPP_DRIP_IMAGE.
const BRAND_IMAGE_PATH = process.env.WHATSAPP_DRIP_IMAGE
  || path.resolve(__dirname, '..', 'public', 'images', 'outreach-logo.png');

// Neutral outreach hostname (SelfAppeal alias — no "sex" substring). Same app as
// sexappeal.drsrv.net.ar; used for WhatsApp step-2 register links only.
function getOutreachAliasDomain() {
  const raw = (config.whatsappDrip?.aliasDomain || '').trim();
  if (!raw) return '';
  return raw.replace(/^https?:\/\//i, '').replace(/\/.*$/, '');
}

function buildOutreachRegisterUrl() {
  const host = getOutreachAliasDomain();
  if (!host) return null;
  return `https://${host}/register.html`;
}

// Step 2 (manual reply after she writes back): safe link on the SelfAppeal alias.
function buildStep2OutreachReply(alias) {
  const name = (alias && String(alias).trim()) || '';
  const greeting = name ? `¡Genial ${name}!` : '¡Genial!';
  const url = buildOutreachRegisterUrl();
  if (!url) {
    return `${greeting} Te cuento más por acá. ¿Querés que te explique cómo funciona el registro?`;
  }
  return `${greeting} Acá podés registrarte en SelfAppeal (primer mes de prueba sin costo):

${url}

Cualquier duda, respondeme por acá. 😊`;
}

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

💎 TU VIDRIERA PERSONAL
SexAppeal es tu escaparate exclusivo para mostrar tu belleza y tus servicios a los clientes que te buscan. Es tu perfil, tu presencia, tus fotos: un espacio pensado para que brilles y te luzcas. Nosotros te damos la vitrina y te conectamos de forma directa y discreta con clientes potenciales — sin intermediarios.

🤝 MÁS QUE UNA VITRINA, UN ALIADO
SexAppeal es mucho más que un escaparate: somos tu socio en una profesión exigente. Llegamos para hacerte las cosas más fáciles, cuidar tu privacidad y acompañarte en cada paso, para que vos te ocupes solo de lo que mejor sabés hacer.

✨ TU PRIMER MES, SIN COSTO
Durante los próximos 30 días disfrutás de un período de evaluación completamente gratuito. Es tu oportunidad de conocer la plataforma, recibir contactos reales y descubrir el valor de estar visible en un espacio exclusivo, discreto y sin comisiones por conexión.

📂 CATEGORÍA DURANTE LA EVALUACIÓN
En este primer mes, tu perfil aparecerá en una categoría asignada al azar entre todas las participantes activas.

Cuando finalice tu mes gratuito y tu primer pago sea validado por nuestro equipo, pasarás automáticamente a la categoría que elijas al registrarte — y pagarás únicamente la tarifa correspondiente a esa categoría.

🏖️ VACACIONES
Si necesitás ausentarte, podés registrar vacaciones desde tu panel. Durante ese período tu perfil figura como inactivo y podés descontar hasta 15 días de vacaciones por mes de tu saldo a abonar — sin perder tu lugar.

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

// Sanitized WhatsApp caption sent ALONGSIDE the brand image (see BRAND_IMAGE_PATH).
//
// Hard constraints baked in here:
//   1. The literal brand word (which contains "sex") never appears in this text —
//      the brand is conveyed by the attached image only. We say "nuestra
//      plataforma" / "la app" instead.
//   2. The site domain `sexappeal.drsrv.net.ar` literally contains "sex", so it is
//      DELIBERATELY OMITTED from the caption. Replies are driven to the WhatsApp
//      contact instead. Step-2 replies use buildStep2OutreachReply() with the
//      SelfAppeal alias (selfappeal.drsrv.net.ar by default).
function buildSanitizedWhatsAppCaption(alias) {
  const name = (alias && String(alias).trim()) || 'hermosa';

  // STEP 1 of a 2-step flow: this cold message carries NO link (lower spam/ban
  // risk + less "scam" feel) and drives a REPLY in the same chat. The website
  // link is sent only in STEP 2, once she replies and there is context/trust.
  return `Hola ${name} ✨

Te invito a nuestra plataforma para profesionales — un directorio distinto a los demás:

✅ Posición rotativa: todas aparecen por igual, nadie paga para estar arriba.
✅ Verificación de identidad y edad: perfiles reales, ambiente serio.
✅ Tu contacto es tuyo: no lo vendemos ni lo compartimos con terceros.
✅ No pagás los días que marcás como vacaciones.

El costo depende de tu categoría, y tu primer mes es de prueba sin costo.

¿Te interesa? Respondé a este mismo chat y te cuento todo. 😊`;
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
  WHATSAPP_CONTACT_URL,
  BRAND_IMAGE_PATH,
  getOutreachAliasDomain,
  buildOutreachRegisterUrl,
  buildStep2OutreachReply,
  normalizeWhatsAppPhone,
  buildProfessionalInviteMessage,
  buildSanitizedWhatsAppCaption,
  buildWhatsAppUrl
};
