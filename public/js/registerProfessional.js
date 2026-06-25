import { API_URL, appPath } from './globals.js';
import { showAlert, attachPasswordToggles } from './uiHelpers.js';
import { t, applyStaticTranslations } from './i18n.js';
import { confirmDialog, wireFormLabel, setFieldInvalid } from './a11y.js';
import { navigateWithReturn } from './navReturn.js';
import { PHONE_COUNTRIES, defaultPhoneCountry, buildFullPhoneNumber, getPhoneCountryFlagUrl, getPhoneCountryName } from './phoneCountryCodes.js';

function isAdminSession() {
    try {
        const raw = localStorage.getItem('user');
        if (!raw) return false;
        return JSON.parse(raw)?.role === 'admin';
    } catch {
        return false;
    }
}

function registrationTrackingPayload(extra = {}) {
    const form = document.getElementById('registerForm');
    return {
        hadFormData: registrationFormHasChanges(form),
        ...extra
    };
}

function redirectToLogin(email) {
    const trimmed = String(email || '').trim();
    const q = trimmed ? `?email=${encodeURIComponent(trimmed)}` : '';
    window.location.href = appPath(`login.html${q}`);
}

async function isEmailAlreadyRegistered(email) {
    const trimmed = String(email || '').trim().toLowerCase();
    if (!trimmed || !/.+@.+\..+/.test(trimmed)) return false;
    const res = await fetch(`${API_URL}/auth/check-email?email=${encodeURIComponent(trimmed)}`);
    const data = await res.json();
    return Boolean(data.success && data.data?.registered);
}

function setupEmailExistsGuard() {
    const emailEl = document.getElementById('regEmail');
    if (!emailEl || emailEl.dataset.regEmailGuard === '1') return;
    emailEl.dataset.regEmailGuard = '1';
    emailEl.addEventListener('blur', async () => {
        const email = emailEl.value.trim();
        if (!email) return;
        try {
            if (await isEmailAlreadyRegistered(email)) {
                redirectToLogin(email);
            }
        } catch {
            /* network error — submit will re-check */
        }
    });
}

function trackRegistrationEvent(event, extra = {}) {
    if (isAdminSession()) return;
    fetch(`${API_URL}/public/registration-track`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ event, ...registrationTrackingPayload(extra) })
    }).catch(() => {});
}

function trackRegistrationAbandon(reason) {
    trackRegistrationEvent('abandon', { reason });
}

function getRegistrationLocale() {
    return (localStorage.getItem('platform_lang') || 'es') === 'es' ? 'es-AR' : 'en-US';
}

function isSpanishLocale() {
    return getRegistrationLocale() === 'es-AR';
}

function birthDatePlaceholder() {
    return isSpanishLocale() ? 'dd/mm/aaaa' : 'mm/dd/yyyy';
}

function pad2(n) {
    return String(n).padStart(2, '0');
}

function isoFromParts(year, month, day) {
    if (!year || !month || !day) return '';
    if (month < 1 || month > 12 || day < 1 || day > 31) return '';
    const iso = `${year}-${pad2(month)}-${pad2(day)}`;
    const d = new Date(`${iso}T12:00:00`);
    if (Number.isNaN(d.getTime())) return '';
    if (d.getFullYear() !== year || d.getMonth() + 1 !== month || d.getDate() !== day) return '';
    return iso;
}

function parseDisplayBirthDate(str) {
    const raw = String(str || '').trim();
    if (!raw) return '';
    const parts = raw.split(/[/.\\-]/).map((p) => p.trim()).filter(Boolean);
    if (parts.length !== 3) return '';
    let day;
    let month;
    let year = Number(parts[2]);
    if (parts[2].length === 2) year += year >= 50 ? 1900 : 2000;
    if (isSpanishLocale()) {
        day = Number(parts[0]);
        month = Number(parts[1]);
    } else {
        month = Number(parts[0]);
        day = Number(parts[1]);
    }
    return isoFromParts(year, month, day);
}

