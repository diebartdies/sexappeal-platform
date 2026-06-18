import { API_URL, appPath, VERIFICATION_GESTURES } from './globals.js';
import { showAlert } from './uiHelpers.js';
import { t, applyStaticTranslations } from './i18n.js';
import { confirmDialog, wireFormLabel, setFieldInvalid } from './a11y.js';
import { setupLocationDropdowns } from './helpers.js';
import { navigateWithReturn, returnToOrigin } from './navReturn.js';
import { openFullTermsModal } from './terms.js';

const COUNTRIES = [
    'Afghanistan', 'Albania', 'Algeria', 'Argentina', 'Australia', 'Austria', 'Belgium', 'Bolivia', 'Brazil',
    'Canada', 'Chile', 'China', 'Colombia', 'Costa Rica', 'Croatia', 'Cuba', 'Czech Republic', 'Denmark',
    'Dominican Republic', 'Ecuador', 'Egypt', 'El Salvador', 'Finland', 'France', 'Germany', 'Greece',
    'Guatemala', 'Honduras', 'Hungary', 'India', 'Indonesia', 'Ireland', 'Israel', 'Italy', 'Japan',
    'Mexico', 'Netherlands', 'New Zealand', 'Nicaragua', 'Norway', 'Panama', 'Paraguay', 'Peru', 'Poland',
    'Portugal', 'Romania', 'Russia', 'South Africa', 'South Korea', 'Spain', 'Sweden', 'Switzerland',
    'Turkey', 'Ukraine', 'United Kingdom', 'United States', 'Uruguay', 'Venezuela'
].sort((a, b) => a.localeCompare(b, 'es'));

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

function bindFileInput(inputId, labelId) {
    const input = document.getElementById(inputId);
    const label = document.getElementById(labelId);
    if (!input || !label) return;
    label.textContent = t('No file chosen');
    input.addEventListener('change', () => {
        label.textContent = input.files?.[0]?.name || t('No file chosen');
    });
}

function setRegLabel(forId, key, required = false) {
    wireFormLabel(forId, key, required);
}

function registrationFormHasChanges(form) {
    if (!form) return false;
    const fields = form.querySelectorAll('input:not([type="file"]):not([type="hidden"]), select, textarea');
    for (const el of fields) {
        if (String(el.value || '').trim()) return true;
    }
    for (const el of form.querySelectorAll('input[type="file"]')) {
        if (el.files?.length) return true;
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
        intro.textContent = t('Join SexAppeal as a Living Treasure. Complete every required field and upload your verification photos. Admin review typically takes up to 48 hours.');
    }

    main.querySelectorAll('.reg-block > h4').forEach((h4) => {
        h4.textContent = t(h4.textContent.trim());
    });

    setRegLabel('regFirstName', 'Name', true);
    setRegLabel('regMiddleName', 'Middle Name');
    setRegLabel('regSurname', 'Surname', true);
    setRegLabel('regAlias', 'Alias', true);
    setRegLabel('regIdNumber', 'ID Number', true);
    setRegLabel('regBirthDate', 'Birth date', true);
    setRegLabel('regStreet', 'Street', true);
    setRegLabel('regStreetNumber', 'Number', true);
    setRegLabel('regFloor', 'Floor');
    setRegLabel('regApartment', 'Depto/Appart');
    setRegLabel('regPostCode', 'CP/PC');
    setRegLabel('regProvince', 'Province', true);
    setRegLabel('regCity', 'City / Neighborhood', true);
    setRegLabel('regOriginCountry', 'Country', true);
    setRegLabel('regEmail', 'Email', true);
    setRegLabel('regPassword', 'Password (min 6)', true);
    setRegLabel('regMobilePhone', 'Mobile phone', true);
    setRegLabel('regInstagram', 'Instagram');
    setRegLabel('regFacebook', 'Facebook');
    setRegLabel('regIdPhotoFront', 'Photo of your ID (Front)', true);
    setRegLabel('regIdPhotoBack', 'Photo of your ID (Back)', true);
    setRegLabel('regSelfiePhoto', 'Selfie holding your ID', true);

    const backBtn = document.getElementById('regBackToEntrance');
    if (backBtn) backBtn.textContent = `\u2190 ${t('Back')}`;

    const submitBtn = document.querySelector('#registerForm button[type="submit"]');
    if (submitBtn) submitBtn.textContent = t('Submit Registration');

    const footer = main.querySelector('.card > p:last-of-type');
    if (footer) {
        footer.setAttribute('data-skip-nav-return', '1');
        footer.innerHTML = `${t('Already registered?')} <button type="button" id="regLoginLink" class="reg-inline-link">${t('Login here')}</button> &nbsp;|&nbsp; <button type="button" id="regBackOrigin" class="reg-inline-link muted">${t('Back')}</button>`;
    }
}

function setupBirthDateField() {
    const input = document.getElementById('regBirthDate');
    if (!input) return;

    const lang = localStorage.getItem('platform_lang') || 'es';
    document.documentElement.lang = lang === 'es' ? 'es-AR' : 'en-US';
}

