/** Dial codes for registration — Americas + Europe. Default: Argentina (+54). */
export const PHONE_COUNTRIES = [
    { iso: 'AR', name: 'Argentina', dial: '+54', flag: '🇦🇷', default: true },
    { iso: 'US', name: 'United States', dial: '+1', flag: '🇺🇸' },
    { iso: 'CA', name: 'Canada', dial: '+1', flag: '🇨🇦' },
    { iso: 'MX', name: 'Mexico', dial: '+52', flag: '🇲🇽' },
    { iso: 'GT', name: 'Guatemala', dial: '+502', flag: '🇬🇹' },
    { iso: 'BZ', name: 'Belize', dial: '+501', flag: '🇧🇿' },
    { iso: 'HN', name: 'Honduras', dial: '+504', flag: '🇭🇳' },
    { iso: 'SV', name: 'El Salvador', dial: '+503', flag: '🇸🇻' },
    { iso: 'NI', name: 'Nicaragua', dial: '+505', flag: '🇳🇮' },
    { iso: 'CR', name: 'Costa Rica', dial: '+506', flag: '🇨🇷' },
    { iso: 'PA', name: 'Panama', dial: '+507', flag: '🇵🇦' },
    { iso: 'BR', name: 'Brazil', dial: '+55', flag: '🇧🇷' },
    { iso: 'CL', name: 'Chile', dial: '+56', flag: '🇨🇱' },
    { iso: 'CO', name: 'Colombia', dial: '+57', flag: '🇨🇴' },
    { iso: 'PE', name: 'Peru', dial: '+51', flag: '🇵🇪' },
    { iso: 'UY', name: 'Uruguay', dial: '+598', flag: '🇺🇾' },
    { iso: 'PY', name: 'Paraguay', dial: '+595', flag: '🇵🇾' },
    { iso: 'BO', name: 'Bolivia', dial: '+591', flag: '🇧🇴' },
    { iso: 'EC', name: 'Ecuador', dial: '+593', flag: '🇪🇨' },
    { iso: 'VE', name: 'Venezuela', dial: '+58', flag: '🇻🇪' },
    { iso: 'ES', name: 'Spain', dial: '+34', flag: '🇪🇸' },
    { iso: 'PT', name: 'Portugal', dial: '+351', flag: '🇵🇹' },
    { iso: 'FR', name: 'France', dial: '+33', flag: '🇫🇷' },
    { iso: 'DE', name: 'Germany', dial: '+49', flag: '🇩🇪' },
    { iso: 'IT', name: 'Italy', dial: '+39', flag: '🇮🇹' },
    { iso: 'GB', name: 'United Kingdom', dial: '+44', flag: '🇬🇧' },
    { iso: 'NL', name: 'Netherlands', dial: '+31', flag: '🇳🇱' },
    { iso: 'BE', name: 'Belgium', dial: '+32', flag: '🇧🇪' },
    { iso: 'CH', name: 'Switzerland', dial: '+41', flag: '🇨🇭' },
    { iso: 'AT', name: 'Austria', dial: '+43', flag: '🇦🇹' },
    { iso: 'IE', name: 'Ireland', dial: '+353', flag: '🇮🇪' },
    { iso: 'SE', name: 'Sweden', dial: '+46', flag: '🇸🇪' },
    { iso: 'NO', name: 'Norway', dial: '+47', flag: '🇳🇴' },
    { iso: 'PL', name: 'Poland', dial: '+48', flag: '🇵🇱' },
    { iso: 'GR', name: 'Greece', dial: '+30', flag: '🇬🇷' },
    { iso: 'RO', name: 'Romania', dial: '+40', flag: '🇷🇴' },
    { iso: 'UA', name: 'Ukraine', dial: '+380', flag: '🇺🇦' }
];

export function defaultPhoneCountry() {
    return PHONE_COUNTRIES.find((c) => c.default) || PHONE_COUNTRIES[0];
}

/**
 * Build E.164 phone from dial code (+54) and local digits entered by user.
 * Argentina (+54): inserts mobile prefix 9 when missing (549 + area + number).
 */
export function buildFullPhoneNumber(dial, localRaw) {
    const dialDigits = String(dial || '').replace(/\D/g, '') || '54';
    let local = String(localRaw || '').trim().replace(/\D/g, '');
    if (local.startsWith('0')) local = local.replace(/^0+/, '');

    if (dialDigits === '54') {
        if (local.startsWith('549')) local = local.slice(3);
        else if (local.startsWith('54')) local = local.slice(2);
        if (local && local[0] !== '9') local = `9${local}`;
    }

    if (!local) return '';
    return `+${dialDigits}${local}`;
}
