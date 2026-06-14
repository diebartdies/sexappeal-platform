import { API_URL, BASE_ORIGIN, GOOGLE_CLIENT_ID, appPath } from './globals.js';
import { showAlert } from './uiHelpers.js';
import { t, applyStaticTranslations } from './i18n.js';
import { openInlinePasswordRecovery, initRecoverPage, bindForgotPasswordTriggers } from './passwordRecovery.js';
import { pushReturnPoint, clearReturnStack } from './navReturn.js';

function redirectAfterLogin(user) {
    let intended = sessionStorage.getItem('intended_destination');
    sessionStorage.removeItem('intended_destination');

    if (intended && intended.includes('dashboard.html') && user.role === 'user') {
        intended = null;
    }

    if (intended) {
        window.location.replace(intended);
    } else if (user.role === 'professional') {
        if (user.allowResubmission) {
            window.location.replace(appPath('profDashboard.html'));
        } else if (user.professionalProfile?.alias) {
            window.location.replace('/perfil/' + encodeURIComponent(user.professionalProfile.alias));
        } else {
            window.location.replace(appPath('profDashboard.html'));
        }
    } else if (user.role === 'admin') {
        window.location.replace(appPath('dashboard.html'));
    } else {
        window.location.replace(appPath('categories.html'));
    }
}

function showLoginFailure(alert, data, email) {
    if (!alert) return;

    alert.classList.remove('hidden');
    alert.style.color = 'var(--accent-red)';

    if (data.code === 'USER_NOT_FOUND') {
        alert.innerHTML = `
            <p><strong>${t('No account found with this email address.')}</strong></p>
            <p style="margin-top:8px;font-size:0.92rem;">${t('Did you mistype your email? Check it and try again, or register as a professional.')}</p>
            <div class="login-error-actions">
                <button type="button" data-login-retry="email">${t('Try again')}</button>
                <a href="${appPath('register.html')}">${t('Professional Registration')}</a>
            </div>
        `;
        alert.querySelector('[data-login-retry="email"]')?.addEventListener('click', () => {
            alert.classList.add('hidden');
            alert.textContent = '';
            const emailInput = document.getElementById('email');
            if (emailInput) {
                emailInput.focus();
                emailInput.select();
            }
        });
        return;
    }

    if (data.code === 'INVALID_PASSWORD') {
        alert.innerHTML = `
            <p><strong>${t('Incorrect password. Please try again.')}</strong></p>
            <div class="login-error-actions">
                <button type="button" data-login-retry="password">${t('Try again')}</button>
                <button type="button" data-login-forgot>${t('I forgot my password')}</button>
            </div>
        `;
        alert.querySelector('[data-login-retry="password"]')?.addEventListener('click', () => {
            alert.classList.add('hidden');
            alert.textContent = '';
            const passwordInput = document.getElementById('password');
            if (passwordInput) {
                passwordInput.value = '';
                passwordInput.focus();
            }
        });
        alert.querySelector('[data-login-forgot]')?.addEventListener('click', () => {
            const email = document.getElementById('email')?.value.trim() || '';
            alert.classList.add('hidden');
            openInlinePasswordRecovery(email);
        });
        return;
    }

    showAlert(alert, t(data.error || 'Access Denied'));
}