function formatDisplayBirthDate(iso) {
    if (!iso) return '';
    const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(iso);
    if (!m) return '';
    const [, y, mo, d] = m;
    return isSpanishLocale() ? `${d}/${mo}/${y}` : `${mo}/${d}/${y}`;
}

function getBirthDateIsoValue() {
    const textEl = document.getElementById('regBirthDate');
    const nativeEl = document.getElementById('regBirthDateNative');
    const fromText = parseDisplayBirthDate(textEl?.value);
    if (fromText) return fromText;
    return nativeEl?.value || '';
}

function highlightField(el, on = true) {
    if (!el) return;
    el.classList.toggle('reg-field-error', on);
    setFieldInvalid(el, on, document.getElementById('registerAlert'));
    if (on) {
        el.scrollIntoView({ behavior: 'smooth', block: 'center' });
        el.focus({ preventScroll: true });
    }
}

function clearFieldErrors(form) {
    form.querySelectorAll('.reg-field-error').forEach((el) => {
        el.classList.remove('reg-field-error');
        setFieldInvalid(el, false, document.getElementById('registerAlert'));
    });
}

function setRegLabel(forId, key, required = false) {
    wireFormLabel(forId, key, required);
}

function registrationFormHasChanges(form) {
    if (!form) return false;
    const fields = form.querySelectorAll('input:not([type="hidden"]), select, textarea');
    for (const el of fields) {
        if (String(el.value || '').trim()) return true;
    }
    return false;
}

function confirmLeaveRegistration(form) {
    if (!registrationFormHasChanges(form)) return Promise.resolve(true);
    return confirmDialog(t('Registration is not finished. If you leave now, your changes will be lost. Continue?'));
}

function goToRegistrationEntrance() {
    if (document.getElementById('regTypePicker')) {
        showRegistrationTypePicker();
        window.scrollTo({ top: 0, behavior: 'smooth' });
        return;
    }
    sessionStorage.setItem('ancestor_code', 'index.html');
    window.location.href = appPath('index.html');
}

let currentRegistrationType = null;

function getRegistrationTypeFromUrl() {
    const type = new URLSearchParams(window.location.search).get('type');
    return type === 'guest' || type === 'professional' ? type : null;
}

function isGuestRegistrationType() {
    return currentRegistrationType === 'guest';
}

function showRegistrationTypePicker() {
    currentRegistrationType = null;
    document.getElementById('regTypePicker')?.classList.remove('hidden');
    document.getElementById('regFormPanel')?.classList.add('hidden');
    const roleEl = document.getElementById('regRole');
    const modeEl = document.getElementById('regRegistrationMode');
    if (roleEl) roleEl.value = '';
    if (modeEl) modeEl.value = '';
}

function setRegistrationFormFieldsRequired(type) {
    const guestAlias = document.getElementById('regGuestAlias');
    if (guestAlias) guestAlias.required = false;
    ['regMobilePhone', 'regBirthDate', 'regPassword', 'regPasswordConfirm'].forEach((id) => {
        const el = document.getElementById(id);
        if (el) el.required = type === 'professional';
    });
}

function showRegistrationForm(type) {
    currentRegistrationType = type;
    document.getElementById('regTypePicker')?.classList.add('hidden');
    document.getElementById('regFormPanel')?.classList.remove('hidden');
    document.getElementById('regRole').value = type === 'guest' ? 'user' : 'professional';
    document.getElementById('regRegistrationMode').value = type === 'guest' ? 'guest' : 'express';

    document.querySelectorAll('.reg-pro-only').forEach((el) => {
        el.classList.toggle('hidden', type === 'guest');
    });
    document.querySelectorAll('.reg-guest-only').forEach((el) => {
        el.classList.toggle('hidden', type !== 'guest');
    });

    setRegistrationFormFieldsRequired(type);
    applyRegistrationPageLabels(type);
    setupInstructions(type);
    bindRegistrationFooterLinks();
    setupEmailExistsGuard();

    if (!isAdminSession() && !sessionStorage.getItem('regVisitTracked')) {
        sessionStorage.setItem('regVisitTracked', '1');
        trackRegistrationEvent('visit', { registrationType: type });
    }
}

