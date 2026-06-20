import { API_URL, appPath } from './globals.js';
import { showAlert, attachPasswordToggles } from './uiHelpers.js';
import { t, applyStaticTranslations } from './i18n.js';
import { confirmDialog, wireFormLabel, setFieldInvalid } from './a11y.js';
import { navigateWithReturn, returnToOrigin } from './navReturn.js';
import { openFullTermsModal } from './terms.js';

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

function leaveRegistration(onLeave) {
    const form = document.getElementById('registerForm');
    confirmLeaveRegistration(form).then((ok) => {
        if (!ok) return;
        if (typeof onLeave === 'function') {
            onLeave();
            return;
        }
        returnToOrigin(() => { window.location.href = appPath('index.html'); });
    });
}

function setupRegistrationLeaveGuard(form) {
    const backBtn = document.getElementById('regBackToEntrance');
    if (backBtn) {
        backBtn.textContent = `\u2190 ${t('Back')}`;
        backBtn.onclick = () => leaveRegistration();
    }

    document.getElementById('regLoginLink')?.addEventListener('click', () => {
        leaveRegistration(() => {
            navigateWithReturn(appPath('login.html'));
        });
    });

    document.getElementById('regBackOrigin')?.addEventListener('click', () => {
        leaveRegistration();
    });

    const topBack = document.querySelector('.left-group-back');
    if (topBack && !topBack.dataset.regLeaveBound) {
        topBack.dataset.regLeaveBound = '1';
        topBack.onclick = () => leaveRegistration();
    }

    const brandLogo = document.querySelector('.brand-logo');
    if (brandLogo && !brandLogo.dataset.regLeaveBound) {
        brandLogo.dataset.regLeaveBound = '1';
        brandLogo.addEventListener('click', (e) => {
            e.preventDefault();
            leaveRegistration();
        });
    }
}

function applyRegistrationPageLabels() {
    const main = document.getElementById('registerMain');
    if (!main) return;

    document.title = `SexAppeal - ${t('Professional Registration')}`;

    const h1 = main.querySelector(':scope > h1');
    if (h1) h1.textContent = t('Professional Registration');

    const intro = main.querySelector(':scope > p');
    if (intro) {
        intro.textContent = t('Quick signup — only what you need to get started. We will help you complete your profile and photos.');
    }

    setRegLabel('regEmail', 'Email', true);
    setRegLabel('regMobilePhone', 'Mobile phone', true);
    setRegLabel('regBirthDate', 'Birth date', true);
    setRegLabel('regPassword', 'Password (min 6)', true);
    setRegLabel('regPasswordConfirm', 'Confirm password', true);

    const backBtn = document.getElementById('regBackToEntrance');
    if (backBtn) backBtn.textContent = `\u2190 ${t('Back')}`;

    const submitBtn = document.querySelector('#registerForm button[type="submit"]');
    if (submitBtn) submitBtn.textContent = t('Submit Registration');

    const footer = main.querySelector('.card > p:last-of-type');
    if (footer) {
        footer.setAttribute('data-skip-nav-return', '1');
        footer.innerHTML = `${t('Already registered?')} <button type="button" id="regLoginLink" class="reg-inline-link">${t('Login here')}</button> &nbsp;|&nbsp; <button type="button" id="regBackOrigin" class="reg-inline-link muted">${t('Back')}</button>`;
    }

    const phoneHint = main.querySelector('#regMobilePhone + .reg-hint');
    if (phoneHint) phoneHint.textContent = t('WhatsApp number — we will contact you here to finish your profile.');

    const passHint = main.querySelector('#regPassword + .reg-hint');
    if (passHint) passHint.textContent = t('To sign in to your panel after email verification.');

    const birthHint = main.querySelector('#regBirthDate')?.closest('.form-group')?.querySelector('.reg-hint');
    if (birthHint) birthHint.textContent = t('We calculate your age automatically — you must be 18 or older.');
}

