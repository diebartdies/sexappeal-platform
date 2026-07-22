const tls = require('tls');

// Connects to nginx internal Docker service (Docker DNS: nginx). Works on any VM without
// depending on external DNS resolution. In production, nginx serves the real cert for the domain.
const CERT_DOMAINS = [
  {
    id: 'sexappeal.drsrv.net.ar',
    domain: 'sexappeal.drsrv.net.ar',
    hostname: 'nginx',
    port: 443,
    renewalHint: 'Renovación automática en VPS (Certbot, timer 1x/día). Reemitir: scripts/certbot/issue-domain.sh sexappeal.drsrv.net.ar'
  },
  {
    id: 'selfappeal.drsrv.net.ar',
    domain: 'selfappeal.drsrv.net.ar',
    hostname: 'nginx',
    port: 443,
    renewalHint: 'Renovar en el VPS con: certbot renew (timer 1x/día) o scripts/certbot/issue-selfappeal.sh si hace falta reemitir'
  }
];

function computeDaysRemaining(notAfterValue) {
  const notAfter = new Date(notAfterValue);
  if (Number.isNaN(notAfter.getTime())) return null;
  const diffMs = notAfter.getTime() - Date.now();
  return Math.ceil(diffMs / (1000 * 60 * 60 * 24));
}

function fetchCertFromServer(certDef) {
  return new Promise((resolve) => {
    const socket = tls.connect({
      host: certDef.hostname,
      port: certDef.port,
      rejectUnauthorized: false,
      timeout: 10000
    }, () => {
      const peerCert = socket.getPeerCertificate();
      socket.end();
      if (!peerCert || !peerCert.valid_to) {
        resolve({
          id: certDef.id,
          domain: certDef.domain,
          status: 'error',
          error: 'No se pudo obtener el certificado del servidor',
          renewalHint: certDef.renewalHint
        });
        return;
      }
      const daysRemaining = computeDaysRemaining(peerCert.valid_to);
      resolve({
        id: certDef.id,
        domain: certDef.domain,
        status: 'ok',
        validTo: peerCert.valid_to,
        validFrom: peerCert.valid_from,
        issuer: peerCert.issuer?.CN || peerCert.issuer?.O || '',
        subject: peerCert.subject?.CN || '',
        daysRemaining,
        renewalHint: certDef.renewalHint
      });
    });
    socket.on('error', (err) => {
      resolve({
        id: certDef.id,
        domain: certDef.domain,
        status: 'error',
        error: err.message,
        renewalHint: certDef.renewalHint
      });
    });
    socket.on('timeout', () => {
      socket.destroy();
      resolve({
        id: certDef.id,
        domain: certDef.domain,
        status: 'error',
        error: 'timeout',
        renewalHint: certDef.renewalHint
      });
    });
  });
}

async function getCertificateExpiryWarnings(thresholdDays = 10) {
  const all = await Promise.all(CERT_DOMAINS.map(fetchCertFromServer));
  const warnings = all.filter((item) => {
    if (item.status === 'error') return true;
    if (!Number.isFinite(item.daysRemaining)) return true;
    return item.daysRemaining <= thresholdDays;
  });
  return { all, warnings, thresholdDays };
}

module.exports = {
  getCertificateExpiryWarnings
};

