import { API_URL, appPath } from './globals.js';
import { showAlert, attachPasswordToggles } from './uiHelpers.js';
import { t } from './i18n.js';

let inlinePanel = null;
let activeEmail = '';

function recoveryMarkup() {
    return `
        <div id="passwordRecoveryPanel" class="password-recovery-panel hidden">
            <div id="recoveryStepEmail">
                <p class="recovery-step-text">${t('Confirm your email to receive a recovery code.')}</p>
                <div id="recoveryAlert" class="alert hidden"></div>
                <input type="email" id="recoveryEmail" placeholder="${t('Email Address')}" required autocomplete="username">
                <button type="button" id="recoverySendCodeBtn" class="landing-btn landing-btn-login">${t('Send recovery code')}</button>
            </div>
            <div id="recoveryStepReset" class="hidden">
                <p class="recovery-step-text">${t('Recovery code sent to:')}</p>
                <p id="recoveryDisplayEmail" class="gold-text recovery-email-display"></p>
                <input type="hidden" id="recoveryHiddenEmail">
                <input type="text" id="recoveryCode" placeholder="${t('6-Digit Code')}" required maxlength="6" inputmode="numeric" autocomplete="one-time-code" class="recovery-code-input">
                <input type="password" id="recoveryNewPassword" placeholder="${t('New Password (Min 6 chars)')}" required minlength="6" autocomplete="new-password">
                <input type="password" id="recoveryConfirmPassword" placeholder="${t('Confirm Password')}" required minlength="6" autocomplete="new-password">
                <button type="button" id="recoverySubmitBtn" class="landing-btn landing-btn-login">${t('Reset Password')}</button>
            </div>
            <button type="button" id="recoveryBackToLoginBtn" class="recovery-back-btn">${t('Back to login')}</button>
        </div>
    `;
}

function getLoginShell() {
    return {
        card: document.querySelector('.landing-login-card') || document.getElementById('loginForm')?.closest('.card'),
        loginForm: document.getElementById('loginForm'),
        loginHeading: document.querySelector('.landing-login-heading'),
        loginSub: document.querySelector('.landing-login-sub'),
        forgotBlock: document.querySelector('.landing-forgot'),
        proLinks: document.querySelector('.landing-pro-links'),
        loginAlert: document.getElementById('loginAlert')
    };
}

function hideLoginShell(shell) {
    shell.loginForm?.classList.add('hidden');
    shell.loginHeading?.classList.add('hidden');
    shell.loginSub?.classList.add('hidden');
    shell.forgotBlock?.classList.add('hidden');
    shell.proLinks?.classList.add('hidden');
    shell.loginAlert?.classList.add('hidden');
}

function showLoginShell(shell) {
    shell.loginForm?.classList.remove('hidden');
    shell.loginHeading?.classList.remove('hidden');
    shell.loginSub?.classList.remove('hidden');
    shell.forgotBlock?.classList.remove('hidden');
    shell.proLinks?.classList.remove('hidden');
    inlinePanel?.classList.add('hidden');
    if (shell.loginHeading) shell.loginHeading.textContent = t('Professional Login');
}

function ensureInlinePanel(shell) {
    if (inlinePanel && inlinePanel.isConnected) return inlinePanel;

    shell.card.insertAdjacentHTML('beforeend', recoveryMarkup());
    inlinePanel = document.getElementById('passwordRecoveryPanel');
    bindInlineRecoveryEvents(shell);
    return inlinePanel;
}

function showRecoveryStep(step) {
    document.getElementById('recoveryStepEmail')?.classList.toggle('hidden', step !== 'email');
    document.getElementById('recoveryStepReset')?.classList.toggle('hidden', step !== 'reset');
}

async function sendRecoveryCode(email, alertEl) {
    const res = await fetch(`${API_URL}/auth/forgotpassword`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email })
    });
    const data = await res.json();
    if (!data.success) {
        showAlert(alertEl, t(data.error || 'Error sending code'));
        return false;
    }
    return true;
}

async function submitPasswordReset(email, code, password, confirmPassword, alertEl) {
    if (password !== confirmPassword) {
        showAlert(alertEl, t('Passwords do not match'));
        return false;
    }
    if (password.length < 6) {
        showAlert(alertEl, t('Password must be at least 6 characters'));
        return false;
    }

    const res = await fetch(`${API_URL}/auth/resetpassword`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, code, password })
    });
    const data = await res.json();
    if (!data.success) {
        showAlert(alertEl, t(data.error || 'Reset failed'));
        return false;
    }
    return true;
}

