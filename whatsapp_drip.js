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
// WhatsApp "quarter drip" scheduler.
//
// Sends EXACTLY `messagesPerHour` messages per hour (default 4), one per equal
// quarter of the hour, at a RANDOM minute within each quarter (re-randomized
// every hour). With the default of 4 the quarters are [0-14],[15-29],[30-44],
// [45-59] and one send lands at a random minute inside each.
//
// Content is sanitized (Part B): the brand is conveyed as an IMAGE (BRAND_IMAGE_PATH)
// and the caption text never contains the banned brand word nor the real site
// domain (which contains it). See utils/professionalInviteMessage.js.
//
// Safe to run detached on the server (mirrors run_all_sms.js): connect to DB,
// connect WhatsApp, log every action with ISO timestamps to stdout, mark each
// lead sent/failed, and stop cleanly when no pending leads remain.
// ---------------------------------------------------------------------------

const cfg = config.whatsappDrip;
const PER_HOUR = Math.max(1, Number(cfg.messagesPerHour) || 4);
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

// Compute the `PER_HOUR` send-times for the hour starting at `hourStart`: one
// random instant inside each equal quarter of the hour.
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
  log('--- WhatsApp Quarter Drip starting ---');
  log(`Rate           : ${PER_HOUR} messages/hour (one per ${(60 / PER_HOUR).toFixed(1)}-min quarter, random minute within each)`);
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

  // Scheduler loop: one hour at a time, recomputing the quarter targets each hour.
  for (;;) {
    const now = new Date();
    const hourStart = new Date(now);
    hourStart.setMinutes(0, 0, 0);
    const nextHourStart = new Date(hourStart.getTime() + 3600000);
    const targets = computeQuarterTargets(hourStart);

    log('Hour plan', hourStart.toISOString(), '-> targets:',
      targets.map((t) => t.toISOString()).join(', '));

    for (let i = 0; i < targets.length; i += 1) {
      const target = targets[i];

      // If a quarter's target is already in the past (script started mid-hour),
      // that quarter is missed — skip it to keep the strict 1-per-quarter rate.
      if (target.getTime() <= Date.now()) {
        log('SKIP quarter', i + 1, '- target', target.toISOString(), 'already passed');
        continue;
      }

      log('Waiting until', target.toISOString(), `(quarter ${i + 1}/${targets.length})`);
      await sleepUntil(target);

      let lead;
      try {
        lead = await nextPendingLead();
      } catch (err) {
        log('WARN could not query next lead:', err.message, '- will retry next quarter');
        continue;
      }

      if (!lead) {
        log('ALL DONE - no pending leads left. Exiting.');
        process.exit(0);
      }

      await sendOneLead(lead);
    }

    log('Hour complete. Sleeping until next hour', nextHourStart.toISOString());
    await sleepUntil(nextHourStart);
  }
}

main().catch((err) => {
  log('FATAL', (err && err.message) || String(err));
  process.exit(1);
});