function applyTypePickerLabels() {
    const picker = document.getElementById('regTypePicker');
    if (!picker) return;
    const h1 = picker.querySelector('h1');
    const lead = picker.querySelector('p');
    if (h1) h1.textContent = t('Create an account');
    if (lead) lead.textContent = t('Choose how you want to join SexAppeal.');
    const guestBtn = picker.querySelector('[data-reg-type="guest"]');
    const proBtn = picker.querySelector('[data-reg-type="professional"]');
    if (guestBtn) {
        guestBtn.querySelector('strong').textContent = t('Guest registration');
        guestBtn.querySelector('span').textContent = t('Browse the collection — email only, optional display name.');
    }
    if (proBtn) {
        proBtn.querySelector('strong').textContent = t('Professional registration');
        proBtn.querySelector('span').textContent = t('Publish your profile — quick signup; we help you finish photos and details.');
    }
}

function setupRegistrationTypePicker() {
    const picker = document.getElementById('regTypePicker');
    if (!picker || picker.dataset.bound === '1') return;
    picker.dataset.bound = '1';

    applyTypePickerLabels();

    picker.querySelectorAll('[data-reg-type]').forEach((btn) => {
        btn.addEventListener('click', () => {
            const type = btn.getAttribute('data-reg-type');
            if (type === 'guest' || type === 'professional') {
                showRegistrationForm(type);
            }
        });
    });

    const preset = getRegistrationTypeFromUrl();
    if (preset) {
        showRegistrationForm(preset);
    }
}

function leaveRegistration(onLeave, reason = 'leave') {
    const form = document.getElementById('registerForm');
    confirmLeaveRegistration(form).then((ok) => {
        if (!ok) return;
        trackRegistrationAbandon(reason);
        if (typeof onLeave === 'function') {
            onLeave();
            return;
        }
        goToRegistrationEntrance();
    });
}

function bindRegistrationFooterLinks() {
    const loginLink = document.getElementById('regLoginLink');
    if (loginLink && !loginLink.dataset.regLeaveBound) {
        loginLink.dataset.regLeaveBound = '1';
        loginLink.addEventListener('click', () => {
            leaveRegistration(() => {
                navigateWithReturn(appPath('login.html'));
            }, 'login_link');
        });
    }

    const backOrigin = document.getElementById('regBackOrigin');
    if (backOrigin && !backOrigin.dataset.regLeaveBound) {
        backOrigin.dataset.regLeaveBound = '1';
        backOrigin.addEventListener('click', () => leaveRegistration(undefined, 'back_footer'));
    }
}

function setupRegistrationLeaveGuard(form) {
    const backBtn = document.getElementById('regBackToEntrance');
    if (backBtn) {
        backBtn.textContent = `\u2190 ${t('Back to entrance')}`;
        backBtn.onclick = () => leaveRegistration(undefined, 'back_to_entrance');
    }

    const topBack = document.querySelector('.left-group-back');
    if (topBack && !topBack.dataset.regLeaveBound) {
        topBack.dataset.regLeaveBound = '1';
        topBack.onclick = () => leaveRegistration(undefined, 'top_back');
    }

    const brandLogo = document.querySelector('.brand-logo');
    if (brandLogo && !brandLogo.dataset.regLeaveBound) {
        brandLogo.dataset.regLeaveBound = '1';
        brandLogo.addEventListener('click', (e) => {
            e.preventDefault();
            leaveRegistration(undefined, 'brand_logo');
        });
    }
}

