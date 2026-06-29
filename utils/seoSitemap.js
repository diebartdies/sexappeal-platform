const User = require('../models/User');
const { INDEXABLE_FILTER } = require('./professionalVisibility');
const config = require('../config/appConfig');
const {
  PUBLIC_URL,
  RESERVED_PROFILE_ALIASES,
  staticSitemapPagesForSite,
  siteKeyFromBaseUrl
} = require('./seoMeta');
const { getLocationPages } = require('./seoLocations');

const SEXAPPEAL_BASE = PUBLIC_URL.replace(/\/$/, '');

function getSelfAppealBaseUrl() {
  const raw = (config.whatsappDrip?.aliasDomain || 'selfappeal.drsrv.net.ar').trim();
  if (!raw) return 'https://selfappeal.drsrv.net.ar';
  const host = raw.replace(/^https?:\/\//i, '').replace(/\/.*$/, '');
  return `https://${host}`;
}

const SELFAPPEAL_BASE = getSelfAppealBaseUrl();

function sanitizeAliasForSitemap(alias) {
  return String(alias || '')
    .trim()
    .replace(/[\u0000-\u001f\u007f]/g, '');
}

function encodePathSegment(value) {
  return encodeURIComponent(sanitizeAliasForSitemap(value))
    .replace(/[!'()*]/g, (char) => `%${char.charCodeAt(0).toString(16).toUpperCase()}`);
}

function decodePathSegment(segment) {
  try {
    return decodeURIComponent(segment);
  } catch (error) {
    return segment;
  }
}

function absoluteUrlFromBase(baseUrl, relativePath) {
  const base = String(baseUrl || '').replace(/\/$/, '');
  if (!relativePath) return base;
  if (relativePath.startsWith('http')) return relativePath;
  return `${base}${relativePath.startsWith('/') ? relativePath : `/${relativePath}`}`;
}

function buildSitemapLoc(url) {
  try {
    const parsed = new URL(String(url));
    if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') return null;
    const origin = `${parsed.protocol}//${parsed.host}`;
    const pathname = parsed.pathname
      .split('/')
      .map((segment) => (segment ? encodePathSegment(decodePathSegment(segment)) : ''))
      .join('/');
    const search = parsed.search || '';
    return `${origin}${pathname}${search}`.replace(/&/g, '&amp;');
  } catch (error) {
    return null;
  }
}

function toIsoDate(value) {
  const date = value ? new Date(value) : new Date();
  if (Number.isNaN(date.getTime())) return new Date().toISOString().slice(0, 10);
  return date.toISOString().slice(0, 10);
}

function buildSitemapXml(urls) {
  const body = urls.map((entry) => [
    '  <url>',
    `    <loc>${entry.loc}</loc>`,
    `    <lastmod>${entry.lastmod}</lastmod>`,
    `    <changefreq>${entry.changefreq}</changefreq>`,
    `    <priority>${entry.priority}</priority>`,
    '  </url>'
  ].join('\n')).join('\n');

  return [
    '<?xml version="1.0" encoding="UTF-8"?>',
    '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">',
    body,
    '</urlset>',
    ''
  ].join('\n');
}

function resolveRequestBaseUrl(req) {
  if (req && typeof req.get === 'function') {
    const host = (req.get('x-forwarded-host') || req.get('host') || '').split(',')[0].trim();
    if (host) {
      const proto = (req.get('x-forwarded-proto') || req.protocol || 'https').split(',')[0].trim();
      return `${proto}://${host}`.replace(/\/$/, '');
    }
  }
  return SEXAPPEAL_BASE;
}

function isSelfAppealHost(req) {
  const host = (req?.get?.('x-forwarded-host') || req?.get?.('host') || '')
    .split(',')[0]
    .trim()
    .toLowerCase();
  return host.includes('selfappeal.');
}

function buildSelfAppealRobotsTxt() {
  const site = SELFAPPEAL_BASE;
  return [
    'User-agent: *',
    'Allow: /para-modelos.html',
    'Disallow: /',
    '',
    `Sitemap: ${site}/sitemap.xml`,
    ''
  ].join('\n');
}

function baseUrlForNamedSite(site) {
  if (site === 'selfappeal') return SELFAPPEAL_BASE;
  return SEXAPPEAL_BASE;
}

async function collectSitemapUrls(baseUrl) {
  const siteKey = siteKeyFromBaseUrl(baseUrl);
  const urls = [];
  const seenLocs = new Set();

  const addUrl = (rawUrl, meta) => {
    const loc = buildSitemapLoc(rawUrl);
    if (!loc || seenLocs.has(loc)) return;
    seenLocs.add(loc);
    urls.push({
      loc,
      lastmod: meta.lastmod,
      changefreq: meta.changefreq,
      priority: meta.priority
    });
  };

  staticSitemapPagesForSite(siteKey).forEach((page) => {
    addUrl(absoluteUrlFromBase(baseUrl, page.path), {
      lastmod: toIsoDate(),
      changefreq: page.changefreq,
      priority: page.priority
    });
  });

  if (siteKey !== 'sexappeal') {
    urls.sort((a, b) => a.loc.localeCompare(b.loc));
    return urls;
  }

  const professionals = await User.find(INDEXABLE_FILTER)
    .select('professionalProfile.alias professionalProfile.lastPhotoUpdate updatedAt createdAt');

  professionals.forEach((user) => {
    const alias = sanitizeAliasForSitemap(user.professionalProfile?.alias);
    if (!alias || RESERVED_PROFILE_ALIASES.has(alias.toLowerCase())) return;
    addUrl(absoluteUrlFromBase(baseUrl, `/perfil/${encodePathSegment(alias)}`), {
      lastmod: toIsoDate(user.professionalProfile?.lastPhotoUpdate || user.updatedAt || user.createdAt),
      changefreq: 'weekly',
      priority: '0.8'
    });
  });

  const locationPages = await getLocationPages();
  locationPages.forEach((page) => {
    addUrl(absoluteUrlFromBase(baseUrl, page.path), {
      lastmod: toIsoDate(page.lastUpdated),
      changefreq: 'daily',
      priority: page.areaSlug ? '0.75' : '0.7'
    });
  });

  urls.sort((a, b) => a.loc.localeCompare(b.loc));
  return urls;
}

async function buildSitemapForBase(baseUrl) {
  const urls = await collectSitemapUrls(baseUrl);
  const xml = buildSitemapXml(urls);
  if (!xml.includes('</urlset>') || !/<loc>https:\/\//.test(xml)) {
    throw new Error('Invalid sitemap XML generated');
  }
  return { urls, xml, baseUrl: String(baseUrl).replace(/\/$/, '') };
}

function buildRobotsTxt(baseUrl) {
  const site = String(baseUrl || SEXAPPEAL_BASE).replace(/\/$/, '');
  return [
    'User-agent: *',
    'Allow: /',
    'Allow: /index.html',
    'Allow: /categories.html',
    'Allow: /home.html',
    'Allow: /services.html',
    'Allow: /plataforma.html',
    'Allow: /detalles.html',
    'Allow: /conciencia-vih.html',
    'Allow: /conciencia-cancer-mama.html',
    'Allow: /acompanantes/',
    'Allow: /perfil/',
    'Disallow: /api/',
    'Disallow: /dashboard.html',
    'Disallow: /profDashboard.html',
    'Disallow: /login.html',
    'Disallow: /register.html',
    'Disallow: /recover.html',
    'Disallow: /verify.html',
    'Disallow: /discover.html',
    'Disallow: /admin-potentials.html',
    '',
    `Sitemap: ${site}/sitemap.xml`,
    ''
  ].join('\n');
}

module.exports = {
  SEXAPPEAL_BASE,
  SELFAPPEAL_BASE,
  resolveRequestBaseUrl,
  isSelfAppealHost,
  buildSelfAppealRobotsTxt,
  baseUrlForNamedSite,
  collectSitemapUrls,
  buildSitemapForBase,
  buildSitemapXml,
  buildRobotsTxt
};