function bindInlineRecoveryEvents(shell) {
    const panel = document.getElementById('passwordRecoveryPanel');
    if (!panel || panel.dataset.bound === '1') return;
    panel.dataset.bound = '1';

    document.getElementById('recoverySendCodeBtn')?.addEventListener('click', async () => {
        const emailInput = document.getElementById('recoveryEmail');
        const alertEl = document.getElementById('recoveryAlert');
        const email = emailInput?.value.trim();
        if (!email) {
            showAlert(alertEl, t('Please provide an email address'));
            emailInput?.focus();
            return;
        }
        alertEl?.classList.add('hidden');
        const btn = document.getElementById('recoverySendCodeBtn');
        if (btn) btn.disabled = true;
        try {
            const ok = await sendRecoveryCode(email, alertEl);
            if (ok) {
                activeEmail = email;
                document.getElementById('recoveryHiddenEmail').value = email;
                document.getElementById('recoveryDisplayEmail').textContent = email;
                showRecoveryStep('reset');
                attachPasswordToggles(document.getElementById('recoveryStepReset'));
                document.getElementById('recoveryCode')?.focus();
            }
        } catch (err) {
            showAlert(alertEl, t('Server connection error'));
        } finally {
            if (btn) btn.disabled = false;
        }
    });

    document.getElementById('recoverySubmitBtn')?.addEventListener('click', async () => {
        const alertEl = document.getElementById('recoveryAlert');
        const email = document.getElementById('recoveryHiddenEmail')?.value.trim() || activeEmail;
        const code = document.getElementById('recoveryCode')?.value.trim();
        const password = document.getElementById('recoveryNewPassword')?.value || '';
        const confirmPassword = document.getElementById('recoveryConfirmPassword')?.value || '';
        alertEl?.classList.add('hidden');

        const btn = document.getElementById('recoverySubmitBtn');
        if (btn) btn.disabled = true;
        try {
            const ok = await submitPasswordReset(email, code, password, confirmPassword, alertEl);
            if (ok) {
                showAlert(alertEl, t('Password reset successful!'), false);
                setTimeout(() => closeInlinePasswordRecovery(), 1800);
            }
        } catch (err) {
            showAlert(alertEl, t('Server connection error'));
        } finally {
            if (btn) btn.disabled = false;
        }
    });

    document.getElementById('recoveryBackToLoginBtn')?.addEventListener('click', () => {
        closeInlinePasswordRecovery();
    });
}

export function openInlinePasswordRecovery(prefillEmail = '') {
    const shell = getLoginShell();
    if (!shell.card) {
        const q = prefillEmail ? `?email=${encodeURIComponent(prefillEmail)}` : '';
        window.location.href = appPath(`recover.html${q}`);
        return;
    }

    ensureInlinePanel(shell);
    hideLoginShell(shell);

    if (shell.loginHeading) shell.loginHeading.textContent = t('Recover Access');
    shell.loginHeading?.classList.remove('hidden');

    inlinePanel.classList.remove('hidden');
    showRecoveryStep('email');

    const emailInput = document.getElementById('recoveryEmail');
    const alertEl = document.getElementById('recoveryAlert');
    alertEl?.classList.add('hidden');
    alertEl && (alertEl.textContent = '');

    if (emailInput) {
        emailInput.value = prefillEmail || document.getElementById('email')?.value.trim() || '';
        emailInput.focus();
        if (emailInput.value) emailInput.select();
    }

    ['recoveryCode', 'recoveryNewPassword', 'recoveryConfirmPassword'].forEach((id) => {
        const el = document.getElementById(id);
        if (el) el.value = '';
    });
}

export function closeInlinePasswordRecovery() {
    const shell = getLoginShell();
    showLoginShell(shell);
    if (inlinePanel) {
        inlinePanel.remove();
        inlinePanel = null;
    }
    activeEmail = '';
}

export function initRecoverPage() {
    const forgotForm = document.getElementById('forgotPasswordForm');
    const resetForm = document.getElementById('resetPasswordForm');
    if (!forgotForm && !resetForm) return;
    if (document.body.dataset.recoverBound === '1') return;
    document.body.dataset.recoverBound = '1';

    const params = new URLSearchParams(window.location.search);
    const emailFromUrl = params.get('email');
    const forgotEmail = document.getElementById('forgotEmail');
    if (forgotEmail && emailFromUrl) forgotEmail.value = emailFromUrl;

    forgotForm?.addEventListener('submit', async (e) => {
        e.preventDefault();
        const email = document.getElementById('forgotEmail')?.value.trim();
        const alert = document.getElementById('forgotAlert');
        try {
            const ok = await sendRecoveryCode(email, alert);
            if (ok) {
                activeEmail = email;
                forgotForm.classList.add('hidden');
                resetForm?.classList.remove('hidden');
                document.getElementById('resetEmail').value = email;
                document.getElementById('displayEmail').textContent = email;
                attachPasswordToggles(resetForm);
                document.getElementById('resetCode')?.focus();
            }
        } catch (err) {
            showAlert(alert, t('Server connection error'));
        }
    });

    resetForm?.addEventListener('submit', async (e) => {
        e.preventDefault();
        const email = document.getElementById('resetEmail')?.value.trim();
        const code = document.getElementById('resetCode')?.value.trim();
        const password = document.getElementById('resetNewPassword')?.value || '';
        const confirmPassword = document.getElementById('resetConfirmPassword')?.value || '';
        const alert = document.getElementById('resetAlert');

        try {
            const ok = await submitPasswordReset(email, code, password, confirmPassword, alert);
            if (ok) {
                showAlert(alert, t('Password reset successful!'), false);
                setTimeout(() => { window.location.href = appPath('index.html'); }, 2000);
            }
        } catch (err) {
            showAlert(alert, t('Server connection error'));
        }
    });

    attachPasswordToggles(resetForm || document);
}

export function bindForgotPasswordTriggers() {
    document.querySelectorAll('[data-open-password-recovery]').forEach((el) => {
        el.addEventListener('click', (e) => {
            e.preventDefault();
            const email = document.getElementById('email')?.value.trim() || '';
            openInlinePasswordRecovery(email);
        });
    });
}
