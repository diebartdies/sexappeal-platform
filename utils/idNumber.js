/** Argentine professional DNI: yx.xxx.xxx — first digit y must be > 2 (3–9). */

const ID_NUMBER_PATTERN = /^[3-9]\d\.\d{3}\.\d{3}$/;

function stripIdNumberDigits(value) {
  return String(value || '').replace(/\D/g, '').slice(0, 8);
}

function formatProfessionalIdNumber(value) {
  const digits = stripIdNumberDigits(value);
  if (!digits) return '';

  let formatted = digits.slice(0, 2);
  if (digits.length > 2) formatted += `.${digits.slice(2, 5)}`;
  if (digits.length > 5) formatted += `.${digits.slice(5, 8)}`;
  return formatted;
}

function isValidProfessionalIdNumber(value) {
  return ID_NUMBER_PATTERN.test(formatProfessionalIdNumber(value));
}

function getProfessionalIdNumberError(value) {
  const digits = stripIdNumberDigits(value);
  const formatted = formatProfessionalIdNumber(value);

  if (!digits) return 'ID Number is required.';
  if (digits.length !== 8) {
    return 'ID Number must have 8 digits in the format XX.XXX.XXX (e.g. 45.678.901).';
  }
  if (digits[0] <= '2') {
    return 'ID Number must start with a digit greater than 2 (young DNI format, e.g. 45.678.901).';
  }
  if (!ID_NUMBER_PATTERN.test(formatted)) {
    return 'Invalid ID Number format. Use XX.XXX.XXX with dots after the million and thousand groups.';
  }
  return null;
}

function normalizeProfessionalIdNumber(value) {
  if (!value || !String(value).trim()) return '';
  return formatProfessionalIdNumber(value);
}

module.exports = {
  ID_NUMBER_PATTERN,
  stripIdNumberDigits,
  formatProfessionalIdNumber,
  isValidProfessionalIdNumber,
  getProfessionalIdNumberError,
  normalizeProfessionalIdNumber
};
