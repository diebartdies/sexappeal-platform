const PotentialProfessional = require('../models/PotentialProfessional');
const platformService = require('./whatsappPlatformService');
const config = require('../config/appConfig');
const {
  normalizeWhatsAppPhone,
  buildSanitizedWhatsAppCaption,
  BRAND_IMAGE_PATH
} = require('../utils/professionalInviteMessage');

// ---------------------------------------------------------------------------
// In-app WhatsApp "quarter drip" runner (SINGLETON).
//
// This is the in-process twin of the standalone scripts/whatsapp_drip.js. It
// ports the exact same quarter-drip cadence and per-lead send/mark logic, but
// instead of a blocking `for(;;)` loop + `process.exit` it schedules each send
// with setTimeout so it lives inside the running app's event loop.
//
// CRITICAL — single shared client only:
//   The platform whatsapp-web.js client is a module-level SINGLETON in
//   services/whatsappPlatformService.js (LocalAuth clientId 'platform'). The
//   live app container already holds that client connected. This runner MUST
//   reuse that one connected client and MUST NEVER instantiate a second Client
//   (a second client on the same session dir would break the lock and drop the
//   connection). To guarantee that, this module:
//     - never requires whatsapp-web.js / never calls `new Client`
//     - never calls startRegistration()/destroyClient()/createClient()
//     - refuses to start unless platformService.isClientReady() is already true
//     - re-checks isClientReady() before every send (stops cleanly if the shared
//       client goes away) so it never triggers a fresh client launch
//     - only ever calls platformService.sendMessage(...) and (guarded by a prior
//       isClientReady() check) getSharedClient() for the registration probe —
//       both of which are no-ops re: client creation once the client is ready.
// ---------------------------------------------------------------------------

const cfg = config.whatsappDrip;
const PER_HOUR = Math.max(1, Number(cfg.messagesPerHour) || 4);
const REGISTER_CHECK_TIMEOUT_MS = Number(cfg.registerCheckTimeoutMs) || 30000;
const SEND_TIMEOUT_MS = Number(cfg.sendTimeoutMs) || 60000;
const BRAND_IMAGE = cfg.brandImagePath || BRAND_IMAGE_PATH;

// Legacy leads predate the WhatsApp `status` field defaulting, so some carry no
// value. Treat missing/null exactly like 'pending' (mirrors whatsapp_drip.js)
// so "next pending" actually targets those existing leads.
const PENDING_WA_QUERY = {
  $or: [
    { status: 'pending' },
    { status: { $exists: false } },
    { status: null }
  ]
};

const state = {
  running: false,
  phase: 'idle', // idle | running | waiting_hour | completed | stopped | disconnected | error
  startedAt: null,
  finishedAt: null,
  sent: 0,
  failed: 0,
  rejected: 0,
  lastSendAt: null,
  lastResult: null,
  nextSendAt: null,
  lastError: null,
  // Scheduler internals (not part of the public status payload).
  timer: null,
  queue: [],            // upcoming target Dates within the current planned hour
  plannedHourStart: null // ms of the hour we already laid out targets for
};

function log(...args) {
  console.log(new Date().toISOString(), '[wa-drip]', ...args);
}

// Race a promise against a timeout so a hung whatsapp-web.js call cannot stall
// the scheduler forever.
function withTimeout(promise, ms, label) {
  let timer;
  const timeout = new Promise((_, reject) => {
    timer = setTimeout(() => reject(new Error(`${label} timed out after ${ms}ms`)), ms);
  });
  return Promise.race([Promise.resolve(promise), timeout]).finally(() => clearTimeout(timer));
}

// Compute the `PER_HOUR` send-times for the hour starting at `hourStart`: one
// random instant inside each equal quarter of the hour (verbatim from whatsapp_drip.js).
function computeQuarterTargets(hourStart) {
  const quarterMs = (3600000 / PER_HOUR);
  const targets = [];
  for (let q = 0; q < PER_HOUR; q += 1) {
    const base = hourStart.getTime() + q * quarterMs;
    const offsetMs = Math.floor(Math.random() * quarterMs);
    targets.push(new Date(base + offsetMs));
  }
  return targets;
}

async function nextPendingLead() {
  return PotentialProfessional.findOne(PENDING_WA_QUERY).sort({ createdAt: 1 });
}

async function countPendingLeads() {
  return PotentialProfessional.countDocuments(PENDING_WA_QUERY);
}

// Best-effort persistence: a DB hiccup must never abort the run.
async function saveLead(lead, label) {
  try {
    await lead.save();
  } catch (err) {
    log('WARN failed to persist lead', label, '-', err.message);
  }
}

