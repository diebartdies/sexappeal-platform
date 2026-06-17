const { REGISTER_URL, normalizeWhatsAppPhone } = require('./professionalInviteMessage');

// Twilio requires E.164 (+<country><number>). The shared WhatsApp normalizer
// already yields Argentina mobile digits (54 9 XXXXXXXXXX); we just prefix '+'.
function normalizeSmsPhone(phone) {
  const digits = normalizeWhatsAppPhone(phone);
  if (!digits) return '';
  return `+${digits}`;
}

// WhatsApp contact for outreach replies (E.164 digits, no '+'), used in the SMS CTA.
const WHATSAPP_INVITE_URL = 'https://wa.me/5491178280156';

// Short, plain-text Spanish invite (aim for 1-2 SMS segments). No emojis/accents so
// the message stays GSM-7 (avoids UCS-2 segment inflation); personalize with
// alias/name when available.
function buildInviteSms({ name, alias } = {}) {
  const who = (name || alias || '').toString().trim();
  const greeting = who ? `Hola ${who}!` : 'Hola!';
  return `${greeting} Te invitamos a SexAppeal, tu vidriera personal para mostrar tus servicios. 1er mes gratis. Registrate: ${REGISTER_URL} Escribinos por WhatsApp para mas info: ${WHATSAPP_INVITE_URL}`;
}

module.exports = {
  normalizeSmsPhone,
  buildInviteSms
};
