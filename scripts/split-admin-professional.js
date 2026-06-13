const fs = require('fs');
const path = require('path');

const jsDir = path.join(__dirname, '../public/js');
const appPath = path.join(jsDir, 'app.js');
const lines = fs.readFileSync(appPath, 'utf8').split(/\r?\n/);

function lineIndex(marker) {
  const idx = lines.findIndex(l => l === marker);
  if (idx === -1) {
    console.error(`Marker not found: ${marker}`);
    process.exit(1);
  }
  return idx;
}

const adminGridStart = lineIndex('// --- Admin Dashboard Grid ---');
const dashStart = lineIndex('// --- Dashboard ---');
const updateProfileStart = lineIndex('// Update Profile');
const profConnStart = lineIndex('// --- Professional View Connection Requests Modal ---');
const adminLogsStart = lineIndex('// --- Admin Activity Logs Viewer ---');
const photoStart = lineIndex('// --- Photo Gallery Management ---');
const autoInitStart = lineIndex('// --- Auto-Initialize ---');

const adminParts = [
  lines.slice(adminGridStart + 1, updateProfileStart),
  lines.slice(adminLogsStart + 1, photoStart)
];

const profParts = [
  lines.slice(updateProfileStart, profConnStart),
  lines.slice(profConnStart + 1, adminLogsStart),
  lines.slice(photoStart + 1, autoInitStart)
];

function exportFunctions(body) {
  return body
    .replace(/^async function /gm, 'export async function ')
    .replace(/^function /gm, 'export function ')
    .replace(/^window\.openImageModal = function\(src\)/m, 'export function openImageModal(src)');
}

const adminBody = exportFunctions(adminParts.flat().join('\n').trim());
const profBody = exportFunctions(profParts.flat().join('\n').trim());

const adminContent = [
  "import { BASE_ORIGIN, API_URL, CATEGORY_META } from './globals.js';",
  "import { showAlert, getPendingApprovalBannerHtml } from './uiHelpers.js';",
  "import { t, applyStaticTranslations } from './i18n.js';",
  "import { renderSpecialtyDropdown, setupLocationDropdowns } from './helpers.js';",
  "import { addPhotoToGrid, openPendingConnectionsModal } from './professional.js';",
  '',
  adminBody,
  '',
  'window.openImageModal = openImageModal;',
  ''
].join('\n');

const profContent = [
  "import { BASE_ORIGIN, API_URL, CATEGORY_META } from './globals.js';",
  "import { showAlert, getPendingApprovalBannerHtml } from './uiHelpers.js';",
  "import { t, applyStaticTranslations } from './i18n.js';",
  "import { renderSpecialtyDropdown, setupLocationDropdowns } from './helpers.js';",
  '',
  profBody,
  ''
].join('\n');

fs.writeFileSync(path.join(jsDir, 'admin.js'), adminContent);
fs.writeFileSync(path.join(jsDir, 'professional.js'), profContent);

let app = lines.slice(0, adminGridStart).join('\n');

if (!app.includes("from './admin.js'")) {
  app = app.replace(
    /} from '\.\/discovery\.js';\n/,
    `} from './discovery.js';\nimport { loadDashboard } from './admin.js';\nimport { loadProfDashboard } from './professional.js';\n`
  );
}

app += '\n' + lines.slice(autoInitStart).join('\n');

fs.writeFileSync(appPath, app);
console.log('admin.js + professional.js extracted; app.js slimmed to bootstrap.');