function applyRegistrationPageLabels(type = currentRegistrationType || 'professional') {
    const main = document.getElementById('registerMain');
    if (!main) return;

    const isGuest = type === 'guest';
    document.title = `SexAppeal - ${t(isGuest ? 'Guest registration' : 'Professional Registration')}`;

    const h1 = document.getElementById('regFormTitle') || main.querySelector('#regFormPanel > h1');
    if (h1) h1.textContent = t(isGuest ? 'Guest registration' : 'Professional Registration');

    const intro = document.getElementById('regFormIntro') || main.querySelector('#regFormPanel > p');
    if (intro) {
        intro.textContent = t(isGuest
            ? 'Email only — optional display name. Confirm your email to browse.'
            : 'Create your professional profile — first time only. If you already have an account, use Login.');
    }

    const noPayNote = document.getElementById('regNoPaymentNote');
    if (noPayNote) {
        noPayNote.textContent = t('We never ask you to register a payment method — no card, no automatic debit.');
    }

    setRegLabel('regEmail', 'Email', true);
    setRegLabel('regGuestAlias', 'Display name (alias)', false);
    setRegLabel('regMobilePhone', 'Mobile phone', true);
    setRegLabel('regBirthDate', 'Birth date', true);
    setRegLabel('regPassword', 'Password (min 6)', true);
    setRegLabel('regPasswordConfirm', 'Confirm password', true);

    const backBtn = document.getElementById('regBackToEntrance');
    if (backBtn) backBtn.textContent = `\u2190 ${t('Back to account type')}`;

    const submitBtn = document.querySelector('#registerForm button[type="submit"]');
    if (submitBtn) submitBtn.textContent = t(isGuest ? 'Create guest account' : 'Submit Registration');

    const footer = main.querySelector('.card > p:last-of-type');
    if (footer) {
        footer.setAttribute('data-skip-nav-return', '1');
        footer.innerHTML = `${t('Already registered?')} <button type="button" id="regLoginLink" class="reg-inline-link">${t('Login here')}</button> &nbsp;|&nbsp; <button type="button" id="regBackOrigin" class="reg-inline-link muted">${t('Back')}</button>`;
    }

    const guestHint = main.querySelector('#regGuestAlias + .reg-hint');
    if (guestHint) guestHint.textContent = t('Optional — how you appear as a guest. Leave blank to use your email name.');

    const phoneHint = main.querySelector('#regMobilePhone + .reg-hint');
    if (phoneHint) phoneHint.textContent = t('WhatsApp number — we will contact you here to finish your profile.');

    const passHint = main.querySelector('#regPassword + .reg-hint');
    if (passHint) passHint.textContent = t('To sign in to your panel after email verification.');

    const birthHint = document.getElementById('regBirthDateHint');
    if (birthHint) birthHint.textContent = t('We calculate your age automatically — you must be 18 or older.');
}

function formatBirthDateInput(raw) {
    const digits = String(raw || '').replace(/\D/g, '').slice(0, 8);
    if (digits.length <= 2) return digits;
    if (digits.length <= 4) return `${digits.slice(0, 2)}/${digits.slice(2)}`;
    return `${digits.slice(0, 2)}/${digits.slice(2, 4)}/${digits.slice(4)}`;
}

