const fs = require('fs');
const path = require('path');
const User = require('../models/User');
const {
  PUBLIC_URL,
  RESERVED_PROFILE_ALIASES,
  buildProfileSeo,
  applySeoToHtml,
  absoluteUrl
} = require('../utils/seoMeta');
const {
  resolveRequestBaseUrl,
  baseUrlForNamedSite,
  buildSitemapForBase,
  buildRobotsTxt
} = require('../utils/seoSitemap');
const {
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

function sendSitemapXml(res, xml) {
  res.set('Content-Type', 'text/xml; charset=UTF-8');
  res.setHeader('Cache-Control', 'public, max-age=3600');
  res.end(Buffer.from(xml, 'utf8'));
}

exports.robotsTxt = (req, res) => {
  const baseUrl = resolveRequestBaseUrl(req);
  res.type('text/plain');
  res.setHeader('Cache-Control', 'public, max-age=3600');
  res.send(buildRobotsTxt(baseUrl));
};

exports.sitemapXml = async (req, res, next) => {
  try {
    const baseUrl = resolveRequestBaseUrl(req);
    const { xml } = await buildSitemapForBase(baseUrl);
    sendSitemapXml(res, xml);
  } catch (error) {
    next(error);
  }
};

exports.sitemapSexAppealXml = async (req, res, next) => {
  try {
    const { xml } = await buildSitemapForBase(baseUrlForNamedSite('sexappeal'));
    sendSitemapXml(res, xml);
  } catch (error) {
    next(error);
  }
};

exports.sitemapSelfAppealXml = async (req, res, next) => {
  try {
    const { xml } = await buildSitemapForBase(baseUrlForNamedSite('selfappeal'));
    sendSitemapXml(res, xml);
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
