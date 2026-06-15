const fs = require('fs');
const path = require('path');
const User = require('../models/User');
const {
  PUBLIC_URL,
  RESERVED_PROFILE_ALIASES,
  STATIC_SITEMAP_PAGES,
  buildProfileSeo,
  applySeoToHtml,
  absoluteUrl
} = require('../utils/seoMeta');
const {
  getLocationPages,
  findLocationPage,
  fetchProfessionalsForPage,
  buildLocationSeo,
  buildLocationHtml,
  buildSubAreaLinks
} = require('../utils/seoLocations');

const TREASURE_TEMPLATE_PATH = path.join(__dirname, '..', 'public', 'treasure.html');
let treasureTemplateCache = null;

function loadTreasureTemplate() {
  if (!treasureTemplateCache) {
    treasureTemplateCache = fs.readFileSync(TREASURE_TEMPLATE_PATH, 'utf8');
  }
  return treasureTemplateCache;
}

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
    const loc = `${origin}${pathname}${search}`;
    return loc.replace(/&/g, '&amp;');
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

exports.robotsTxt = (req, res) => {
  const body = [
    'User-agent: *',
    'Allow: /',
    'Allow: /index.html',
    'Allow: /categories.html',
    'Allow: /home.html',
    'Allow: /services.html',
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
    `Sitemap: ${PUBLIC_URL}/sitemap.xml`
  ].join('\n');

  res.type('text/plain');
  res.setHeader('Cache-Control', 'public, max-age=3600');
  res.send(body);
};

exports.sitemapXml = async (req, res, next) => {
  try {
    const professionals = await User.find({
      role: 'professional',
      isVerified: true,
      verificationStatus: 'approved',
      'professionalProfile.subscriptionStatus': { $ne: 'suspended' },
      'professionalProfile.isExposed': { $ne: false },
      'professionalProfile.alias': { $exists: true, $nin: ['', null] }
    }).select('professionalProfile.alias professionalProfile.lastPhotoUpdate updatedAt createdAt');

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

    STATIC_SITEMAP_PAGES.forEach((page) => {
      addUrl(absoluteUrl(page.path), {
        lastmod: toIsoDate(),
        changefreq: page.changefreq,
        priority: page.priority
      });
    });

    professionals.forEach((user) => {
      const alias = sanitizeAliasForSitemap(user.professionalProfile?.alias);
      if (!alias || RESERVED_PROFILE_ALIASES.has(alias.toLowerCase())) return;
      addUrl(absoluteUrl(`/perfil/${encodePathSegment(alias)}`), {
        lastmod: toIsoDate(user.professionalProfile?.lastPhotoUpdate || user.updatedAt || user.createdAt),
        changefreq: 'weekly',
        priority: '0.8'
      });
    });

    const locationPages = await getLocationPages();
    locationPages.forEach((page) => {
      addUrl(absoluteUrl(page.path), {
        lastmod: toIsoDate(page.lastUpdated),
        changefreq: 'daily',
        priority: page.areaSlug ? '0.75' : '0.7'
      });
    });

    urls.sort((a, b) => a.loc.localeCompare(b.loc));

    const xml = buildSitemapXml(urls);
    if (!xml.includes('</urlset>') || !/<loc>https:\/\//.test(xml)) {
      throw new Error('Invalid sitemap XML generated');
    }

    res.set('Content-Type', 'text/xml; charset=UTF-8');
    res.setHeader('Cache-Control', 'public, max-age=3600');
    res.end(Buffer.from(xml, 'utf8'));
  } catch (error) {
    next(error);
  }
};

exports.renderLocationPage = async (req, res, next) => {
  try {
    const provinceSlug = String(req.params.provinceSlug || '').trim();
    const areaSlug = req.params.areaSlug ? String(req.params.areaSlug).trim() : null;
    const page = await findLocationPage(provinceSlug, areaSlug);

    if (!page) {
      res.status(404);
      res.type('html');
      return res.send(`<!DOCTYPE html><html lang="es"><head><meta charset="UTF-8"><meta name="robots" content="noindex, nofollow"><title>Ubicacion no encontrada | SexAppeal</title></head><body><h1>Ubicacion no encontrada</h1><p><a href="/categories.html">Volver al directorio</a></p></body></html>`);
    }

    const professionals = await fetchProfessionalsForPage(page);
    if (!professionals.length) {
      res.status(404);
      res.type('html');
      return res.send(`<!DOCTYPE html><html lang="es"><head><meta charset="UTF-8"><meta name="robots" content="noindex, nofollow"><title>Sin perfiles en esta zona | SexAppeal</title></head><body><h1>Sin perfiles en esta zona</h1><p><a href="/categories.html">Volver al directorio</a></p></body></html>`);
    }

    const seo = buildLocationSeo(page, professionals);
    const subAreas = page.areaSlug ? [] : await buildSubAreaLinks(page);
    const html = buildLocationHtml(page, professionals, seo, subAreas);

    res.type('html');
    res.setHeader('Cache-Control', 'public, max-age=300');
    res.send(html);
  } catch (error) {
    next(error);
  }
};

exports.renderProfilePage = async (req, res, next) => {
  try {
    const aliasParam = String(req.params.alias || '').trim();
    const aliasLower = aliasParam.toLowerCase();

    if (RESERVED_PROFILE_ALIASES.has(aliasLower)) {
      return res.redirect(301, `/${aliasParam}`);
    }

    const aliasRegex = new RegExp(`^${aliasParam.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`, 'i');
    const professional = await User.findOne({
      'professionalProfile.alias': aliasRegex,
      role: 'professional'
    }).select(
      'role isVerified verificationStatus professionalProfile.alias professionalProfile.quality '
      + 'professionalProfile.bio professionalProfile.services professionalProfile.location '
      + 'professionalProfile.photos professionalProfile.subscriptionStatus professionalProfile.isExposed'
    );

    const template = loadTreasureTemplate();

    if (!professional) {
      res.status(404);
      const html = applySeoToHtml(template, {
        title: 'Perfil no encontrado | SexAppeal',
        description: 'El perfil solicitado no está disponible en SexAppeal.',
        url: absoluteUrl(`/perfil/${encodeURIComponent(aliasParam)}`),
        robots: 'noindex, nofollow'
      });
      res.type('html');
      return res.send(html);
    }

    const seo = buildProfileSeo(professional);
    const html = applySeoToHtml(template, seo);
    res.type('html');
    res.setHeader('Cache-Control', 'public, max-age=300');
    res.send(html);
  } catch (error) {
    next(error);
  }
};
