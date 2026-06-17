const { REGISTER_URL, normalizeWhatsAppPhone } = require('./professionalInviteMessage');

// Twilio requires E.164 (+<country><number>). The shared WhatsApp normalizer
// already yields Argentina mobile digits (54 9 XXXXXXXXXX); we just prefix '+'.
function normalizeSmsPhone(phone) {
  const digits = normalizeWhatsAppPhone(phone);
  if (!digits) return '';
  return `+${digits}`;
}

// Short, plain-text Spanish invite (aim for 1-2 SMS segments). No emojis so the
// message stays GSM-7 single-segment friendly; personalize with alias/name when
// available.
function buildInviteSms({ name, alias } = {}) {
  const who = (name || alias || '').toString().trim();
  const greeting = who ? `Hola ${who}!` : 'Hola!';
  return `${greeting} Te invitamos a SexAppeal, tu vidriera personal para mostrar tus servicios. 1er mes gratis. Registrate: ${REGISTER_URL}`;
}

module.exports = {
  normalizeSmsPhone,
  buildInviteSms
};