function setupBirthDateField() {
    const textInput = document.getElementById('regBirthDate');
    const nativeInput = document.getElementById('regBirthDateNative');
    const pickerBtn = document.getElementById('regBirthDatePickerBtn');
    const hint = document.getElementById('regBirthDateHint');
    if (!textInput || !nativeInput) return;

    textInput.readOnly = false;
    textInput.removeAttribute('readonly');

    const lang = getRegistrationLocale();
    document.documentElement.lang = lang;
    textInput.lang = lang;
    nativeInput.lang = lang;
    textInput.placeholder = birthDatePlaceholder();
    textInput.setAttribute('aria-describedby', 'regBirthDateHint');
    textInput.setAttribute('inputmode', 'text');
    if (pickerBtn) pickerBtn.setAttribute('aria-label', t('Open calendar'));
    if (hint) {
        hint.textContent = isSpanishLocale()
            ? t('Format: dd/mm/aaaa. We calculate your age automatically — you must be 18 or older.')
            : t('Format: mm/dd/yyyy. We calculate your age automatically — you must be 18 or older.');
    }

    const maxDate = new Date();
    maxDate.setFullYear(maxDate.getFullYear() - 18);
    nativeInput.max = maxDate.toISOString().slice(0, 10);

    const syncTextFromNative = () => {
        if (!nativeInput.value) return;
        textInput.value = formatDisplayBirthDate(nativeInput.value);
        textInput.classList.remove('reg-field-error');
    };

    const syncNativeFromText = () => {
        const iso = parseDisplayBirthDate(textInput.value);
        if (iso) {
            nativeInput.value = iso;
            textInput.value = formatDisplayBirthDate(iso);
        }
        return iso;
    };

    const openPicker = () => {
        syncNativeFromText();
        try {
            if (typeof nativeInput.showPicker === 'function') {
                nativeInput.showPicker();
                return;
            }
        } catch (_) {
            /* fall through */
        }
        nativeInput.focus({ preventScroll: true });
        nativeInput.click();
    };

    pickerBtn?.addEventListener('click', (e) => {
        e.preventDefault();
        openPicker();
    });
    nativeInput.addEventListener('change', syncTextFromNative);
    nativeInput.addEventListener('input', syncTextFromNative);

    textInput.addEventListener('input', () => {
        const formatted = formatBirthDateInput(textInput.value);
        if (formatted !== textInput.value) {
            textInput.value = formatted;
            textInput.setSelectionRange(formatted.length, formatted.length);
        }
        textInput.classList.remove('reg-field-error');
        const iso = parseDisplayBirthDate(textInput.value);
        if (iso) nativeInput.value = iso;
    });

    textInput.addEventListener('blur', () => {
        syncNativeFromText();
    });
}

function setupPhoneCountrySelect() {
    const menu = document.getElementById('regCountryMenu');
    const btn = document.getElementById('regCountryBtn');
    const hiddenDial = document.getElementById('regPhoneDial');
    const codeEl = document.getElementById('regCountryCode');
    const flagImg = document.getElementById('regCountryFlagImg');
    if (!menu || !btn || !hiddenDial) return;

    let selected = defaultPhoneCountry();
    const lang = () => (localStorage.getItem('platform_lang') || 'es');

    const renderMenu = () => {
        menu.innerHTML = PHONE_COUNTRIES.map((c) => `
            <li class="reg-country-option" role="option" data-dial="${c.dial}" data-iso="${c.iso}" aria-selected="${c.iso === selected.iso ? 'true' : 'false'}">
                <span class="reg-country-option-dial">${c.dial}</span>
                <span class="reg-country-option-name">${getPhoneCountryName(c, lang())}</span>
            </li>`).join('');

        menu.querySelectorAll('.reg-country-option').forEach((opt) => {
            opt.addEventListener('click', () => {
                const iso = opt.getAttribute('data-iso');
                selected = PHONE_COUNTRIES.find((c) => c.iso === iso) || selected;
                menu.querySelectorAll('.reg-country-option').forEach((o) => {
                    o.setAttribute('aria-selected', o.getAttribute('data-iso') === selected.iso ? 'true' : 'false');
                });
                renderSelected();
                closeMenu();
            });
        });
    };

    const renderSelected = () => {
        hiddenDial.value = selected.dial;
        if (codeEl) codeEl.textContent = selected.dial;
        if (flagImg) {
            flagImg.src = getPhoneCountryFlagUrl(selected.iso);
            flagImg.alt = getPhoneCountryName(selected, lang());
        }
        btn.setAttribute('aria-label', `${t('Country code')} ${getPhoneCountryName(selected, lang())} ${selected.dial}`);
    };

    const closeMenu = () => {
        menu.classList.add('hidden');
        btn.setAttribute('aria-expanded', 'false');
    };

    btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const open = menu.classList.contains('hidden');
        if (open) {
            menu.classList.remove('hidden');
            btn.setAttribute('aria-expanded', 'true');
        } else {
            closeMenu();
        }
    });

    document.addEventListener('click', (e) => {
        if (!document.getElementById('regCountrySelect')?.contains(e.target)) closeMenu();
    });

    renderMenu();
    renderSelected();
}

