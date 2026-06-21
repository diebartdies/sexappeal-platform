// ---------------------------------------------------------------------------
// ⚠️  STANDALONE PROCESS — RUN ONLY WHEN THE APP IS NOT HOLDING THE WHATSAPP CLIENT.
//
// This script spins up its OWN copy of the platform whatsapp-web.js singleton
// (LocalAuth clientId 'platform', session dir .wwebjs_auth/session-platform). If
// the running app container (sexappeal_app) already has that client connected
// (admin linked it via the dashboard, kept alive by autoReconnectIfSessionSaved),
// launching this script as a SECOND process on the same session dir will break
// the singleton lock and disconnect WhatsApp.
//
// When the app IS holding the client (the normal case in production), DO NOT run
// this script. Use the IN-APP drip instead — services/whatsappDripRunner.js,
// controllable from the admin dashboard (WhatsApp config → "Envío automático") —
// which reuses the app's already-connected shared client. This file is kept only
// for offline/standalone use (e.g. a box where the app is stopped).
// ---------------------------------------------------------------------------

require('dotenv').config();
const fs = require('fs');
const qrcode = require('qrcode-terminal');
const connectDB = require('./config/database');
const config = require('./config/appConfig');
const platformService = require('./services/whatsappPlatformService');
const PP = require('./models/PotentialProfessional');
const {
  normalizeWhatsAppPhone,
  buildSanitizedWhatsAppCaption,
  BRAND_IMAGE_PATH,
  WHATSAPP_CONTACT_URL
} = require('./utils/professionalInviteMessage');

// ---------------------------------------------------------------------------
// WhatsApp batch drip scheduler.
//
// Sends up to `batchSize` messages (default 100), pauses `batchPauseMinutes`
// (default 30), then repeats until no pending leads remain.
// ---------------------------------------------------------------------------

const cfg = config.whatsappDrip;
const BATCH_SIZE = Math.max(1, Number(cfg.batchSize) || 50);
const BATCH_PAUSE_MS = Math.max(1, Number(cfg.batchPauseMinutes) || 30) * 60 * 1000;
const BATCHES_PER_DAY = Math.max(1, Number(cfg.batchesPerDay) || 5);
const DAILY_CAP = BATCH_SIZE * BATCHES_PER_DAY;
const INTER_MESSAGE_DELAY_MS = Math.max(0, Number(cfg.interMessageDelayMs) || 0);
const REGISTER_CHECK_TIMEOUT_MS = Number(cfg.registerCheckTimeoutMs) || 30000;
const SEND_TIMEOUT_MS = Number(cfg.sendTimeoutMs) || 60000;
const BRAND_IMAGE = cfg.brandImagePath || BRAND_IMAGE_PATH;

// Legacy leads predate the WhatsApp `status` field defaulting, so some carry no
// value. Treat missing/null exactly like 'pending' (mirrors the SMS engine's
// robust selection) so "next pending" actually targets those existing leads.
const PENDING_WA_QUERY = {
  $or: [
    { status: 'pending' },
    { status: { $exists: false } },
    { status: null }
  ]
};

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