async function submitLoginForm(e) {
    e.preventDefault();
    const email = document.getElementById('email')?.value.trim();
    const password = document.getElementById('password')?.value;
    const alert = document.getElementById('loginAlert');
    if (alert) {
        alert.textContent = '';
        alert.innerHTML = '';
    }

    try {
        const res = await fetch(`${API_URL}/auth/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, password })
        });
        const data = await res.json();
        if (data.success) {
            localStorage.setItem('token', data.token);
            localStorage.setItem('is18Plus', 'true');
            sessionStorage.setItem('valid_entry', 'true');
            if (data.user) localStorage.setItem('user', JSON.stringify(data.user));
            redirectAfterLogin(data.user);
        } else if (data.error && data.error.includes('verify your email')) {
            window.location.href = `${appPath('verify.html')}?email=${encodeURIComponent(email)}`;
        } else {
            showLoginFailure(alert, data, email);
        }
    } catch (err) {
        showAlert(alert, t('Server connection error'));
    }
}

export function injectGoogleLogin(container) {
    if (!container) return;
    
    if (!document.getElementById('google-jssdk')) {
        const script = document.createElement('script');
        script.id = 'google-jssdk';
        script.src = 'https://accounts.google.com/gsi/client';
        script.async = true;
        script.defer = true;
        document.head.appendChild(script);
    }

    const wrapper = document.createElement('div');
    wrapper.id = 'googleSignInWrapper';
    wrapper.style.marginBottom = '20px';
    wrapper.style.display = 'flex';
    wrapper.style.justifyContent = 'center';
    
    container.parentNode.insertBefore(wrapper, container);

    window.handleGoogleCallback = async (response) => {
        try {
            const res = await fetch(`${API_URL}/auth/google`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ token: response.credential })
            });
            const data = await res.json();
            if (data.success) {
                localStorage.setItem('token', data.token);
                localStorage.setItem('is18Plus', 'true');
                sessionStorage.setItem('valid_entry', 'true');
                if (data.user) localStorage.setItem('user', JSON.stringify(data.user));
                
                let intended = sessionStorage.getItem('intended_destination');
                sessionStorage.removeItem('intended_destination');

                // Prevent regular users from being forced into the dashboard by a stale intended_destination
                if (intended && intended.includes('dashboard.html') && data.user.role === 'user') {
                    intended = null;
                }

                if (intended) {
                    window.location.replace(intended);
                } else if (data.user.role === 'professional') {
                    window.location.replace('/perfil/' + encodeURIComponent(data.user.professionalProfile?.alias || ''));
                } else if (data.user.role === 'admin') {
                    window.location.replace('/dashboard.html');
                } else {
                    window.location.replace('/categories.html');
                }
            } else {
                showAlert(document.getElementById('loginAlert'), t(data.error || 'Google login failed'));
            }
        } catch (err) {
            showAlert(document.getElementById('loginAlert'), t('Server connection error'));
        }
    };

    const checkGoogle = setInterval(() => {
        if (window.google) {
            clearInterval(checkGoogle);
            window.google.accounts.id.initialize({
                client_id: GOOGLE_CLIENT_ID,
                callback: window.handleGoogleCallback
            });
            window.google.accounts.id.renderButton(
                document.getElementById('googleSignInWrapper'),
                { theme: 'outline', size: 'large', width: container.offsetWidth || 300 }
            );
        }
    }, 100);
}

const LANDING_ENTER_LABEL = 'I AM +18 - ENTER';

export function resetLandingEnterButton() {
    const btn = document.getElementById('btn-enter');
    if (!btn) return;
    btn.textContent = t(LANDING_ENTER_LABEL);
    btn.style.pointerEvents = '';
    btn.style.opacity = '';
    btn.disabled = false;
}

export function setupLandingPageAgeGate() {
window.addEventListener('pageshow', () => {
    if (!document.getElementById('landing')) return;
    document.documentElement.classList.remove('page-pending');
    resetLandingEnterButton();
    applyStaticTranslations(document.getElementById('landing') || document.body);
});

// Runs in the "Capture" phase to override ANY inline onclick attributes (e.g. onclick="window.location...")
// that might be redirecting the page before the JS age-gate token is safely saved.
document.addEventListener('click', (e) => {
    const path = window.location.pathname;
    if (path.endsWith('/') || path.endsWith('index.html')) {
        let btn = e.target.closest('button, a, [class*="btn"], [id*="btn"], [onclick]');
        
        // Fallback: Catch clicks on custom text wrappers like <div>I AM +18 - ENTER</div>
        if (!btn && e.target.textContent) {
            const t = e.target.textContent.toLowerCase();
            if (t.includes('18') || t.includes('enter') || t.includes('entrar')) {
                btn = e.target;
            }
        }

        if (!btn) return;

        const text = (btn.textContent || '').toLowerCase();
        const href = (btn.getAttribute('href') || '').toLowerCase();
        const onclickAttr = (btn.getAttribute('onclick') || '').toLowerCase();
        
        // Explicitly ignore Login and Register links so they continue to work natively
        if (href.includes('login') || href.includes('register') || href.includes('recover') ||
            text.includes('login') || text.includes('register') || text.includes('iniciar') ||
            text.includes('registrarse') || text.includes('forgot') || text.includes('olvid') ||
            btn.closest('#loginForm') || btn.closest('.landing-login-card')) {
            return;
        }

        const isEnterBtn = btn.id === 'btn-enter' || btn.id === 'btn-18-plus' || btn.id === 'btn-18' ||
                           text.includes('18') || text.includes('enter') || text.includes('entrar') || text.includes('i am +18') ||
                           href.includes('categories.html') || onclickAttr.includes('categories.html') || onclickAttr.includes('location.href');
                           
        if (isEnterBtn) {
            e.preventDefault();
            e.stopImmediatePropagation(); // Crucial: Stops any inline HTML onclick from firing

            if (window.location.protocol === 'file:') {
                alert(`ERROR: You must open the site via a local server (e.g., ${BASE_ORIGIN}). The buttons will not work if you double-click the HTML file!`);
                return;
            }

            // Only alter text if the button isn't exclusively an image/SVG
            if (!btn.innerHTML.includes('<img') && !btn.innerHTML.includes('<svg')) {
                btn.textContent = t('Entering...');
            }
            btn.style.pointerEvents = 'none';
            btn.style.opacity = '0.7';

            localStorage.setItem('is18Plus', 'true');
            sessionStorage.setItem('ancestor_code', 'index.html');
            sessionStorage.setItem('valid_entry', 'true');

            const intended = sessionStorage.getItem('intended_destination');
            if (intended) {
                sessionStorage.removeItem('intended_destination');
                pushReturnPoint();
                window.location.href = intended;
            } else {
                const targetUrl = (btn.getAttribute('href') && btn.getAttribute('href') !== '#' && !href.startsWith('javascript'))
                    ? appPath(btn.getAttribute('href'))
                    : appPath('categories.html');
                pushReturnPoint();
                window.location.href = targetUrl;
            }
        }
        
        const isExitBtn = btn.id === 'btn-exit' || text.includes('exit') || text.includes('salir') || href.includes('google.com');
        if (isExitBtn) {
            e.preventDefault();
            e.stopImmediatePropagation();
            window.location.href = 'https://www.google.com';
        }
    }
}, true); // <-- The "true"
}

export function initAuthForms() {
document.addEventListener('DOMContentLoaded', () => {
    const loginForm = document.getElementById('loginForm');
    if (loginForm) {
        const isDedicatedLoginPage = window.location.pathname.endsWith('login.html');

        if (isDedicatedLoginPage) {
            const blogReminder = document.createElement('div');
            blogReminder.innerHTML = `
                <p style="text-align: center; color: var(--primary-gold); background-color: rgba(212, 175, 55, 0.1); padding: 10px; border-radius: 4px; border: 1px solid var(--primary-gold); margin-bottom: 20px;">
                    <strong>${t('Coming Soon:')}</strong> ${t('Users will be able to post their experiences on our new community blog!')}
                </p>
            `;
            loginForm.parentNode.insertBefore(blogReminder, loginForm);
            injectGoogleLogin(loginForm);
        }

        loginForm.addEventListener('submit', submitLoginForm);
    }

    document.getElementById('landingFocusLogin')?.addEventListener('click', () => {
        document.getElementById('email')?.focus();
    });

    bindForgotPasswordTriggers();
    initRecoverPage();
});
}

// Register — handled in registerProfessional.js

// Verify
const verifyForm = document.getElementById('verifyForm');
if (verifyForm) {
    // Extract email from URL parameters
    const urlParams = new URLSearchParams(window.location.search);
    const emailFromUrl = urlParams.get('email');
    const emailInput = document.getElementById('verifyEmail');

    // Auto-fill the email input if it exists and we have it in the URL
    if (emailInput && emailFromUrl) {
        emailInput.value = emailFromUrl;
    }

    verifyForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        // Use the input value if it exists, otherwise fall back to the URL parameter
        const email = (emailInput && emailInput.value) ? emailInput.value.trim() : new URLSearchParams(window.location.search).get('email');
        const code = document.getElementById('verifyCode') ? document.getElementById('verifyCode').value : '';
        const alert = document.getElementById('verifyAlert');

        try {
            const res = await fetch(`${API_URL}/auth/verify-email`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, code })
            });
            const data = await res.json();
            if (data.success) {
                localStorage.setItem('token', data.token);
                localStorage.setItem('is18Plus', 'true');
                sessionStorage.setItem('valid_entry', 'true');
                if (data.user) localStorage.setItem('user', JSON.stringify(data.user));
                
                let intended = sessionStorage.getItem('intended_destination');
                sessionStorage.removeItem('intended_destination');

                // Prevent regular users from being forced into the dashboard by a stale intended_destination
                if (intended && intended.includes('dashboard.html') && data.user.role === 'user') {
                    intended = null;
                }

                if (intended) {
                    window.location.replace(intended);
                } else if (data.user.role === 'professional') {
                    window.location.replace('/profDashboard.html');
                } else if (data.user.role === 'admin') {
                    window.location.replace('/dashboard.html');
                } else {
                    window.location.replace('/categories.html');
                }
            } else {
                showAlert(alert, data.error || 'Invalid code');
            }
        } catch (err) {
            showAlert(alert, 'Server connection error');
        }
    });
}

// Logout
const logoutBtn = document.getElementById('logoutBtn');
if (logoutBtn) {
    logoutBtn.addEventListener('click', async (e) => {
        e.preventDefault();
        try {
            const token = localStorage.getItem('token');
            if (token) {
                await fetch(`${API_URL}/auth/logout`, {
                    method: 'POST',
                    headers: { 
                        'Authorization': `Bearer ${token}`
                    },
                    credentials: 'include'
                });
            }
        } catch (err) {
            console.error('Logout error:', err);
        } finally {
            document.cookie = "token=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;";
            localStorage.removeItem('token');
            localStorage.removeItem('user');
            localStorage.removeItem('is18Plus');
            clearReturnStack();
            window.location.href = appPath('index.html');
        }
    });
}
