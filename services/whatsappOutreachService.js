const { Client, LocalAuth } = require('whatsapp-web.js');
const PotentialProfessional = require('../models/PotentialProfessional');
const {
  normalizeWhatsAppPhone,
  buildProfessionalInviteMessage
} = require('../utils/professionalInviteMessage');

const BUSY_PHASES = new Set(['initializing', 'qr', 'sending']);

const state = {
  phase: 'idle',
  qr: null,
  total: 0,
  sent: 0,
  failed: 0,
  skipped: 0,
  currentLead: null,
  lastError: null,
  startedAt: null,
  finishedAt: null
};

let client = null;
let queuePromise = null;
let clientReady = false;

function getStatus() {
  return { ...state };
}

function resetRunCounters(total) {
  state.total = total;
  state.sent = 0;
  state.failed = 0;
  state.skipped = 0;
  state.currentLead = null;
  state.lastError = null;
  state.qr = null;
  state.startedAt = new Date();
  state.finishedAt = null;
}

function ensureClient() {
  if (client) return;

  client = new Client({
    authStrategy: new LocalAuth(),
    puppeteer: {
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    }
  });

  client.on('qr', (qr) => {
    state.qr = qr;
    if (state.phase !== 'sending') state.phase = 'qr';
  });

  client.on('ready', () => {
    clientReady = true;
    if (queuePromise) {
      queuePromise();
      queuePromise = null;
    }
  });

  client.on('auth_failure', (msg) => {
    state.phase = 'error';
    state.lastError = msg || 'WhatsApp authentication failed';
    state.finishedAt = new Date();
  });

  client.on('disconnected', (reason) => {
    state.phase = 'error';
    state.lastError = reason || 'WhatsApp disconnected';
    state.finishedAt = new Date();
  });

  client.initialize();
}

function waitForClientReady() {
  ensureClient();
  if (clientReady) return Promise.resolve();

  return new Promise((resolve, reject) => {
    const timeout = setTimeout(() => reject(new Error('WhatsApp login timed out after 3 minutes')), 3 * 60 * 1000);
    queuePromise = () => {
      clearTimeout(timeout);
      resolve();
    };
  });
}

async function processLeads(leads) {
  state.phase = 'sending';
  state.qr = null;

  for (const lead of leads) {
    state.currentLead = lead.alias || lead.phone;

    try {
      const cleanPhone = normalizeWhatsAppPhone(lead.phone);
      if (!cleanPhone) {
        state.skipped += 1;
        continue;
      }

      const chatId = `${cleanPhone}@c.us`;
      const messageToSend = buildProfessionalInviteMessage(lead.alias);
      await client.sendMessage(chatId, messageToSend);

      lead.status = 'contacted';
      await lead.save();
      state.sent += 1;

      const delay = Math.floor(Math.random() * (30000 - 15000 + 1) + 15000);
      await new Promise((resolve) => setTimeout(resolve, delay));
    } catch (err) {
      state.failed += 1;
      state.lastError = err.message;
    }
  }

  state.currentLead = null;
  state.phase = 'complete';
  state.finishedAt = new Date();
}

async function startBulkOutreach() {
  if (BUSY_PHASES.has(state.phase)) {
    return getStatus();
  }

  const pendingLeads = await PotentialProfessional.find({ status: 'pending' }).sort({ createdAt: 1 });

  if (pendingLeads.length === 0) {
    state.phase = 'complete';
    state.lastError = 'No pending leads found';
    state.total = 0;
    state.finishedAt = new Date();
    return getStatus();
  }

  resetRunCounters(pendingLeads.length);
  state.phase = 'initializing';

  try {
    await waitForClientReady();
    await processLeads(pendingLeads);
  } catch (err) {
    state.phase = 'error';
    state.lastError = err.message;
    state.finishedAt = new Date();
  }

  return getStatus();
}

function startBulkOutreachBackground() {
  if (BUSY_PHASES.has(state.phase)) {
    return getStatus();
  }

  startBulkOutreach().catch((err) => {
    state.phase = 'error';
    state.lastError = err.message;
    state.finishedAt = new Date();
  });

  return getStatus();
}

module.exports = {
  getStatus,
  startBulkOutreach,
  startBulkOutreachBackground
};
