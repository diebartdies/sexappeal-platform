import { API_URL } from './globals.js';
import { t } from './i18n.js';
import { showAlert } from './uiHelpers.js';

let cachedClientId = null;

async function resolveGoogleClientId() {
    if (cachedClientId !== null) return cachedClientId;
    try {
        const res = await fetch(`${API_URL}/public/client-config`);
        const data = await res.json();
        cachedClientId = data.success && data.data?.googleClientId
            ? String(data.data.googleClientId).trim()
            : '';
    } catch {
        cachedClientId = '';
    }
    return cachedClientId;
}

function loadGoogleSdk() {
    if (document.getElementById('google-jssdk')) return Promise.resolve();
    return new Promise((resolve, reject) => {
        const script = document.createElement('script');
        script.id = 'google-jssdk';
        script.src = 'https://accounts.google.com/gsi/client';
        script.async = true;
        script.defer = true;
        script.onload = () => resolve();
        script.onerror = () => reject(new Error('Google SDK failed to load'));
        document.head.appendChild(script);
    });
}

function waitForGoogle() {
    return new Promise((resolve) => {
        if (window.google?.accounts?.id) {
            resolve();
            return;
        }
        const timer = setInterval(() => {
            if (window.google?.accounts?.id) {
                clearInterval(timer);
                resolve();
            }
        }, 100);
        setTimeout(() => {
            clearInterval(timer);
            resolve();
        }, 8000);
    });
}

async function handleGoogleCredential(credential, alertEl, onSuccess, intent) {
    try {
        const res = await fetch(`${API_URL}/auth/google`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            credentials: 'include',
            body: JSON.stringify({ token: credential, intent })
        });
        const data = await res.json();
        if (data.success && data.token) {
            localStorage.setItem('token', data.token);
            localStorage.setItem('is18Plus', 'true');
            sessionStorage.setItem('valid_entry', 'true');
            if (data.user) localStorage.setItem('user', JSON.stringify(data.user));
            if (typeof onSuccess === 'function') {
                onSuccess(data.user || {});
            }
            return;
        }
        showAlert(alertEl, t(data.error || 'Google login failed'));
    } catch {
        showAlert(alertEl, t('Server connection error'));
    }
}

/**
 * Mount Google Sign-In before a form (login or registration).
 * No-op when GOOGLE_CLIENT_ID is not configured on the server.
 */
export async function mountGoogleSignIn({
    insertBefore,
    alertEl,
    onSuccess,
    width,
    intent = 'login',
    dividerKey = 'or sign in with email'
} = {}) {
    if (!insertBefore || insertBefore.dataset.googleMounted === '1') return;

    const clientId = await resolveGoogleClientId();
    if (!clientId) return;

    insertBefore.dataset.googleMounted = '1';

    const block = document.createElement('div');
    block.className = 'google-signin-block';
    block.innerHTML = `
        <div class="google-signin-wrapper"></div>
        <p class="google-signin-divider">${t(dividerKey)}</p>
    `;
    insertBefore.parentNode.insertBefore(block, insertBefore);

    try {
        await loadGoogleSdk();
        await waitForGoogle();
    } catch {
        block.remove();
        insertBefore.dataset.googleMounted = '0';
        return;
    }

    const wrapper = block.querySelector('.google-signin-wrapper');
    const btnWidth = width || insertBefore.offsetWidth || 300;

    window.handleGoogleCallback = (response) => {
        handleGoogleCredential(response.credential, alertEl, onSuccess, intent);
    };

    window.google.accounts.id.initialize({
        client_id: clientId,
        callback: window.handleGoogleCallback
    });
    window.google.accounts.id.renderButton(wrapper, {
        theme: 'outline',
        size: 'large',
        width: Math.min(Math.max(btnWidth, 240), 400),
        text: 'signin_with',
        locale: (localStorage.getItem('platform_lang') || 'es') === 'es' ? 'es' : 'en'
    });
}
