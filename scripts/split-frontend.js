const fs = require('fs');
const path = require('path');

const appPath = path.join(__dirname, '../public/js/app.js');
const lines = fs.readFileSync(appPath, 'utf8').split(/\r?\n/);

// --- helpers.js ---
const helperLines = lines.slice(4308, 4628);
helperLines[0] = helperLines[0].replace('async function renderSpecialtyDropdown', 'export async function renderSpecialtyDropdown');
helperLines[helperLines.length - 1] = helperLines[helperLines.length - 1]; // closing brace
const setupIdx = helperLines.findIndex(l => l.startsWith('async function setupLocationDropdowns'));
helperLines[setupIdx] = helperLines[setupIdx].replace('async function setupLocationDropdowns', 'export async function setupLocationDropdowns');
const helpersContent = [
  "import { API_URL } from './globals.js';",
  "import { t, applyStaticTranslations } from './i18n.js';",
  '',
  ...helperLines.map(l => l.replace(
    "if (typeof applyCountsToDropdowns === 'function')",
    "if (typeof window.applyCountsToDropdowns === 'function')"
  )),
  ''
].join('\n');
fs.writeFileSync(path.join(__dirname, '../public/js/helpers.js'), helpersContent);

// --- authFlows.js ---
const googleStart = lines.findIndex(l => l === '// --- Google Auth Injection ---');
const authStart = lines.findIndex(l => l === '// --- Auth Handling ---');
const discoveryStart = lines.findIndex(l => l === '// --- Discovery ---');

let googleLines = lines.slice(googleStart + 1, authStart);
googleLines[0] = googleLines[0].replace('function injectGoogleLogin', 'export function injectGoogleLogin');
googleLines = googleLines.map(l => {
  if (l.includes("client_id: 'YOUR_GOOGLE_CLIENT_ID")) {
    return "                client_id: GOOGLE_CLIENT_ID,";
  }
  return l;
});
// Remove duplicate redirect lines in google callback
const googleText = googleLines.join('\n').replace(
  /(window\.location\.href = '\/perfil\/' \+ encodeURIComponent\(data\.user\.professionalProfile\?\.alias \|\| ''\);\s*){2,}/g,
  "$1"
);

let authLines = lines.slice(authStart + 1, discoveryStart);
const authText = authLines.join('\n');
const ageGateMatch = authText.match(/\/\/ Aggressive Click Interceptor[\s\S]*?\}, true\); \/\/ <-- The "true"/);
const formsMatch = authText.match(/document\.addEventListener\('DOMContentLoaded', \(\) => \{[\s\S]*?\}\);\s*\n\/\/ Register[\s\S]*$/);

if (!ageGateMatch || !formsMatch) {
  console.error('Failed to parse auth sections');
  process.exit(1);
}

const authFlowsContent = [
  "import { API_URL, BASE_ORIGIN, GOOGLE_CLIENT_ID } from './globals.js';",
  "import { showAlert } from './uiHelpers.js';",
  "import { t } from './i18n.js';",
  '',
  googleText.trim(),
  '',
  'export function setupLandingPageAgeGate() {',
  ageGateMatch[0].replace(/^\/\/ Aggressive Click Interceptor[\s\S]*?\n/, ''),
  '}',
  '',
  'export function initAuthForms() {',
  formsMatch[0].trim(),
  '}',
  ''
].join('\n');

fs.writeFileSync(path.join(__dirname, '../public/js/authFlows.js'), authFlowsContent);

// --- Patch app.js ---
let app = lines.join('\n');

// Update imports at top
const newImports = `// SexAppeal Prototype Logic
import { BASE_ORIGIN, API_URL, CATEGORY_META } from './globals.js';
import { showAlert } from './uiHelpers.js';
import { t, applyStaticTranslations } from './i18n.js';
import { injectGlobalStyles, injectPlausible, initGlobalTopBar, initPrivacyShield } from './ui.js';
import { setupLandingPageAgeGate, initAuthForms } from './authFlows.js';
import { renderSpecialtyDropdown, setupLocationDropdowns } from './helpers.js';

setupLandingPageAgeGate();
initAuthForms();

`;

app = app.replace(/^\/\/ SexAppeal Prototype Logic[\s\S]*?let currentDiscoveryPage = 1;\n\n/, newImports);

// Remove privacy shield block (now in ui.js) through discovery
app = app.replace(/\n\/\/ --- Privacy Shield Badge ---[\s\S]*?\n\/\/ --- Discovery ---\n/, '\n// --- Discovery ---\n');

// Remove helpers section
app = app.replace(/\n\/\/ --- Helpers ---[\s\S]*?\n\/\/ --- Professional Dedicated 5-Block Editing Dashboard ---\n/, '\n// --- Professional Dedicated 5-Block Editing Dashboard ---\n');

// After applyCountsToDropdowns function, expose on window - find and patch
if (!app.includes('window.applyCountsToDropdowns')) {
  app = app.replace(
    /(async function applyCountsToDropdowns\(\) \{[\s\S]*?\n\})\n/,
    '$1\nwindow.applyCountsToDropdowns = applyCountsToDropdowns;\n\n'
  );
}

fs.writeFileSync(appPath, app);
console.log('Split complete. helpers.js + authFlows.js created, app.js patched.');
