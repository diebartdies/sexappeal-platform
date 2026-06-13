const REJECTION_REASONS = ['photos_unclear', 'photo_info_mismatch', 'general_failure'];

const REJECTION_REASON_LABELS = {
  photos_unclear: 'Photos are not clear enough to validate information',
  photo_info_mismatch: 'Photo information doesnt match registration info.',
  general_failure: 'General failure'
};

function isValidRejectionReason(reason) {
  return REJECTION_REASONS.includes(reason);
}

function buildRejectionEmail({ alias, reason, details }) {
  const name = alias || 'Professional';
  const detailBlock = String(details || '').trim();
  const footer = '\n\nPlease log in to your Professional Dashboard to address this.\n\nSexAppeal Team';

  if (reason === 'photos_unclear') {
    return `Hello ${name},

Photos are not clear enough to validate information: please upload again the following picture/pictures:
${detailBlock}

Since the quality of them doesn't allow Admin to validate information submitted in request form. Once you login you will be requested to do so and a profile preview will be opened to allow you load necessary photos.${footer}`;
  }

  if (reason === 'photo_info_mismatch') {
    return `Hello ${name},

Photo information doesnt match registration info. please upload again the following picture/pictures:
${detailBlock}

Since the detailed information is not the same as the one loaded in registration form. Once you login again you will be requested to do so and a profile preview will be opened to allow you load necessary photos.${footer}`;
  }

  return `Hello ${name},

${detailBlock}${footer}`;
}

module.exports = {
  REJECTION_REASONS,
  REJECTION_REASON_LABELS,
  isValidRejectionReason,
  buildRejectionEmail
};