async function markSent(lead, messageId) {
  lead.status = 'contacted';
  lead.whatsappSentAt = new Date();
  lead.whatsappMessageId = typeof messageId === 'string' ? messageId : undefined;
  lead.whatsappError = undefined;
  await saveLead(lead, 'sent');
}

async function markRejected(lead, reason) {
  lead.status = 'rejected';
  lead.whatsappError = reason ? String(reason).slice(0, 300) : 'rejected';
  await saveLead(lead, 'rejected');
}

async function markFailed(lead, error) {
  lead.status = 'failed';
  lead.whatsappError = (error && String(error).slice(0, 300)) || 'unknown error';
  await saveLead(lead, 'failed');
}

// Update the live counters + last-result snapshot for getStatus().
function recordResult(kind, label, detail) {
  state.lastSendAt = new Date();
  if (kind === 'sent') {
    state.sent += 1;
    state.lastResult = `SENT ${label}`;
    log('SENT', label, '- id:', detail);
  } else if (kind === 'rejected') {
    state.rejected += 1;
    state.lastResult = `REJECTED ${label}: ${detail}`;
    log('REJECT', label, '-', detail);
  } else {
    state.failed += 1;
    state.lastResult = `FAILED ${label}: ${detail}`;
    log('FAIL', label, '-', detail);
  }
}

// Send one lead: validate number -> confirm it's on WhatsApp -> send image+caption.
// Ported from whatsapp_drip.js (same content + same mark logic), augmented with
// the in-app counter/last-result tracking.
async function sendOneLead(lead) {
  const label = lead.alias || lead.phone;
  const cleanPhone = normalizeWhatsAppPhone(lead.phone);
  if (!cleanPhone) {
    await markRejected(lead, 'invalid phone number');
    recordResult('rejected', label, 'invalid phone number');
    return;
  }

  // Pre-validate the number is on WhatsApp (web.js only; Twilio skips).
  let registered;
  try {
    registered = await withTimeout(
      platformService.isRegisteredUser(cleanPhone),
      REGISTER_CHECK_TIMEOUT_MS,
      'isRegisteredUser'
    );
  } catch (err) {
    await markFailed(lead, `registration check: ${err.message}`);
    recordResult('failed', label, `registration check: ${err.message}`);
    return;
  }

  if (!registered) {
    await markRejected(lead, 'number not on WhatsApp');
    recordResult('rejected', label, 'number not on WhatsApp');
    return;
  }

  const alias = (lead.alias && String(lead.alias).trim()) || 'hermosa';
  const caption = buildSanitizedWhatsAppCaption(alias);

  try {
    const messageId = await withTimeout(
      platformService.sendMessage(lead.phone, caption, {
        mediaPath: BRAND_IMAGE,
        timeoutMs: SEND_TIMEOUT_MS,
        alias
      }),
      SEND_TIMEOUT_MS + 5000,
      'sendMessage'
    );
    await markSent(lead, messageId);
    recordResult('sent', label, typeof messageId === 'string' ? messageId : '(no id)');
  } catch (err) {
    await markFailed(lead, err.message);
    recordResult('failed', label, err.message);
  }
}

function clearTimer() {
  if (state.timer) {
    clearTimeout(state.timer);
    state.timer = null;
  }
}

// Stop the run and freeze its public state. `phase` records WHY it stopped.
function finish(phase) {
  clearTimer();
  state.running = false;
  state.phase = phase;
  state.finishedAt = new Date();
  state.nextSendAt = null;
  state.queue = [];
  state.plannedHourStart = null;
}

// Fire the send for one quarter: pick the next pending lead, verify the shared
// client is still connected, send. Every failure path is contained so a single
// bad lead (or a DB hiccup) can never crash the app — the scheduler just rolls
// on to the next quarter.
async function fireSend() {
  if (!state.running) return;

  let lead;
  try {
    lead = await nextPendingLead();
  } catch (err) {
    // Transient DB error: keep running, try again next quarter.
    state.lastError = `Could not query next lead: ${err.message}`;
    log('WARN', state.lastError, '- will retry next quarter');
    return;
  }

  if (!lead) {
    log('ALL DONE - no pending leads left. Stopping drip.');
    finish('completed');
    return;
  }

  // Hard gate: only ever send through the already-connected shared client. If it
  // is not ready (e.g. the admin's linked session dropped), STOP cleanly instead
  // of doing anything that could spin up a second client.
  if (!platformService.isClientReady()) {
    state.lastError = 'WhatsApp client not connected — drip stopped. Re-link WhatsApp and start again.';
    log('STOP', state.lastError);
    finish('disconnected');
    return;
  }

  await sendOneLead(lead);
}

