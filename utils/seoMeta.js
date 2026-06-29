const config = require('../config/appConfig');
const { isAccountDeleted } = require('./professionalVisibility');
const { resolveFirstPhotoForClient } = require('./photoUtils');

const PUBLIC_URL = (config.platform?.publicUrl || 'https://sexappeal.drsrv.net.ar').replace(/\/$/, '');
const DEFAULT_OG_IMAGE = `${PUBLIC_URL}/SexAppeal_logo_black.png`;

const RESERVED_PROFILE_ALIASES = new Set([
  'login.html', 'register.html', 'recover.html', 'verify.html', 'index.html',
  'categories.html', 'dashboard.html', 'profDashboard.html', 'treasure.html',
  'discover.html', 'home.html', 'services.html', 'admin.html', 'admin-potentials.html', 'plataforma.html',
  'para-modelos.html', 'detalles.html', 'conciencia-vih.html', 'conciencia-cancer-mama.html'
]);

const STATIC_SITEMAP_PAGES = [
  { path: '/', priority: '1.0', changefreq: 'weekly' },
  { path: '/categories.html', priority: '0.9', changefreq: 'daily' },
  { path: '/home.html', priority: '0.8', changefreq: 'daily' },
  { path: '/services.html', priority: '0.7', changefreq: 'monthly' },
  { path: '/plataforma.html', priority: '0.6', changefreq: 'monthly' }
];

