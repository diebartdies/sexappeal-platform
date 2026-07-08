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
  if (!host) return '';
  return `https://${host}/register.html?type=professional`;
}

/** Public HTTPS URL for outreach logo (Twilio template header / media messages). */
function getOutreachBrandImageUrl() {
  const explicit = (process.env.TWILIO_WHATSAPP_MEDIA_URL || config.sms?.whatsappMediaUrl || '').trim();
  if (explicit) return explicit.replace(/\/$/, '');

  const host = getOutreachAliasDomain();
  if (host) return `https://${host}/images/outreach-logo.png`;

  const base = (config.platform?.publicUrl || PUBLIC_URL).replace(/\/$/, '');
  return `${base}/images/outreach-logo.png`;
}

// Step 2a (manual reply after she answers step 1): thank + details — no link unless they ask.
function buildStep2LaunchFeedbackReply(alias) {
  const name = (alias && String(alias).trim()) || '';
  const greeting = name ? `¡Gracias por escribir, ${name}!` : '¡Gracias por escribir!';

  return `${greeting}

Leemos todas las respuestas — nos ayuda a armar la plataforma en el lanzamiento.

Si querés, contame un poco más (qué te preocupa o qué te gustaría ver). Cuando quieras probar el mes gratis, te paso el registro express por acá — sin tarjeta ni débito automático.

Sin compromiso. 😊`;
}

// Step 2b (after interest or feedback): safe link on the SelfAppeal alias.
function buildStep2OutreachReply(alias) {
  const name = (alias && String(alias).trim()) || '';
  const greeting = name ? `¡Genial ${name}!` : '¡Genial!';
  const url = buildOutreachRegisterUrl();
  if (!url) {
    return `${greeting} Te cuento más por acá. ¿Querés que te explique cómo funciona el registro?`;
  }
  return `${greeting} Cuando quieras probar, acá tenés el registro express (2 minutos):

${url}

No pedimos registrar ningún medio de pago — ni tarjeta, ni Mercado Pago automático. Te ayudamos a completar fotos y perfil por acá. Después del mes gratis, solo abonás si querés seguir visible.

Revisá Spam/Correo no deseado: te llega un código de 6 dígitos para activar el mail. Cualquier duda, respondeme. 😊`;
}

function normalizeE164Digits(phone) {
  if (!phone) return '';
  return String(phone).replace(/\D/g, '');
}

function normalizeWhatsAppPhone(phone) {
  if (!phone) return '';
  let cleanPhone = normalizeE164Digits(phone);
  if (!cleanPhone) return '';

  if (!cleanPhone.startsWith('54')) {
    cleanPhone = '549' + cleanPhone.replace(/^0+/, '');
  } else if (cleanPhone.startsWith('54') && !cleanPhone.startsWith('549')) {
    cleanPhone = cleanPhone.slice(0, 2) + '9' + cleanPhone.slice(2);
  }
  return cleanPhone;
}

/** Registration form: normalize E.164; Argentina gets mobile 9 after +54 when missing. */
function normalizeRegistrationMobilePhone(phone) {
  if (!phone) return '';
  const raw = String(phone).trim();
  const digits = normalizeE164Digits(raw);
  if (!digits) return raw;

  if (digits.startsWith('54') || raw.startsWith('+54')) {
    const normalized = normalizeWhatsAppPhone(raw);
    return normalized ? `+${normalized}` : raw;
  }

  return raw.startsWith('+') ? raw : `+${digits}`;
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

// Step 1 cold outreach (Twilio template watext_updated + web.js caption). {{1}} = alias in Meta template.
// Register URL is static in the template body (selfappeal alias — no "sex" substring).
function buildColdOutreachStep1Message(alias) {
  const name = (alias && String(alias).trim()) || 'hermosa';
  const registerUrl = buildOutreachRegisterUrl() || 'https://selfappeal.drsrv.net.ar/register.html?type=professional';

  return `Hola ${name} ✨

Estamos en el lanzamiento de SelfAppeal, un directorio nuevo para publicar tu perfil y servicios — distinto a los que ya conocés. Ofrecemos:

✅ Primer mes gratis · sin comisiones por contacto
✅ Rotación justa: nadie paga extra para quedar primera
✅ Perfiles verificados · contacto protegido · vacaciones descontables
✅ No pedimos registrar ningún medio de pago

¿Querés saber más? Respondé a este mensaje.

Y para hacerlo aún más a tu medida, ¿qué te parece que no debería faltar en una plataforma de oferta de servicios?

Si querés probarlo: ${registerUrl}`;
}

// Meta re-submission: text-only, no URL, no survey — higher approval rate for cold UTILITY/MARKETING.
// Register link stays in step-2 manual reply (buildStep2OutreachReply) and wa.me / inbox.
function buildColdOutreachStep1MessageMetaSafe(alias) {
  const name = (alias && String(alias).trim()) || 'hermosa';

  return `Hola ${name}

Estamos lanzando SelfAppeal, un directorio nuevo para publicar tu perfil profesional.

Primer mes gratis, sin comisiones por contacto y sin pedir tarjeta ni débito automático.

¿Querés saber más? Respondé a este mensaje.`;
}

/** Full body for drip preview / WebJS. */
function getColdOutreachTemplateBodySample() {
  return buildColdOutreachStep1MessageMetaSafe('María').replace('María', '{{1}}');
}

function buildSanitizedWhatsAppCaption(alias) {
  return buildColdOutreachStep1MessageMetaSafe(alias);
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
  getOutreachBrandImageUrl,
  buildColdOutreachStep1Message,
  buildColdOutreachStep1MessageMetaSafe,
  getColdOutreachTemplateBodySample,
  buildStep2LaunchFeedbackReply,
  buildStep2OutreachReply,
  normalizeE164Digits,
  normalizeWhatsAppPhone,
  normalizeRegistrationMobilePhone,
  buildProfessionalInviteMessage,
  buildSanitizedWhatsAppCaption,
  buildWhatsAppUrl
};