// Recursively schedule the next quarter target with setTimeout. Plans one hour
// at a time (re-randomizing the quarters each hour) exactly like whatsapp_drip.js,
// but never blocks the event loop.
function scheduleNext() {
  if (!state.running) return;
  clearTimer();

  if (state.queue.length === 0) {
    const now = new Date();
    const hourStart = new Date(now);
    hourStart.setMinutes(0, 0, 0);
    const hourStartMs = hourStart.getTime();
    const nextHourStartMs = hourStartMs + 3600000;

    // This hour was already laid out and exhausted -> wait for the next hour.
    if (state.plannedHourStart === hourStartMs) {
      state.nextSendAt = null;
      state.phase = 'waiting_hour';
      log('Hour complete. Sleeping until next hour', new Date(nextHourStartMs).toISOString());
      state.timer = setTimeout(scheduleNext, Math.max(0, nextHourStartMs - Date.now()));
      return;
    }

    // Lay out this hour's quarter targets; skip any already in the past (started
    // mid-hour) to keep the strict 1-per-quarter rate.
    state.plannedHourStart = hourStartMs;
    state.queue = computeQuarterTargets(hourStart).filter((target) => target.getTime() > Date.now());
    log('Hour plan', hourStart.toISOString(), '-> targets:',
      state.queue.map((t) => t.toISOString()).join(', ') || '(none left this hour)');

    if (state.queue.length === 0) {
      state.nextSendAt = null;
      state.phase = 'waiting_hour';
      state.timer = setTimeout(scheduleNext, Math.max(0, nextHourStartMs - Date.now()));
      return;
    }
  }

  state.phase = 'running';
  const target = state.queue[0];
  state.nextSendAt = target;
  const delay = Math.max(0, target.getTime() - Date.now());
  log('Next send at', target.toISOString());

  state.timer = setTimeout(() => {
    state.queue.shift();
    // fireSend is fully self-contained; guard against any unexpected throw so a
    // rejected promise in this timer callback can never take down the process.
    Promise.resolve()
      .then(fireSend)
      .catch((err) => {
        state.lastError = (err && err.message) || String(err);
        log('WARN unexpected send error:', state.lastError);
      })
      .finally(() => {
        scheduleNext();
      });
  }, delay);
}

function resetRun() {
  state.sent = 0;
  state.failed = 0;
  state.rejected = 0;
  state.lastSendAt = null;
  state.lastResult = null;
  state.nextSendAt = null;
  state.lastError = null;
  state.finishedAt = null;
  state.queue = [];
  state.plannedHourStart = null;
}

// Start the drip. Idempotent: refuses if already running. Refuses (with a clear
// message) if the shared WhatsApp client is not connected or there is nothing to
// send. Returns { ok, error? }.
async function start() {
  if (state.running) {
    return { ok: false, error: 'Drip is already running.' };
  }

  const twilioWa = require('./twilioWhatsAppService');
  const templateBlock = twilioWa.getColdOutreachBlockReason();
  if (templateBlock) {
    return { ok: false, error: templateBlock, templatePending: true };
  }

  if (!platformService.isClientReady()) {
    return {
      ok: false,
      error: platformService.isTwilioApiMode()
        ? 'Twilio WhatsApp is not configured. Set Twilio creds on the server and save the sender number in Admin.'
        : 'WhatsApp is not connected. Link WhatsApp first, then start the drip.',
      notConnected: true
    };
  }

  let pending;
  try {
    pending = await countPendingLeads();
  } catch (err) {
    return { ok: false, error: `Could not query pending leads: ${err.message}` };
  }

  if (pending === 0) {
    return { ok: false, error: 'No pending leads to contact.' };
  }

  resetRun();
  state.running = true;
  state.phase = 'running';
  state.startedAt = new Date();
  log(`--- WhatsApp Quarter Drip (in-app) starting --- pending=${pending}, rate=${PER_HOUR}/hour, brand image=${BRAND_IMAGE}`);
  scheduleNext();
  return { ok: true };
}

// Stop the drip. Idempotent: safe to call when not running.
function stop() {
  if (!state.running) {
    return { ok: true, alreadyStopped: true };
  }
  log('Drip stopped by admin.');
  finish('stopped');
  return { ok: true };
}

// Public status snapshot for the admin UI / status endpoint.
async function getStatus() {
  let pending = null;
  try {
    pending = await countPendingLeads();
  } catch {
    pending = null;
  }

  return {
    running: state.running,
    phase: state.phase,
    startedAt: state.startedAt,
    finishedAt: state.finishedAt,
    messagesPerHour: PER_HOUR,
    pending,
    sent: state.sent,
    failed: state.failed,
    rejected: state.rejected,
    lastSendAt: state.lastSendAt,
    lastResult: state.lastResult,
    nextSendAt: state.running ? state.nextSendAt : null,
    lastError: state.lastError,
    clientReady: platformService.isClientReady()
  };
}

module.exports = {
  start,
  stop,
  getStatus
};
