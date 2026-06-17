const fs = require('fs');
const path = require('path');
const { Client, LocalAuth } = require('whatsapp-web.js');
const { resolveBrowserExecutable } = require('../utils/browserExecutable');
const {
  getPlatformWhatsAppPhone,
  markWhatsAppRegistered,
  formatWhatsAppPhoneDisplay
} = require('../utils/whatsappConfig');
const { normalizeWhatsAppPhone } = require('../utils/professionalInviteMessage');

const CLIENT_ID = 'platform';
const DEFAULT_TIMEOUT_MS = 180000;
const SESSION_DIR = path.resolve(process.cwd(), '.wwebjs_auth', `session-${CLIENT_ID}`);

const regState = {
  phase: 'idle',
  qr: null,
  lastError: null
};

let client = null;
let clientReady = false;
let initializing = false;
let readyWaiters = [];

function notifyReadyWaiters(err) {
  const waiters = readyWaiters.slice();
  readyWaiters = [];
  waiters.forEach(({ resolve, reject }) => {
    if (err) reject(err);
    else resolve();
  });
}

function sessionExistsOnDisk() {
  return fs.existsSync(SESSION_DIR);
}

function resetClientState() {
  client = null;
  clientReady = false;
  initializing = false;
  readyWaiters = [];
}

async function destroyClient() {
  if (!client) return;
  try {
    await client.destroy();
  } catch {
    /* ignore */
  }
  resetClientState();
  regState.phase = 'idle';
  regState.qr = null;
}

function attachClientEvents(activeClient) {
  activeClient.on('qr', (qr) => {
    regState.qr = qr;
    regState.phase = 'qr';
  });

  activeClient.on('authenticated', () => {
    regState.phase = 'initializing';
    regState.qr = null;
  });

  activeClient.on('ready', async () => {
    clientReady = true;
    regState.phase = 'ready';
    regState.qr = null;
    regState.lastError = null;
    try {
      await markWhatsAppRegistered();
    } catch (err) {
      console.error('[whatsapp] Failed to persist registration timestamp:', err.message);
    }
    notifyReadyWaiters();
  });

  activeClient.on('auth_failure', (msg) => {
    regState.phase = 'error';
    regState.lastError = msg || 'WhatsApp authentication failed';
    clientReady = false;
    notifyReadyWaiters(new Error(regState.lastError));
  });

  activeClient.on('disconnected', (reason) => {
    // Disconnected: mark not-connected and STOP — no auto-retry loop. Drop our
    // client reference so a later explicit reconnect (admin register / next
    // startup auto-reconnect) starts from a clean slate instead of a dead client.
    clientReady = false;
    regState.phase = 'error';
    regState.lastError = reason || 'WhatsApp disconnected';
    client = null;
    initializing = false;
  });
}

function createClient() {
  if (client || initializing) return client;

  initializing = true;
  const executablePath = resolveBrowserExecutable();

  client = new Client({
    authStrategy: new LocalAuth({ clientId: CLIENT_ID }),
    puppeteer: {
      headless: true,
      executablePath,
      args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage']
    }
  });

  attachClientEvents(client);
  regState.phase = 'initializing';
  regState.lastError = null;
  // SINGLE attempt only. If initialization fails, mark as disconnected/errored
  // and STOP — never loop-retry. Reset the client ref so the status reflects
  // "not connected" and a later explicit reconnect starts from a clean slate.
  client.initialize().catch((err) => {
    regState.phase = 'error';
    regState.lastError = err.message;
    clientReady = false;
    initializing = false;
    notifyReadyWaiters(err);
    client = null;
  }).finally(() => {
    initializing = false;
  });

  return client;
}

async function buildStatus() {
  const phoneNumber = await getPlatformWhatsAppPhone();
  return {
    phase: clientReady ? 'ready' : regState.phase,
    qr: regState.qr,
    lastError: regState.lastError,
    phoneNumber,
    displayPhone: formatWhatsAppPhoneDisplay(phoneNumber),
    sessionSaved: sessionExistsOnDisk(),
    connected: clientReady
  };
}

async function getRegistrationStatus() {
  return buildStatus();
}

async function startRegistration() {
  if (clientReady) {
    return buildStatus();
  }

  if (regState.phase === 'qr' || regState.phase === 'initializing') {
    return buildStatus();
  }

  await destroyClient();
  regState.phase = 'initializing';
  regState.qr = null;
  regState.lastError = null;
  createClient();
  return buildStatus();
}

function waitForReady(timeoutMs = DEFAULT_TIMEOUT_MS) {
  if (clientReady) return Promise.resolve();

  createClient();

  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => {
      reject(new Error('WhatsApp login timed out — scan the QR within 3 minutes'));
    }, timeoutMs);

    readyWaiters.push({
      resolve: () => {
        clearTimeout(timer);
        resolve();
      },
      reject: (err) => {
        clearTimeout(timer);
        reject(err);
      }
    });
  });
}

async function sendMessage(toPhone, message, options = {}) {
  const cleanPhone = normalizeWhatsAppPhone(toPhone);
  if (!cleanPhone) {
    throw new Error('Invalid WhatsApp recipient phone number');
  }

  await waitForReady(options.timeoutMs || DEFAULT_TIMEOUT_MS);
  await client.sendMessage(`${cleanPhone}@c.us`, message);
  return true;
}

function getSharedClient() {
  if (!client) createClient();
  return client;
}

// Called at server startup: if a WhatsApp session is already saved on disk,
// bring the platform (Tulio) client up automatically so a container restart /
// rebuild restores sending without a manual reconnect. No-op if already running
// or if there is no saved session (nothing to reconnect to).
function autoReconnectIfSessionSaved() {
  if (client || initializing || clientReady) return false;
  if (!sessionExistsOnDisk()) return false;
  createClient();
  return true;
}

function isClientReady() {
  return clientReady;
}

function getQrCode() {
  return regState.qr;
}

module.exports = {
  CLIENT_ID,
  DEFAULT_TIMEOUT_MS,
  getRegistrationStatus,
  startRegistration,
  waitForReady,
  sendMessage,
  destroyClient,
  getSharedClient,
  autoReconnectIfSessionSaved,
  isClientReady,
  getQrCode,
  sessionExistsOnDisk
};