function buildFullMobilePhone() {
    const dial = document.getElementById('regPhoneDial')?.value || '+54';
    const local = document.getElementById('regMobilePhone')?.value || '';
    return buildFullPhoneNumber(dial, local);
}

function computeAgeFromBirthDate(dateStr) {
    const dob = new Date(dateStr);
    if (Number.isNaN(dob.getTime())) return null;
    const today = new Date();
    let years = today.getFullYear() - dob.getFullYear();
    const monthDiff = today.getMonth() - dob.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < dob.getDate())) years -= 1;
    return years;
}

function validateRegistrationForm(form) {
    clearFieldErrors(form);

    if (isGuestRegistrationType()) {
        const emailEl = document.getElementById('regEmail');
        if (!emailEl || !String(emailEl.value || '').trim()) {
            highlightField(emailEl, true);
            showAlert(document.getElementById('registerAlert'), `${t('Required field missing:')} ${t('Email')}`, true, 'regEmail');
            return false;
        }
        return true;
    }

    const required = [
        { id: 'regEmail', label: t('Email') },
        { id: 'regMobilePhone', label: t('Mobile phone') },
        { id: 'regBirthDate', label: t('Birth date') },
        { id: 'regPassword', label: t('Password') },
        { id: 'regPasswordConfirm', label: t('Confirm password') }
    ];

    for (const field of required) {
        const el = document.getElementById(field.id);
        if (!el) continue;
        const empty = !String(el.value || '').trim();
        if (empty) {
            highlightField(el, true);
            showAlert(document.getElementById('registerAlert'), `${t('Required field missing:')} ${field.label}`, true, field.id);
            return false;
        }
    }

    const birthEl = document.getElementById('regBirthDate');
    const birthValue = getBirthDateIsoValue();
    const ageYears = birthValue ? computeAgeFromBirthDate(birthValue) : null;
    if (!birthValue || ageYears === null || ageYears < 18 || ageYears > 99) {
        highlightField(birthEl, true);
        showAlert(document.getElementById('registerAlert'), t('You must be at least 18 years old to register as a professional.'), true, 'regBirthDate');
        return false;
    }

    const passEl = document.getElementById('regPassword');
    if (passEl && String(passEl.value).length < 6) {
        highlightField(passEl, true);
        showAlert(document.getElementById('registerAlert'), t('Password must be at least 6 characters.'), true, 'regPassword');
        return false;
    }

    const confirmEl = document.getElementById('regPasswordConfirm');
    if (confirmEl && String(confirmEl.value).length < 6) {
        highlightField(confirmEl, true);
        showAlert(document.getElementById('registerAlert'), t('Password must be at least 6 characters.'), true, 'regPasswordConfirm');
        return false;
    }

    if (passEl && confirmEl && passEl.value !== confirmEl.value) {
        highlightField(passEl, true);
        highlightField(confirmEl, true);
        showAlert(document.getElementById('registerAlert'), t('Passwords do not match'), true, 'regPasswordConfirm');
        return false;
    }

    return true;
}

