/**
 * Public visibility rules for professional profiles.
 * User-initiated "delete" is a soft delete: hidden from grid, data retained server-side.
 */

const PUBLIC_LISTING_FILTER = {
  role: 'professional',
  isVerified: true,
  accountDeletedAt: null,
  'professionalProfile.subscriptionStatus': { $ne: 'suspended' },
  'professionalProfile.isExposed': { $ne: false }
};

const INDEXABLE_FILTER = {
  role: 'professional',
  isVerified: true,
  verificationStatus: 'approved',
  accountDeletedAt: null,
  'professionalProfile.subscriptionStatus': { $ne: 'suspended' },
  'professionalProfile.isExposed': { $ne: false },
  'professionalProfile.alias': { $exists: true, $nin: ['', null] }
};

function isAccountDeleted(user) {
  return Boolean(user?.accountDeletedAt);
}

function isPubliclyListed(user) {
  if (!user || user.role !== 'professional' || isAccountDeleted(user)) return false;
  const prof = user.professionalProfile || {};
  if (prof.subscriptionStatus === 'suspended') return false;
  if (prof.isExposed === false) return false;
  return Boolean(user.isVerified);
}

function mergePublicListingFilter(extra = {}) {
  return { ...PUBLIC_LISTING_FILTER, ...extra };
}

module.exports = {
  PUBLIC_LISTING_FILTER,
  INDEXABLE_FILTER,
  isAccountDeleted,
  isPubliclyListed,
  mergePublicListingFilter
};