function log(...args) {
  console.log(new Date().toISOString(), ...args);
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

async function sleepUntil(date) {
  const ms = date.getTime() - Date.now();
  if (ms > 0) await sleep(ms);
}

async function runBatch(batchNumber) {
  log(`Batch ${batchNumber}/${BATCHES_PER_DAY} start — up to ${BATCH_SIZE} messages`);

  for (let i = 0; i < BATCH_SIZE; i += 1) {
    let lead;
    try {
      lead = await nextPendingLead();
    } catch (err) {
      log('WARN could not query next lead:', err.message);
      break;
    }

    if (!lead) {
      log('ALL DONE - no pending leads left. Exiting.');
      process.exit(0);
    }

    await sendOneLead(lead);

    if (INTER_MESSAGE_DELAY_MS > 0 && i < BATCH_SIZE - 1) {
      await sleep(INTER_MESSAGE_DELAY_MS);
    }
  }

  const remaining = await countPendingLeads();
  if (remaining === 0) {
    log('ALL DONE - no pending leads left. Exiting.');
    process.exit(0);
  }

  const nextBatchAt = new Date(Date.now() + BATCH_PAUSE_MS);
  log(`Batch ${batchNumber}/${BATCHES_PER_DAY} complete. Pending=${remaining}. Sleeping until ${nextBatchAt.toISOString()}`);
  await sleepUntil(nextBatchAt);
}

async function nextPendingLead() {
  return PP.findOne(PENDING_WA_QUERY).sort({ createdAt: 1 });
}

async function countPendingLeads() {
  return PP.countDocuments(PENDING_WA_QUERY);
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

// Send one lead: validate number -> confirm it's on WhatsApp -> send image+caption.
async function sendOneLead(lead) {
  const label = lead.alias || lead.phone;
  const cleanPhone = normalizeWhatsAppPhone(lead.phone);
  if (!cleanPhone) {
    log('REJECT', label, '- invalid phone number');
    await markRejected(lead, 'invalid phone number');
    return;
  }

  const chatId = `${cleanPhone}@c.us`;
  const client = platformService.getSharedClient();

  // Pre-validate the number is on WhatsApp. Sending to a non-existent number is
  // what hangs/loops, so unregistered numbers are rejected before any send.
  let registered;
  try {
    registered = await withTimeout(
      client.isRegisteredUser(chatId),
      REGISTER_CHECK_TIMEOUT_MS,
      'isRegisteredUser'
    );
  } catch (err) {
    // Could not determine registration (timeout/session glitch): transient.
    log('FAIL', label, '- registration check failed:', err.message);
    await markFailed(lead, `registration check: ${err.message}`);
    return;
  }

  if (!registered) {
    log('REJECT', label, '- number not on WhatsApp');
    await markRejected(lead, 'number not on WhatsApp');
    return;
  }

  const alias = (lead.alias && String(lead.alias).trim()) || 'hermosa';
  const caption = buildSanitizedWhatsAppCaption(alias);

  try {
    const messageId = await withTimeout(
      platformService.sendMessage(lead.phone, caption, {
        mediaPath: BRAND_IMAGE,
        timeoutMs: SEND_TIMEOUT_MS
      }),
      SEND_TIMEOUT_MS + 5000,
      'sendMessage'
    );
    log('SENT', label, '+' + cleanPhone, '- id:', typeof messageId === 'string' ? messageId : '(no id)');
    await markSent(lead, messageId);
  } catch (err) {
    log('FAIL', label, '- send error:', err.message);
    await markFailed(lead, err.message);
  }
}

// Bring the platform WhatsApp client up, printing a QR if a login is needed.
async function ensureWhatsAppReady() {
  log('Connecting WhatsApp client (will print a QR if a login is needed)...');
  const qrPoll = setInterval(() => {
    const qr = platformService.getQrCode();
    if (qr) {
      console.log('\n📱 Scan this QR code with WhatsApp:');
      qrcode.generate(qr, { small: true });
    }
  }, 2000);

  try {
    await platformService.waitForReady();
    log('WhatsApp client ready.');
  } finally {
    clearInterval(qrPoll);
  }
}

async function main() {
  log('--- WhatsApp Batch Drip starting ---');
  log(`Batch size     : ${BATCH_SIZE} messages`);
  log(`Batches/day    : ${BATCHES_PER_DAY} (daily cap ${DAILY_CAP} cold sends)`);
  log(`Batch pause    : ${cfg.batchPauseMinutes || 30} minutes`);
  log(`Brand image    : ${BRAND_IMAGE}`);
  log(`Reply contact  : ${WHATSAPP_CONTACT_URL}`);
  log(`Alias domain   : ${cfg.aliasDomain ? cfg.aliasDomain : '(none — website link omitted; replies go to WhatsApp)'}`);

  if (!fs.existsSync(BRAND_IMAGE)) {
    log(`WARNING: brand image not found at ${BRAND_IMAGE}. A raster logo (PNG/JPG) must be supplied before launch — sends will fail until then.`);
  }

  await connectDB();

  const pending = await countPendingLeads();
  log(`Pending WhatsApp leads: ${pending}`);
  if (pending === 0) {
    log('ALL DONE - no pending leads to contact. Exiting.');
    process.exit(0);
  }

  await ensureWhatsAppReady();

  for (let batch = 1; batch <= BATCHES_PER_DAY; batch += 1) {
    await runBatch(batch);
  }

  log(`Daily limit reached (${DAILY_CAP} cold sends). Exiting — restart tomorrow.`);
  process.exit(0);
}

main().catch((err) => {
  log('FATAL', (err && err.message) || String(err));
  process.exit(1);
});
