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

const TREASURE_TEMPLATE_PATH = path.join(__dirname, '..', 'public', 'treasure.html');
let treasureTemplateCache = null;

function loadTreasureTemplate() {
  if (!treasureTemplateCache) {
    treasureTemplateCache = fs.readFileSync(TREASURE_TEMPLATE_PATH, 'utf8');
  }
  return treasureTemplateCache;
}

function xmlEscape(value) {
  return String(value || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

function toIsoDate(value) {
  const date = value ? new Date(value) : new Date();
  if (Number.isNaN(date.getTime())) return new Date().toISOString().slice(0, 10);
  return date.toISOString().slice(0, 10);
}

exports.robotsTxt = (req, res) => {
  const body = [
    'User-agent: *',
    'Allow: /',
    'Allow: /index.html',
    'Allow: /categories.html',
    'Allow: /home.html',
    'Allow: /services.html',
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

    const urls = STATIC_SITEMAP_PAGES.map((page) => ({
      loc: absoluteUrl(page.path),
      lastmod: toIsoDate(),
      changefreq: page.changefreq,
      priority: page.priority
    }));

    professionals.forEach((user) => {
      const alias = user.professionalProfile?.alias;
      if (!alias || RESERVED_PROFILE_ALIASES.has(String(alias).toLowerCase())) return;
      urls.push({
        loc: absoluteUrl(`/perfil/${encodeURIComponent(alias)}`),
        lastmod: toIsoDate(user.professionalProfile?.lastPhotoUpdate || user.updatedAt || user.createdAt),
        changefreq: 'weekly',
        priority: '0.8'
      });
    });

    const xml = [
      '<?xml version="1.0" encoding="UTF-8"?>',
      '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">',
      ...urls.map((entry) => [
        '  <url>',
        `    <loc>${xmlEscape(entry.loc)}</loc>`,
        `    <lastmod>${entry.lastmod}</lastmod>`,
        `    <changefreq>${entry.changefreq}</changefreq>`,
        `    <priority>${entry.priority}</priority>`,
        '  </url>'
      ].join('\n')),
      '</urlset>'
    ].join('\n');

    res.type('application/xml');
    res.setHeader('Cache-Control', 'public, max-age=3600');
    res.send(xml);
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