function setupCountrySelect() {
    const sel = document.getElementById('regOriginCountry');
    if (!sel) return;
    const placeholder = `<option value="">${t('Select country...')}</option>`;
    sel.innerHTML = placeholder + COUNTRIES.map((c) => `<option value="${c}">${c}</option>`).join('');
}

function validateRegistrationForm(form) {
    clearFieldErrors(form);
    const required = [
        { id: 'regFirstName', label: t('Name') },
        { id: 'regSurname', label: t('Surname') },
        { id: 'regBirthDate', label: t('Birth date') },
        { id: 'regAlias', label: t('Alias') },
        { id: 'regIdNumber', label: t('ID Number') },
        { id: 'regStreet', label: t('Street') },
        { id: 'regStreetNumber', label: t('Number') },
        { id: 'regProvince', label: t('Province') },
        { id: 'regCity', label: t('City / Neighborhood') },
        { id: 'regOriginCountry', label: t('Country') },
        { id: 'regEmail', label: t('Email') },
        { id: 'regPassword', label: t('Password') },
        { id: 'regMobilePhone', label: t('Mobile phone') },
        { id: 'regIdPhotoFront', label: t('ID Front photo'), type: 'file' },
        { id: 'regIdPhotoBack', label: t('ID Back photo'), type: 'file' },
        { id: 'regSelfiePhoto', label: t('Selfie photo'), type: 'file' }
    ];

    for (const field of required) {
        const el = document.getElementById(field.id);
        if (!el) continue;
        const empty = field.type === 'file' ? !el.files?.length : !String(el.value || '').trim();
        if (empty) {
            highlightField(el, true);
            showAlert(document.getElementById('registerAlert'), `${t('Required field missing:')} ${field.label}`, true, field.id);
            return false;
        }
    }

    // Terms & Conditions acceptance is mandatory to register.
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
    const form = document.getElementById('registerForm');
    if (!host || !form) return;

    const assignedGesture = VERIFICATION_GESTURES[Math.floor(Math.random() * VERIFICATION_GESTURES.length)];
    form.dataset.gestureCode = assignedGesture.code;

    host.innerHTML = `
        <h3 class="gold-text" style="margin-top:0;">${t('Professional registration')}</h3>
        <p style="font-size:0.95rem;line-height:1.5;">${t('To ensure the safety and authenticity of our community, please complete every mandatory field and upload the three verification photos.')}</p>
        <ol style="font-size:0.9rem;margin-left:20px;line-height:1.6;">
            <li>${t('Fill in your identity and contact details exactly as shown on your ID.')}</li>
            <li>${t('Upload clear photos of your ID (front and back).')}</li>
            <li>${t('Upload a selfie holding your ID next to your face while performing this hand position:')} <strong>${assignedGesture.emoji} ${t(assignedGesture.labelKey)}</strong></li>
            <li>${t('After admin approval, sign in and choose your category, specialties, bio, and photos from your professional dashboard.')}</li>
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
    setupCountrySelect();
    setupLocationDropdowns('regProvince', 'regCity', '', false, {});

    bindFileInput('regIdPhotoFront', 'regIdPhotoFrontLabel');
    bindFileInput('regIdPhotoBack', 'regIdPhotoBackLabel');
    bindFileInput('regSelfiePhoto', 'regSelfiePhotoLabel');

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
        formData.append('email', document.getElementById('regEmail').value.trim());
        formData.append('password', document.getElementById('regPassword').value);
        formData.append('firstName', document.getElementById('regFirstName').value.trim());
        formData.append('middleName', document.getElementById('regMiddleName').value.trim());
        formData.append('surname', document.getElementById('regSurname').value.trim());
        formData.append('alias', document.getElementById('regAlias').value.trim());
        formData.append('idNumber', document.getElementById('regIdNumber').value.trim());
        formData.append('birthDate', document.getElementById('regBirthDate').value);
        formData.append('province', document.getElementById('regProvince').value);
        formData.append('city', document.getElementById('regCity').value);
        formData.append('neighborhood', document.getElementById('regCity').value);
        formData.append('street', document.getElementById('regStreet').value.trim());
        formData.append('number', document.getElementById('regStreetNumber').value.trim());
        formData.append('floor', document.getElementById('regFloor').value.trim());
        formData.append('apartment', document.getElementById('regApartment').value.trim());
        formData.append('postalCode', document.getElementById('regPostCode').value.trim());
        formData.append('originCountry', document.getElementById('regOriginCountry').value);
        formData.append('mobilePhone', document.getElementById('regMobilePhone').value.trim());
        formData.append('instagram', document.getElementById('regInstagram').value.trim());
        formData.append('facebook', document.getElementById('regFacebook').value.trim());
        formData.append('verificationDocuments', document.getElementById('regIdPhotoFront').files[0]);
        formData.append('verificationDocuments', document.getElementById('regIdPhotoBack').files[0]);
        formData.append('verificationDocuments', document.getElementById('regSelfiePhoto').files[0]);
        if (form.dataset.gestureCode) formData.append('verificationGesture', form.dataset.gestureCode);
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
    setupRegistrationLeaveGuard(form);
}
