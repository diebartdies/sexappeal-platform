import { t } from './i18n.js';

export function showAlert(element, message, isError = true) {
    if (!element) return; // Safeguard if element is not found
    element.textContent = message;
    element.classList.remove('hidden');
    element.style.color = isError ? 'var(--accent-red)' : '#00ff00';
}

export function attachPasswordToggles(root = document) {
    const passwordInputs = root.querySelectorAll('input[type="password"]');
    passwordInputs.forEach((input) => {
        if (input.parentElement?.classList.contains('password-wrapper')) return;

        const wrapper = document.createElement('div');
        wrapper.className = 'password-wrapper';
        input.parentNode.insertBefore(wrapper, input);
        wrapper.appendChild(input);

        const toggleBtn = document.createElement('button');
        toggleBtn.type = 'button';
        toggleBtn.className = 'password-toggle';
        toggleBtn.setAttribute('aria-label', 'Toggle password visibility');
        const eyeOn = `<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#999" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path><circle cx="12" cy="12" r="3"></circle></svg>`;
        const eyeOff = `<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#999" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"></path><line x1="1" y1="1" x2="23" y2="23"></line></svg>`;
        toggleBtn.innerHTML = eyeOn;

        toggleBtn.addEventListener('click', () => {
            if (input.type === 'password') {
                input.type = 'text';
                toggleBtn.innerHTML = eyeOff;
            } else {
                input.type = 'password';
                toggleBtn.innerHTML = eyeOn;
            }
        });
        wrapper.appendChild(toggleBtn);
    });
}

export function getPendingApprovalBannerHtml() {
    return `<div style="background: rgba(255,165,0,0.12); border: 1px solid orange; border-left: 4px solid orange; padding: 15px 18px; margin-bottom: 20px; border-radius: 6px; line-height: 1.5;">
        <strong style="color: orange; display: block; margin-bottom: 6px;">⏳ ${t('Pending Admin Approval')}</strong>
        <p style="margin: 0; font-size: 0.9rem; color: #eee;">${t('Your profile is under review (typically up to 48 hours). Profile changes can only be made after admin approval. You will receive an email when your account is approved — please check your Spam folder too.')}</p>
    </div>`;
}

/**
 * DevTools helper: paste diagnoseImageElement(document.querySelector('.treasure-img')) in console.
 * naturalWidth/Height 0 + complete = broken URL or invalid image bytes (not CSS hiding).
 */
export function diagnoseImageElement(img) {
    if (!img || img.tagName !== 'IMG') {
        console.warn('Pass an <img> element');
        return null;
    }

    const rect = img.getBoundingClientRect();
    const cx = rect.left + rect.width / 2;
    const cy = rect.top + rect.height / 2;
    const topEl = document.elementFromPoint(cx, cy);
    const hiddenAncestors = [];
    let node = img;
    while (node && node !== document.documentElement) {
        const style = window.getComputedStyle(node);
        if (style.display === 'none' || style.visibility === 'hidden' || Number(style.opacity) === 0) {
            hiddenAncestors.push({ tag: node.tagName, id: node.id, className: node.className, display: style.display, visibility: style.visibility, opacity: style.opacity });
        }
        node = node.parentElement;
    }

    const report = {
        srcPreview: (img.currentSrc || img.src || '').slice(0, 120),
        complete: img.complete,
        naturalWidth: img.naturalWidth,
        naturalHeight: img.naturalHeight,
        clientWidth: img.clientWidth,
        clientHeight: img.clientHeight,
        decodedOk: img.complete && img.naturalWidth > 0,
        likelyBrokenSrc: img.complete && img.naturalWidth === 0,
        hiddenAncestors,
        coveredByOtherElement: topEl && topEl !== img && !img.contains(topEl),
        elementAtCenter: topEl ? { tag: topEl.tagName, id: topEl.id, className: topEl.className } : null
    };

    console.table(report);
    if (report.likelyBrokenSrc) {
        console.warn('Broken decode: fix the src (404, truncated base64, bad format). CSS/overlay does not zero naturalWidth.');
    }
    if (report.hiddenAncestors.length) {
        console.warn('Hidden ancestors:', report.hiddenAncestors);
    }
    if (report.coveredByOtherElement) {
        console.warn('Another element sits on top of the image center:', report.elementAtCenter);
    }
    return report;
}

if (typeof window !== 'undefined') {
    window.diagnoseImageElement = diagnoseImageElement;
    window.diagnoseAllGridImages = () => {
        const imgs = [...document.querySelectorAll('.treasure-img, .photo-item-public img, #photoGrid img')];
        console.log(`Diagnosing ${imgs.length} images…`);
        return imgs.map((img, i) => ({ i, alias: img.alt, ...diagnoseImageElement(img) }));
    };
}