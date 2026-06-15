const fs = require('fs');
const os = require('os');

const PROD_DEPLOY_PATHS = [
  '/root/sexappeal-platform',
  '/opt/sexappeal-platform'
];

function localAddresses() {
  const addrs = new Set(['127.0.0.1', '::1']);
  for (const list of Object.values(os.networkInterfaces())) {
    if (!list) continue;
    for (const iface of list) {
      if (iface && iface.address) addrs.add(iface.address);
    }
  }
  return addrs;
}

/**
 * Monitoring must run OUTSIDE 91.208.206.35 (e.g. your Windows admin PC).
 * If the watch runs on the same host it probes, a real outage stops alerts too.
 */
function assertExternalWatcher(serverIp) {
  if (process.env.WATCH_ALLOW_ON_SERVER === '1') {
    console.warn('[server-watch] WATCH_ALLOW_ON_SERVER=1 — external-only guard disabled.');
    return;
  }

  const cwd = process.cwd().replace(/\\/g, '/').toLowerCase();
  if (process.platform === 'linux') {
    if (PROD_DEPLOY_PATHS.some((p) => cwd.startsWith(p))) {
      exitBlocked('script is running on the production server filesystem');
    }
    if (fs.existsSync('/.dockerenv')) {
      exitBlocked('script is running inside a container on the server');
    }
  }

  if (localAddresses().has(serverIp)) {
    exitBlocked(`target IP ${serverIp} is assigned to this machine`);
  }
}

function exitBlocked(reason) {
  console.error('');
  console.error('[server-watch] Must run from OUTSIDE the virtual server.');
  console.error(`  Blocked: ${reason}.`);
  console.error('  Use your Windows PC (same place as upload_to_server.bat), not SSH on 91.208.206.35.');
  console.error('');
  process.exit(2);
}

module.exports = { assertExternalWatcher };
