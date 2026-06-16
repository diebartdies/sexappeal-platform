const fs = require('fs');

const CHROME_CANDIDATES = [
  // Honor explicit env overrides first (e.g. PUPPETEER_EXECUTABLE_PATH set in
  // the Docker image). If the env path doesn't exist it's skipped below.
  process.env.PUPPETEER_EXECUTABLE_PATH,
  process.env.CHROME_PATH,
  // Linux / Alpine system chromium. The apk `chromium` package installs the
  // binary as `chromium-browser` on most versions and `chromium` on some, so
  // include both for a robust fallback (backward compatible — Windows below).
  '/usr/bin/chromium-browser',
  '/usr/bin/chromium',
  // Windows (local dev) fallbacks.
  'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
  'C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe',
  'C:\\Program Files\\Microsoft\\Edge\\Application\\msedge.exe'
].filter(Boolean);

function resolveBrowserExecutable() {
  for (const candidate of CHROME_CANDIDATES) {
    if (fs.existsSync(candidate)) return candidate;
  }
  return undefined;
}

module.exports = {
  resolveBrowserExecutable
};