function escapeHtml(value) {
  return String(value || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function truncate(text, max = 160) {
  const clean = String(text || '').replace(/\s+/g, ' ').trim();
  if (clean.length <= max) return clean;
  return `${clean.slice(0, max - 1).trim()}…`;
}

function formatProfileLocation(location) {
  if (!location) return 'Argentina';
  const province = location.province || '';
  const city = location.city || '';
  const neighborhood = location.neighborhood || '';
  if (province.toLowerCase() === 'caba') {
    return [neighborhood, 'CABA'].filter(Boolean).join(', ') || 'CABA, Argentina';
  }
  return [neighborhood, city, province].filter(Boolean).join(', ') || 'Argentina';
}

function isProfileIndexable(user) {
  const prof = user?.professionalProfile || {};
  return Boolean(
    user
    && user.role === 'professional'
    && !isAccountDeleted(user)
    && user.isVerified
    && user.verificationStatus === 'approved'
    && prof.subscriptionStatus !== 'suspended'
    && prof.isExposed !== false
    && prof.alias
  );
}

function resolveSeoImage(photos) {
  const resolved = resolveFirstPhotoForClient(photos);
  if (!resolved) return DEFAULT_OG_IMAGE;
  if (resolved.startsWith('http://') || resolved.startsWith('https://')) return resolved;
  if (resolved.startsWith('/')) return `${PUBLIC_URL}${resolved}`;
  return DEFAULT_OG_IMAGE;
}

function buildSeoHeadTags({
  title,
  description,
  url,
  image = DEFAULT_OG_IMAGE,
  type = 'website',
  robots = 'index, follow',
  locale = 'es_AR'
}) {
  const safeTitle = escapeHtml(title);
  const safeDescription = escapeHtml(description);
  const safeUrl = escapeHtml(url);
  const safeImage = escapeHtml(image);

  return `
    <meta name="description" content="${safeDescription}">
    <meta name="robots" content="${escapeHtml(robots)}">
    <link rel="canonical" href="${safeUrl}">
    <meta property="og:locale" content="${locale}">
    <meta property="og:title" content="${safeTitle}">
    <meta property="og:description" content="${safeDescription}">
    <meta property="og:image" content="${safeImage}">
    <meta property="og:url" content="${safeUrl}">
    <meta property="og:type" content="${type}">
    <meta property="og:site_name" content="SexAppeal">
    <meta name="twitter:card" content="summary_large_image">
    <meta name="twitter:title" content="${safeTitle}">
    <meta name="twitter:description" content="${safeDescription}">
    <meta name="twitter:image" content="${safeImage}">`.trim();
}

function buildProfileSeo(user) {
  const prof = user.professionalProfile || {};
  const alias = prof.alias || 'Professional';
  const location = formatProfileLocation(prof.location);
  const services = (prof.services || []).slice(0, 3).join(', ');
  const quality = prof.quality || 'Standard';
  const bio = truncate(prof.bio || '', 155);
  const url = `${PUBLIC_URL}/perfil/${encodeURIComponent(alias)}`;
  const title = `${alias} — ${quality} | SexAppeal Living Treasure`;
  const description = truncate(
    bio
      || `${alias}, acompañante ${quality} en ${location}${services ? `. Especialidades: ${services}` : ''}. Perfil exclusivo en SexAppeal.`,
    160
  );
  const image = resolveSeoImage(prof.photos);
  const indexable = isProfileIndexable(user);

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'ProfilePage',
    name: title,
    description,
    url,
    inLanguage: 'es-AR',
    mainEntity: {
      '@type': 'Person',
      name: alias,
      description: bio || description,
      image,
      homeLocation: {
        '@type': 'Place',
        name: location
      }
    }
  };

  const crawlerHtml = `
    <noscript>
      <article class="seo-crawler-preview">
        <h1>${escapeHtml(alias)} — ${escapeHtml(quality)}</h1>
        <p><strong>Ubicación:</strong> ${escapeHtml(location)}</p>
        ${services ? `<p><strong>Especialidades:</strong> ${escapeHtml(services)}</p>` : ''}
        <p>${escapeHtml(bio || description)}</p>
      </article>
    </noscript>`.trim();

  return {
    title,
    description,
    url,
    image,
    robots: indexable ? 'index, follow' : 'noindex, nofollow',
    type: 'profile',
    jsonLd,
    crawlerHtml
  };
}

function stripExistingSeoTags(html) {
  return html
    .replace(/\s*<!-- SEO & Open Graph Tags -->[\s\S]*?(?=\s*<meta name="theme-color"|\s*<script|\s*<\/head>)/i, '')
    .replace(/\s*<meta name="description"[^>]*>/gi, '')
    .replace(/\s*<meta name="robots"[^>]*>/gi, '')
    .replace(/\s*<link rel="canonical"[^>]*>/gi, '')
    .replace(/\s*<meta property="og:[^>]*>/gi, '')
    .replace(/\s*<meta name="twitter:[^>]*>/gi, '')
    .replace(/\s*<article id="seoProfilePreview"[\s\S]*?<\/article>/i, '')
    .replace(/\s*<noscript>\s*<article class="seo-crawler-preview"[\s\S]*?<\/noscript>/i, '');
}

function applySeoToHtml(html, seo) {
  let result = stripExistingSeoTags(html);
  result = result.replace(/<title>[^<]*<\/title>/i, `<title>${escapeHtml(seo.title)}</title>`);

  const headTags = buildSeoHeadTags(seo);
  const jsonLd = seo.jsonLd
    ? `<script type="application/ld+json">${JSON.stringify(seo.jsonLd)}</script>`
    : '';

  result = result.replace('</head>', `    ${headTags}\n    ${jsonLd}\n</head>`);

  if (seo.crawlerHtml) {
    result = result.replace(
      /<body([^>]*)>/i,
      `<body$1>\n    ${seo.crawlerHtml}\n`
    );
  }

  return result;
}

function absoluteUrl(relativePath) {
  if (!relativePath) return PUBLIC_URL;
  if (relativePath.startsWith('http')) return relativePath;
  return `${PUBLIC_URL}${relativePath.startsWith('/') ? relativePath : `/${relativePath}`}`;
}

module.exports = {
  PUBLIC_URL,
  DEFAULT_OG_IMAGE,
  RESERVED_PROFILE_ALIASES,
  STATIC_SITEMAP_PAGES,
  escapeHtml,
  truncate,
  formatProfileLocation,
  isProfileIndexable,
  buildSeoHeadTags,
  buildProfileSeo,
  applySeoToHtml,
  absoluteUrl
};
