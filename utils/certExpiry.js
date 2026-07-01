const fs = require('fs');
const path = require('path');
const { X509Certificate } = require('crypto');

// Nginx mounts these paths on the VPS. Certbot is NOT required on the server:
// certs are renewed at source (local / CA) and uploaded via scripts/upload-ssl-certs-to-prod.bat.
const CERT_PATHS = [
  {
    id: 'sexappeal.drsrv.net.ar',
    domain: 'sexappeal.drsrv.net.ar',
    fullchainPath: path.resolve(__dirname, '..', 'certbot', 'conf', 'live', 'sexappeal.drsrv.net.ar', 'fullchain.pem'),
    renewalHint: 'Renovación automática en VPS (Certbot, timer 1x/día). Reemitir: scripts/certbot/issue-domain.sh sexappeal.drsrv.net.ar'
  },
  {
    id: 'selfappeal.drsrv.net.ar',
    domain: 'selfappeal.drsrv.net.ar',
    fullchainPath: path.resolve(__dirname, '..', 'certbot', 'conf', 'live', 'selfappeal.drsrv.net.ar', 'fullchain.pem'),
    renewalHint: 'Renovar en el VPS con: certbot renew (timer 1x/día) o scripts/certbot/issue-selfappeal.sh si hace falta reemitir'
  }
];

function computeDaysRemaining(notAfterValue) {
  const notAfter = new Date(notAfterValue);
  if (Number.isNaN(notAfter.getTime())) return null;
  const diffMs = notAfter.getTime() - Date.now();
  return Math.ceil(diffMs / (1000 * 60 * 60 * 24));
}

function readCertificateStatus(certDef) {
  if (!fs.existsSync(certDef.fullchainPath)) {
    return {
      id: certDef.id,
      domain: certDef.domain,
      status: 'missing',
      path: certDef.fullchainPath,
      renewalHint: certDef.renewalHint
    };
  }

  try {
    const pem = fs.readFileSync(certDef.fullchainPath, 'utf8');
    const cert = new X509Certificate(pem);
    const daysRemaining = computeDaysRemaining(cert.validTo);
    return {
      id: certDef.id,
      domain: certDef.domain,
      status: 'ok',
      path: certDef.fullchainPath,
      validTo: cert.validTo,
      validFrom: cert.validFrom,
      daysRemaining,
      renewalHint: certDef.renewalHint
    };
  } catch (error) {
    return {
      id: certDef.id,
      domain: certDef.domain,
      status: 'error',
      path: certDef.fullchainPath,
      error: error.message,
      renewalHint: certDef.renewalHint
    };
  }
}

function getCertificateExpiryWarnings(thresholdDays = 10) {
  const all = CERT_PATHS.map(readCertificateStatus);
  const warnings = all.filter((item) => {
    if (item.status === 'missing' || item.status === 'error') return true;
    if (!Number.isFinite(item.daysRemaining)) return true;
    return item.daysRemaining <= thresholdDays;
  });
  return { all, warnings, thresholdDays };
}

module.exports = {
  getCertificateExpiryWarnings
};