function setupInstructions(type = currentRegistrationType || 'professional') {
    const host = document.getElementById('regInstructions');
    if (!host) return;

    if (type === 'guest') {
        host.innerHTML = `
        <h3 class="gold-text" style="margin-top:0;">${t('Guest signup')}</h3>
        <p style="font-size:0.95rem;line-height:1.5;margin:0 0 12px;">${t('Email only — optional name. We send a verification code; check Spam if needed.')}</p>
        <ol style="font-size:0.9rem;margin:0 0 0 20px;line-height:1.6;padding:0;">
            <li>${t('Enter your email (alias optional).')}</li>
            <li>${t('Confirm your email with the 6-digit code we send you.')}</li>
            <li>${t('Sign in with the password we email you and browse the collection.')}</li>
        </ol>`;
        applyStaticTranslations(host);
        return;
    }

    host.innerHTML = `
        <h3 class="gold-text" style="margin-top:0;">${t('Quick registration')}</h3>
        <p style="font-size:0.95rem;line-height:1.5;margin:0 0 12px;">${t('Leave your email, phone and birth date. Our team completes your profile and uploads your photos — you do not need to do it alone.')}</p>
        <ol style="font-size:0.9rem;margin:0 0 0 20px;line-height:1.6;padding:0;">
            <li>${t('Fill in the fields below.')}</li>
            <li>${t('Confirm your email with the 6-digit code we send you.')}</li>
            <li>${t('We contact you on WhatsApp and finish the rest together.')}</li>
        </ol>
        <p style="font-size:0.88rem;margin:12px 0 0;color:#8fdfb0;line-height:1.5;">${t('We never ask you to register a payment method — no card, no automatic debit.')}</p>
        <div id="regEmailSpamWarning" style="margin-top:14px;padding:12px;background:rgba(255,193,7,0.12);border:1px solid #ffc107;border-radius:6px;">
            <strong style="color:#ffc107;">⚠️ ${t('Important — check your email')}</strong>
            <p style="font-size:0.9rem;margin:8px 0 0;color:#eee;">${t('When you submit, we send a 6-digit verification code to your email. It may arrive in Spam or Junk.')}</p>
        </div>`;
    applyStaticTranslations(host);
}

export function initProfessionalRegistration() {
    const form = document.getElementById('registerForm');
    if (!form) return;

    setupRegistrationTypePicker();
    setupBirthDateField();
    setupPhoneCountrySelect();
    setupRegistrationLeaveGuard(form);
    attachPasswordToggles(form);

    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        const alert = document.getElementById('registerAlert');
        if (!validateRegistrationForm(form)) return;

        const submitBtn = form.querySelector('button[type="submit"]');
        const originalText = submitBtn.textContent;
        submitBtn.disabled = true;
        submitBtn.textContent = t('Submitting...');

        const formData = new FormData();
        const emailValue = document.getElementById('regEmail').value.trim();
        formData.append('email', emailValue);

        if (await isEmailAlreadyRegistered(emailValue)) {
            submitBtn.disabled = false;
            submitBtn.textContent = originalText;
            redirectToLogin(emailValue);
            return;
        }

        if (isGuestRegistrationType()) {
            formData.append('role', 'user');
            formData.append('registrationMode', 'guest');
            const aliasValue = document.getElementById('regGuestAlias')?.value.trim();
            if (aliasValue) formData.append('alias', aliasValue);
        } else {
            formData.append('role', 'professional');
            formData.append('registrationMode', 'express');
            formData.append('password', document.getElementById('regPassword').value);
            formData.append('mobilePhone', buildFullMobilePhone());
            formData.append('birthDate', getBirthDateIsoValue());
        }

        try {
            const res = await fetch(`${API_URL}/auth/register`, { method: 'POST', body: formData });
            const data = await res.json();
            if (data.success) {
                window.location.href = `${appPath('verify.html')}?email=${encodeURIComponent(emailValue)}`;
            } else if (data.code === 'EMAIL_ALREADY_REGISTERED') {
                redirectToLogin(emailValue);
            } else {
                showAlert(alert, data.error || t('Registration failed'));
            }
        } catch {
            showAlert(alert, t('Server connection error'));
        } finally {
            submitBtn.disabled = false;
            submitBtn.textContent = originalText;
        }
    });

    applyStaticTranslations(form);

    window.addEventListener('beforeunload', () => {
        if (isAdminSession()) return;
        const payload = registrationTrackingPayload({ reason: 'browser_close' });
        if (!payload.hadFormData) return;
        const blob = new Blob([JSON.stringify({ event: 'abandon', ...payload })], { type: 'application/json' });
        if (typeof navigator.sendBeacon === 'function') {
            navigator.sendBeacon(`${API_URL}/public/registration-track`, blob);
        }
    });
}
