const { normalizeWhatsAppPhone } = require('./professionalInviteMessage');

/** Digit variants for matching leads stored with or without country code. */
function expandPhoneVariants(phone) {
  const normalized = normalizeWhatsAppPhone(phone);
  if (!normalized) return [];

  const variants = new Set([normalized]);
  if (normalized.startsWith('549')) {
    variants.add(normalized.slice(3));
    variants.add(`9${normalized.slice(3)}`);
    variants.add(normalized.slice(2));
  } else if (normalized.startsWith('54')) {
    variants.add(normalized.slice(2));
  }
  if (normalized.length > 10) {
    variants.add(normalized.slice(-10));
  }
  return [...variants].filter(Boolean);
}

function buildPhoneInQuery(phone) {
  const variants = expandPhoneVariants(phone);
  if (!variants.length) return null;
  return { phone: { $in: variants } };
}

const OUTREACH_ALLOWED_FILTER = {
  doNotContact: { $ne: true }
};

function isOutreachBlocked(lead) {
  return Boolean(lead?.doNotContact);
}

module.exports = {
  expandPhoneVariants,
  buildPhoneInQuery,
  OUTREACH_ALLOWED_FILTER,
  isOutreachBlocked
};
