const User = require('../models/User');
const InterestNote = require('../models/InterestNote');
const { INDEXABLE_FILTER } = require('./professionalVisibility');
const config = require('../config/appConfig');
const {
  PUBLIC_URL,
  RESERVED_PROFILE_ALIASES,
  staticSitemapPagesForSite,
  siteKeyFromBaseUrl
} = require('./seoMeta');
const { getLocationPages } = require('./seoLocations');
const { isExternalUrl, replaceDeadExternalUrl } = require('./photoUtils');

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

function resolveSitemapPhotoUrl(photos) {
  if (!Array.isArray(photos) || photos.length === 0) return null;
  for (const photo of photos) {
    if (!photo || typeof photo !== 'string') continue;
    const resolved = isExternalUrl(photo) ? replaceDeadExternalUrl(photo) : null;
    if (resolved) return resolved;
  }
  return null;
}

function buildSitemapXml(urls) {
  const hasImages = urls.some((entry) => entry.images && entry.images.length > 0);
  const xmlns = ['xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"'];
  if (hasImages) xmlns.push('xmlns:image="http://www.google.com/schemas/sitemap-image/1.1"');

  const body = urls.map((entry) => {
    const lines = ['  <url>'];
    lines.push(`    <loc>${entry.loc}</loc>`);
    lines.push(`    <lastmod>${entry.lastmod}</lastmod>`);
    lines.push(`    <changefreq>${entry.changefreq}</changefreq>`);
    lines.push(`    <priority>${entry.priority}</priority>`);
    if (entry.images && entry.images.length > 0) {
      entry.images.forEach((img) => {
        lines.push('    <image:image>');
        lines.push(`      <image:loc>${img.loc}</image:loc>`);
        if (img.title) lines.push(`      <image:title><![CDATA[${img.title}]]></image:title>`);
        if (img.caption) lines.push(`      <image:caption><![CDATA[${img.caption}]]></image:caption>`);
        lines.push('    </image:image>');
      });
    }
    lines.push('  </url>');
    return lines.join('\n');
  }).join('\n');

  return [
    '<?xml version="1.0" encoding="UTF-8"?>',
    `<urlset ${xmlns.join(' ')}>`,
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
  return [
    '# SelfAppeal is an outreach alias domain — not indexed in Google.',
    '# Main site: https://sexappeal.drsrv.net.ar',
    'User-agent: *',
    'Allow: /para-modelos.html',
    'Disallow: /',
    ''
  ].join('\n');
}

function baseUrlForNamedSite(site) {
  if (site === 'selfappeal') return SELFAPPEAL_BASE;
  return SEXAPPEAL_BASE;
}

async function collectAllUrls(baseUrl) {
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
      priority: meta.priority,
      images: meta.images || []
    });
  };

  staticSitemapPagesForSite(siteKey).forEach((page) => {
    addUrl(absoluteUrlFromBase(baseUrl, page.path), {
      lastmod: toIsoDate(),
      changefreq: page.changefreq,
      priority: page.priority
    });
  });

  if (siteKey === 'sexappeal') {
    const professionals = await User.find(INDEXABLE_FILTER)
      .select('professionalProfile.alias professionalProfile.lastPhotoUpdate professionalProfile.photos professionalProfile.bio updatedAt createdAt');

    professionals.forEach((user) => {
      const alias = sanitizeAliasForSitemap(user.professionalProfile?.alias);
      if (!alias || RESERVED_PROFILE_ALIASES.has(alias.toLowerCase())) return;
      const photoUrl = resolveSitemapPhotoUrl(user.professionalProfile?.photos);
      const images = photoUrl ? [{ loc: photoUrl, title: alias, caption: user.professionalProfile?.bio || alias }] : [];
      addUrl(absoluteUrlFromBase(baseUrl, `/perfil/${encodePathSegment(alias)}`), {
        lastmod: toIsoDate(user.professionalProfile?.lastPhotoUpdate || user.updatedAt || user.createdAt),
        changefreq: 'weekly',
        priority: '0.8',
        images
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

    const publishedNotes = await InterestNote.find({ published: true })
      .select('updatedAt createdAt titleEs titleEn')
      .sort({ sortOrder: 1, createdAt: -1 });

    if (publishedNotes.length > 0) {
      addUrl(absoluteUrlFromBase(baseUrl, '/notas-interes.html'), {
        lastmod: toIsoDate(publishedNotes[0].updatedAt || publishedNotes[0].createdAt),
        changefreq: 'weekly',
        priority: '0.6'
      });
    }

    publishedNotes.forEach((note) => {
      const noteTitle = note.titleEs || note.titleEn || note.title || 'Interés';
      addUrl(absoluteUrlFromBase(baseUrl, `/nota-interes.html?id=${note._id}`), {
        lastmod: toIsoDate(note.updatedAt || note.createdAt),
        changefreq: 'monthly',
        priority: '0.55'
      });
    });
  }

  urls.sort((a, b) => a.loc.localeCompare(b.loc));
  return urls;
}

async function buildSitemapForBase(baseUrl) {
  const urls = await collectAllUrls(baseUrl);
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
    '',
    '# Core pages',
    'Allow: /index.html$',
    'Allow: /home.html$',
    'Allow: /categories.html$',
    'Allow: /services.html$',
    'Allow: /plataforma.html$',
    'Allow: /detalles.html$',
    'Allow: /conciencia-vih.html$',
    'Allow: /conciencia-cancer-mama.html$',
    '',
    '# SEO landing pages',
    'Allow: /acompanantes/',
    'Allow: /perfil/',
    '',
    '# Content pages',
    'Allow: /notas-interes.html$',
    'Allow: /nota-interes.html',
    '',
    '# Utility pages (noindex, but crawlable to find links)',
    'Allow: /login.html$',
    'Allow: /register.html$',
    'Allow: /recover.html$',
    'Allow: /verify.html$',
    'Allow: /forgot.html$',
    '',
    '# Resources',
    'Allow: /favicon.svg$',
    'Allow: /SexAppeal_logo_black.png$',
    'Allow: /css/',
    'Allow: /js/',
    '',
    '# Blocked paths',
    'Disallow: /api/',
    'Disallow: /dashboard.html',
    'Disallow: /profDashboard.html',
    'Disallow: /admin.html',
    'Disallow: /admin-potentials.html',
    'Disallow: /discover.html',
    'Disallow: /whatsapp-inbox.html',
    'Disallow: /treasure.html',
    'Disallow: /design-previews.html',
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
  collectAllUrls,
  buildSitemapForBase,
  buildSitemapXml,
  buildRobotsTxt
};
