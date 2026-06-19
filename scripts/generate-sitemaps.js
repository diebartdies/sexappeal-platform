require('dotenv').config();
const fs = require('fs');
const path = require('path');
const connectDB = require('../config/database');
const {
  SEXAPPEAL_BASE,
  SELFAPPEAL_BASE,
  buildSitemapForBase,
  buildRobotsTxt
} = require('../utils/seoSitemap');

const EXPORT_DIR = path.resolve(__dirname, '..', 'exports');

async function writeSiteBundle(label, baseUrl) {
  const { xml, urls } = await buildSitemapForBase(baseUrl);
  const safeLabel = label.replace(/[^a-z0-9-]/gi, '-').toLowerCase();
  const sitemapPath = path.join(EXPORT_DIR, `sitemap-${safeLabel}.xml`);
  const robotsPath = path.join(EXPORT_DIR, `robots-${safeLabel}.txt`);
  fs.writeFileSync(sitemapPath, xml, 'utf8');
  fs.writeFileSync(robotsPath, buildRobotsTxt(baseUrl), 'utf8');
  return { sitemapPath, robotsPath, urlCount: urls.length, baseUrl };
}

(async () => {
  await connectDB();
  fs.mkdirSync(EXPORT_DIR, { recursive: true });

  const sexappeal = await writeSiteBundle('sexappeal', SEXAPPEAL_BASE);
  const selfappeal = await writeSiteBundle('selfappeal', SELFAPPEAL_BASE);

  console.log('--------------------------------------------------');
  console.log('Google sitemap export');
  console.log('--------------------------------------------------');
  console.log(`SexAppeal base:   ${sexappeal.baseUrl}`);
  console.log(`  URLs:           ${sexappeal.urlCount}`);
  console.log(`  Sitemap:        ${sexappeal.sitemapPath}`);
  console.log(`  Robots:         ${sexappeal.robotsPath}`);
  console.log(`SelfAppeal base:  ${selfappeal.baseUrl}`);
  console.log(`  URLs:           ${selfappeal.urlCount}`);
  console.log(`  Sitemap:        ${selfappeal.sitemapPath}`);
  console.log(`  Robots:         ${selfappeal.robotsPath}`);
  console.log('--------------------------------------------------');
  console.log('Submit in Google Search Console (one property per domain):');
  console.log(`  ${SEXAPPEAL_BASE}/sitemap.xml`);
  console.log(`  ${SELFAPPEAL_BASE}/sitemap.xml`);
  console.log('--------------------------------------------------');

  process.exit(0);
})().catch((err) => {
  console.error('Sitemap export failed:', (err && err.message) || String(err));
  process.exit(1);
});
