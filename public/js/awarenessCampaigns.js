import { appPath } from './globals.js';
import { t } from './i18n.js';

const AIDS_WINDOW = { month: 12, startDay: 1, endDay: 7 };
const BREAST_WINDOW = { month: 10, startDay: 19, endDay: 25 };

const CAMPAIGNS = {
    aids: {
        id: 'aids',
        page: 'conciencia-vih.html',
        ribbonClass: 'awareness-ribbon-link--aids',
        ariaLabelKey: 'AIDS awareness — open prevention information',
        captionKey: 'World AIDS Day · 1 Dec',
        titleKey: 'World AIDS Day'
    },
    breast: {
        id: 'breast',
        page: 'conciencia-cancer-mama.html',
        ribbonClass: 'awareness-ribbon-link--breast',
        ariaLabelKey: 'Breast cancer awareness — open prevention information',
        captionKey: 'Breast cancer awareness · 19 Oct',
        titleKey: 'Breast cancer awareness'
    }
};

const TEST_PARAM_ALIASES = {
    aids: 'aids',
    sida: 'aids',
    vih: 'aids',
    breast: 'breast',
    mama: 'breast',
    cancer: 'breast'
};

function isInWindow(date, window) {
    const month = date.getMonth() + 1;
    const day = date.getDate();
    return month === window.month && day >= window.startDay && day <= window.endDay;
}

function getTestCampaignFromUrl() {
    if (typeof window === 'undefined') return null;
    const raw = new URLSearchParams(window.location.search).get('awareness');
    if (!raw) return null;
    const key = TEST_PARAM_ALIASES[String(raw).trim().toLowerCase()];
    return key ? { ...CAMPAIGNS[key], testMode: true } : null;
}

export function getActiveAwarenessCampaign(now = new Date()) {
    const testCampaign = getTestCampaignFromUrl();
    if (testCampaign) return testCampaign;

    if (isInWindow(now, AIDS_WINDOW)) {
        return { ...CAMPAIGNS.aids };
    }
    if (isInWindow(now, BREAST_WINDOW)) {
        return { ...CAMPAIGNS.breast };
    }
    return null;
}

const RIBBON_SVG = `<svg class="awareness-ribbon-svg" viewBox="0 0 36 52" aria-hidden="true" focusable="false">
    <path d="M18 2 C10 2 4 9 4 17 C4 28 18 50 18 50 C18 50 32 28 32 17 C32 9 26 2 18 2 Z" fill="currentColor" stroke="currentColor" stroke-width="1" stroke-linejoin="round"/>
    <path d="M18 8 C13 8 9 12 9 17 C9 24 18 42 18 42 C18 42 27 24 27 17 C27 12 23 8 18 8 Z" fill="none" stroke="rgba(0,0,0,0.12)" stroke-width="0.75"/>
</svg>`;

function ensureAwarenessStyles() {
    if (document.getElementById('sexappeal-awareness-css')) return;
    const link = document.createElement('link');
    link.id = 'sexappeal-awareness-css';
    link.rel = 'stylesheet';
    link.href = '/css/awareness-campaigns.css?v=2';
    document.head.appendChild(link);
}

function buildRibbonStack(campaign, variant = 'default') {
    const wrap = document.createElement('div');
    wrap.className = `awareness-ribbon-stack awareness-ribbon-stack--${variant}`;

    const link = document.createElement('a');
    link.href = appPath(campaign.page);
    link.className = `awareness-ribbon-link ${campaign.ribbonClass}`;
    link.setAttribute('aria-label', t(campaign.ariaLabelKey));
    link.title = t(campaign.ariaLabelKey);
    link.innerHTML = RIBBON_SVG;

    const caption = document.createElement('span');
    caption.className = 'awareness-ribbon-caption';
    caption.textContent = t(campaign.captionKey);

    wrap.appendChild(link);
    wrap.appendChild(caption);
    return wrap;
}

function attachToTopBarBrand(brandLink, campaign) {
    if (brandLink.querySelector('.awareness-ribbon-stack')) return;
    brandLink.classList.add('brand-logo-with-awareness');
    brandLink.appendChild(buildRibbonStack(campaign, 'topbar'));
}

function attachToLogoImage(img, campaign) {
    if (!img || img.closest('.awareness-logo-cluster')) return;

    const cluster = document.createElement('div');
    cluster.className = 'awareness-logo-cluster';

    const parent = img.parentElement;
    if (!parent) return;

    parent.insertBefore(cluster, img);
    cluster.appendChild(img);
    cluster.appendChild(buildRibbonStack(campaign, 'landing'));
}

export function initAwarenessCampaigns() {
    const campaign = getActiveAwarenessCampaign();
    if (!campaign) return;

    ensureAwarenessStyles();

    const topBarBrand = document.querySelector('#globalTopBar .brand-logo');
    if (topBarBrand) attachToTopBarBrand(topBarBrand, campaign);

    document.querySelectorAll('.landing-logo, .landing-details-logo, .categories-brand-logo .page-logo').forEach((img) => {
        attachToLogoImage(img, campaign);
    });

    document.querySelectorAll('.reg-logo-block img, .brand-logo-block > img').forEach((img) => {
        attachToLogoImage(img, campaign);
    });
}
