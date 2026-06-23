/** Dial codes for registration — Americas + Europe. Default: Argentina (+54). */
export const PHONE_COUNTRIES = [
    { iso: 'AR', name: 'Argentina', nameEs: 'Argentina', dial: '+54', default: true },
    { iso: 'US', name: 'United States', nameEs: 'Estados Unidos', dial: '+1' },
    { iso: 'CA', name: 'Canada', nameEs: 'Canadá', dial: '+1' },
    { iso: 'MX', name: 'Mexico', nameEs: 'México', dial: '+52' },
    { iso: 'GT', name: 'Guatemala', nameEs: 'Guatemala', dial: '+502' },
    { iso: 'BZ', name: 'Belize', nameEs: 'Belice', dial: '+501' },
    { iso: 'HN', name: 'Honduras', nameEs: 'Honduras', dial: '+504' },
    { iso: 'SV', name: 'El Salvador', nameEs: 'El Salvador', dial: '+503' },
    { iso: 'NI', name: 'Nicaragua', nameEs: 'Nicaragua', dial: '+505' },
    { iso: 'CR', name: 'Costa Rica', nameEs: 'Costa Rica', dial: '+506' },
    { iso: 'PA', name: 'Panama', nameEs: 'Panamá', dial: '+507' },
    { iso: 'BR', name: 'Brazil', nameEs: 'Brasil', dial: '+55' },
    { iso: 'CL', name: 'Chile', nameEs: 'Chile', dial: '+56' },
    { iso: 'CO', name: 'Colombia', nameEs: 'Colombia', dial: '+57' },
    { iso: 'PE', name: 'Peru', nameEs: 'Perú', dial: '+51' },
    { iso: 'UY', name: 'Uruguay', nameEs: 'Uruguay', dial: '+598' },
    { iso: 'PY', name: 'Paraguay', nameEs: 'Paraguay', dial: '+595' },
    { iso: 'BO', name: 'Bolivia', nameEs: 'Bolivia', dial: '+591' },
    { iso: 'EC', name: 'Ecuador', nameEs: 'Ecuador', dial: '+593' },
    { iso: 'VE', name: 'Venezuela', nameEs: 'Venezuela', dial: '+58' },
    { iso: 'ES', name: 'Spain', nameEs: 'España', dial: '+34' },
    { iso: 'PT', name: 'Portugal', nameEs: 'Portugal', dial: '+351' },
    { iso: 'FR', name: 'France', nameEs: 'Francia', dial: '+33' },
    { iso: 'DE', name: 'Germany', nameEs: 'Alemania', dial: '+49' },
    { iso: 'IT', name: 'Italy', nameEs: 'Italia', dial: '+39' },
    { iso: 'GB', name: 'United Kingdom', nameEs: 'Reino Unido', dial: '+44' },
    { iso: 'NL', name: 'Netherlands', nameEs: 'Países Bajos', dial: '+31' },
    { iso: 'BE', name: 'Belgium', nameEs: 'Bélgica', dial: '+32' },
    { iso: 'CH', name: 'Switzerland', nameEs: 'Suiza', dial: '+41' },
    { iso: 'AT', name: 'Austria', nameEs: 'Austria', dial: '+43' },
    { iso: 'IE', name: 'Ireland', nameEs: 'Irlanda', dial: '+353' },
    { iso: 'SE', name: 'Sweden', nameEs: 'Suecia', dial: '+46' },
    { iso: 'NO', name: 'Norway', nameEs: 'Noruega', dial: '+47' },
    { iso: 'PL', name: 'Poland', nameEs: 'Polonia', dial: '+48' },
    { iso: 'GR', name: 'Greece', nameEs: 'Grecia', dial: '+30' },
    { iso: 'RO', name: 'Romania', nameEs: 'Rumania', dial: '+40' },
    { iso: 'UA', name: 'Ukraine', nameEs: 'Ucrania', dial: '+380' }
];

export function defaultPhoneCountry() {
    return PHONE_COUNTRIES.find((c) => c.default) || PHONE_COUNTRIES[0];
}

export function getPhoneCountryFlagUrl(iso) {
    const code = String(iso || '').trim().toLowerCase();
    if (!code) return '';
    return `https://flagcdn.com/w40/${code}.png`;
}

export function getPhoneCountryName(country, lang) {
    if (!country) return '';
    const useEs = (lang || 'es') === 'es';
    return useEs ? (country.nameEs || country.name) : country.name;
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
