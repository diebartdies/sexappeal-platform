const PotentialProfessional = require('../models/PotentialProfessional');
const platformService = require('./whatsappPlatformService');
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

function getStatus() {
  const platformStatus = platformService.isClientReady()
    ? { phase: 'ready', qr: null }
    : { phase: platformService.getQrCode() ? 'qr' : 'idle', qr: platformService.getQrCode() };

  if (BUSY_PHASES.has(state.phase) || state.phase === 'complete' || state.phase === 'error') {
    return {
      ...state,
      qr: state.phase === 'qr' || platformStatus.phase === 'qr' ? (state.qr || platformStatus.qr) : null
    };
  }

  if (platformStatus.qr) {
    return { ...state, phase: 'qr', qr: platformStatus.qr };
  }

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

async function waitForClientReady() {
  state.phase = platformService.getQrCode() ? 'qr' : 'initializing';

  const pollQr = setInterval(() => {
    const qr = platformService.getQrCode();
    if (qr) {
      state.phase = 'qr';
      state.qr = qr;
    }
  }, 1000);

  try {
    await platformService.waitForReady();
    state.qr = null;
  } finally {
    clearInterval(pollQr);
  }
}

async function processTargets(targets, options = {}) {
  const { customMessage } = options;
  state.phase = 'sending';
  state.qr = null;

  const client = platformService.getSharedClient();

  for (const target of targets) {
    state.currentLead = target.alias || target.phone;

    try {
      const cleanPhone = normalizeWhatsAppPhone(target.phone);
      if (!cleanPhone) {
        state.skipped += 1;
        continue;
      }

      const chatId = `${cleanPhone}@c.us`;
      const alias = (target.alias && String(target.alias).trim()) || 'hermosa';
      const messageToSend = customMessage
        ? String(customMessage).replace(/\{alias\}/gi, alias)
        : buildProfessionalInviteMessage(alias);
      await client.sendMessage(chatId, messageToSend);

      if (target.leadDoc) {
        target.leadDoc.status = 'contacted';
        await target.leadDoc.save();
      }

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

async function processLeads(leads) {
  const targets = leads.map((lead) => ({ phone: lead.phone, alias: lead.alias, leadDoc: lead }));
  await processTargets(targets);
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

async function resolveTargetedRecipients({ leadIds = [], professionalIds = [] }) {
  const User = require('../models/User');
  const { resolveWhatsappNumber } = require('../utils/contactNumber');
  const targets = [];

  if (leadIds.length) {
    const leads = await PotentialProfessional.find({ _id: { $in: leadIds } });
    leads.forEach((lead) => {
      targets.push({ phone: lead.phone, alias: lead.alias, leadDoc: lead });
    });
  }

  if (professionalIds.length) {
    const professionals = await User.find({ _id: { $in: professionalIds }, role: 'professional' });
    professionals.forEach((user) => {
      const phone = resolveWhatsappNumber(user.professionalProfile || {});
      if (phone) {
        targets.push({
          phone,
          alias: user.professionalProfile?.alias || user.email
        });
      }
    });
  }

  return targets;
}

async function startTargetedOutreach({ leadIds = [], professionalIds = [], message = '' } = {}) {
  if (BUSY_PHASES.has(state.phase)) {
    return getStatus();
  }

  const targets = await resolveTargetedRecipients({ leadIds, professionalIds });

  if (targets.length === 0) {
    state.phase = 'complete';
    state.lastError = 'No valid WhatsApp recipients found';
    state.total = 0;
    state.finishedAt = new Date();
    return getStatus();
  }

  resetRunCounters(targets.length);
  state.phase = 'initializing';

  try {
    await waitForClientReady();
    await processTargets(targets, { customMessage: message && String(message).trim() ? String(message).trim() : null });
  } catch (err) {
    state.phase = 'error';
    state.lastError = err.message;
    state.finishedAt = new Date();
  }

  return getStatus();
}

function startTargetedOutreachBackground(options) {
  if (BUSY_PHASES.has(state.phase)) {
    return getStatus();
  }

  startTargetedOutreach(options).catch((err) => {
    state.phase = 'error';
    state.lastError = err.message;
    state.finishedAt = new Date();
  });

  return getStatus();
}

module.exports = {
  getStatus,
  startBulkOutreach,
  startBulkOutreachBackground,
  startTargetedOutreach,
  startTargetedOutreachBackground
};