function setupBirthDateField() {
    const input = document.getElementById('regBirthDate');
    if (!input) return;
    const lang = localStorage.getItem('platform_lang') || 'es';
    document.documentElement.lang = lang === 'es' ? 'es-AR' : 'en-US';
    const maxDate = new Date();
    maxDate.setFullYear(maxDate.getFullYear() - 18);
    input.max = maxDate.toISOString().slice(0, 10);
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
    const birthValue = birthEl?.value?.trim();
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

    const termsCheckbox = document.getElementById('regTermsAccept');
    if (termsCheckbox && !termsCheckbox.checked) {
        showAlert(document.getElementById('registerAlert'), t('You must accept the terms and conditions to register.'), true, 'regTermsAccept');
        termsCheckbox.focus();
        return false;
    }

    return true;
}

function setupInstructions() {
    const host = document.getElementById('regInstructions');
    if (!host) return;

    host.innerHTML = `
        <h3 class="gold-text" style="margin-top:0;">${t('Quick registration')}</h3>
        <p style="font-size:0.95rem;line-height:1.5;margin:0 0 12px;">${t('Leave your email, phone and birth date. Our team completes your profile and uploads your photos — you do not need to do it alone.')}</p>
        <ol style="font-size:0.9rem;margin:0 0 0 20px;line-height:1.6;padding:0;">
            <li>${t('Fill in the fields below.')}</li>
            <li>${t('Confirm your email with the 6-digit code we send you.')}</li>
            <li>${t('We contact you on WhatsApp and finish the rest together.')}</li>
        </ol>
        <div id="regEmailSpamWarning" style="margin-top:14px;padding:12px;background:rgba(255,193,7,0.12);border:1px solid #ffc107;border-radius:6px;">
            <strong style="color:#ffc107;">⚠️ ${t('Important — check your email')}</strong>
            <p style="font-size:0.9rem;margin:8px 0 0;color:#eee;">${t('When you submit, we send a 6-digit verification code to your email. It may arrive in Spam or Junk.')}</p>
        </div>`;
    applyStaticTranslations(host);
}

export function initProfessionalRegistration() {
    const form = document.getElementById('registerForm');
    if (!form) return;

    applyRegistrationPageLabels();
    setupInstructions();
    setupBirthDateField();
    setupRegistrationLeaveGuard(form);
    attachPasswordToggles(form);

    const termsLink = document.getElementById('regTermsLink');
    if (termsLink && !termsLink.dataset.bound) {
        termsLink.dataset.bound = '1';
        termsLink.addEventListener('click', () => openFullTermsModal(termsLink));
    }

    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        const alert = document.getElementById('registerAlert');
        if (!validateRegistrationForm(form)) return;

        if (!(await confirmDialog(t('When you submit, we will email you a 6-digit verification code. Check your inbox AND your Spam/Junk folder — our emails often land there. Continue?')))) return;

        const submitBtn = form.querySelector('button[type="submit"]');
        const originalText = submitBtn.textContent;
        submitBtn.disabled = true;
        submitBtn.textContent = t('Submitting...');

        const formData = new FormData();
        formData.append('role', 'professional');
        formData.append('registrationMode', 'express');
        formData.append('email', document.getElementById('regEmail').value.trim());
        formData.append('password', document.getElementById('regPassword').value);
        formData.append('mobilePhone', document.getElementById('regMobilePhone').value.trim());
        formData.append('birthDate', document.getElementById('regBirthDate').value);
        formData.append('termsAccepted', document.getElementById('regTermsAccept')?.checked ? 'true' : 'false');

        try {
            const res = await fetch(`${API_URL}/auth/register`, { method: 'POST', body: formData });
            const data = await res.json();
            if (data.success) {
                window.location.href = `${appPath('verify.html')}?email=${encodeURIComponent(document.getElementById('regEmail').value.trim())}`;
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
    applyRegistrationPageLabels();
}
