const fs = require('fs');
const path = require('path');

const jsDir = path.join(__dirname, '../public/js');
const appPath = path.join(jsDir, 'app.js');
const lines = fs.readFileSync(appPath, 'utf8').split(/\r?\n/);

const discoveryStart = lines.findIndex(l => l === '// --- Discovery ---');
const adminStart = lines.findIndex(l => l === '// --- Admin Dashboard Grid ---');

if (discoveryStart === -1 || adminStart === -1) {
  console.error('Could not find Discovery or Admin section markers');
  process.exit(1);
}

let discoveryBody = lines.slice(discoveryStart + 1, adminStart).join('\n').trim();

// Remove getPendingApprovalBannerHtml (now in uiHelpers.js)
discoveryBody = discoveryBody.replace(
  /\nfunction getPendingApprovalBannerHtml\(\) \{[\s\S]*?\n\}\n/,
  '\n'
);

// Export functions and module state
discoveryBody = discoveryBody
  .replace(/^async function loadTreasures/m, 'let currentDiscoveryPage = 1;\n\nexport async function loadTreasures')
  .replace(/^async function loadTreasureDetails/m, 'export async function loadTreasureDetails')
  .replace(/^async function initializeFilters/m, 'export async function initializeFilters')
  .replace(/^async function applyCountsToDropdowns/m, 'export async function applyCountsToDropdowns')
  .replace(/^function trackDashboardPhotoClick/m, 'export function trackDashboardPhotoClick')
  .replace(/^function contactOnWhatsApp/m, 'export function contactOnWhatsApp')
  .replace(/^function contactOnPhone/m, 'export function contactOnPhone');

// currentGalleryPhotos is only used inside loadTreasureDetails — use local name
discoveryBody = discoveryBody.replace(/\bcurrentGalleryPhotos\b/g, 'galleryPhotos');

discoveryBody = discoveryBody.replace(
  /\nwindow\.applyCountsToDropdowns = applyCountsToDropdowns;\n?/,
  '\n'
);

const discoveryContent = [
  "import { BASE_ORIGIN, API_URL, CATEGORY_META } from './globals.js';",
  "import { t, applyStaticTranslations } from './i18n.js';",
  "import { getPendingApprovalBannerHtml } from './uiHelpers.js';",
  "import { renderSpecialtyDropdown } from './helpers.js';",
  '',
  discoveryBody,
  '',
  'window.applyCountsToDropdowns = applyCountsToDropdowns;',
  'window.contactOnWhatsApp = contactOnWhatsApp;',
  'window.contactOnPhone = contactOnPhone;',
  ''
].join('\n');

fs.writeFileSync(path.join(jsDir, 'discovery.js'), discoveryContent);

const discoveryImport = `import {
    loadTreasures,
    loadTreasureDetails,
    initializeFilters,
    applyCountsToDropdowns
} from './discovery.js';
`;

let app = lines.join('\n');

if (!app.includes("from './discovery.js'")) {
  app = app.replace(
    /import \{ showAlert \} from '\.\/uiHelpers\.js';/,
    "import { showAlert, getPendingApprovalBannerHtml } from './uiHelpers.js';"
  );
  app = app.replace(
    /import \{ renderSpecialtyDropdown, setupLocationDropdowns \} from '\.\/helpers\.js';\n/,
    `import { renderSpecialtyDropdown, setupLocationDropdowns } from './helpers.js';\n${discoveryImport}`
  );
}

app = app.replace(
  /\n\/\/ --- Discovery ---[\s\S]*?\n\/\/ --- Admin Dashboard Grid ---\n/,
  '\n// --- Admin Dashboard Grid ---\n'
);

fs.writeFileSync(appPath, app);
console.log('discovery.js extracted and app.js patched.');
