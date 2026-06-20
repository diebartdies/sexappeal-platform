const path = require('path');
require('dotenv').config();

const config = {
  // Environment
  env: process.env.NODE_ENV || 'development',
  port: process.env.PORT || 5000,

  // App Paths
  root: path.resolve(__dirname, '..'),
  modelsDir: path.resolve(__dirname, '..', 'models'),
  controllersDir: path.resolve(__dirname, '..', 'controllers'),
  middlewareDir: path.resolve(__dirname, '..', 'middleware'),
  uploadsDir: process.env.UPLOAD_PATH || path.resolve(__dirname, '..', 'uploads'),

  // Database
  mongoUri: process.env.MONGO_URI,

  // Security
  jwtSecret: process.env.JWT_SECRET,
  jwtExpire: process.env.JWT_EXPIRE,
  jwtCookieExpire: process.env.JWT_COOKIE_EXPIRE,
  
  // Platform Globals
  maxBioLength: 500,
  maxAliasLength: 50,
  minPasswordLength: 6,
  verificationCodeExpireMinutes: 20,
  // Strict limiter — auth (login/register/verify/recover), mutations and admin.
  // Env: RATE_LIMIT_WINDOW (ms), RATE_LIMIT_MAX. Defaults preserve prior behavior.
  rateLimitWindow: parseInt(process.env.RATE_LIMIT_WINDOW, 10) || 10 * 60 * 1000, // 10 minutes
  rateLimitMax: parseInt(process.env.RATE_LIMIT_MAX, 10) || 100,
  // Generous limiter — high-volume public discovery/vault reads (professionals
  // listing, profile/reviews, specialties, locations, public status, plus the
  // photo-click tracking that fans out during normal browsing). Sized so a
  // normal session (full pagination + count sweeps + curtain polling) never
  // trips it, while still capping abusive scraping.
  // Env: READ_RATE_LIMIT_WINDOW (ms), READ_RATE_LIMIT_MAX.
  readRateLimitWindow: parseInt(process.env.READ_RATE_LIMIT_WINDOW, 10) || 60 * 1000, // 1 minute
  readRateLimitMax: parseInt(process.env.READ_RATE_LIMIT_MAX, 10) || 600,

  // Enums
  roles: ['user', 'professional', 'admin'],
  verificationStatuses: ['pending', 'approved', 'rejected'],
  services: [
    'Massage',
    'Virtual Connection',
    'love alchemy',
    'Fantasies'
  ],
  experience: {
    statusHidden: 'Living Treasure - Veiled',
    statusRevealed: 'Living Treasure - Revealed',
    discoveryText: 'A new living treasure has been revealed.',
  },
  respectAgreement: {
    adminEmail: 'admin@drsrv.net.ar',
    inappropriateTerms: ['offensive1', 'offensive2', 'spam', 'scam', 'abuse', 'illegal', 'escort', 'prostitution', 'drugs'],
    violationMessage: 'Feedback must adhere to our Respect Agreement. Inappropriate terms have been flagged and reported.',
  },
  // Payment & Subscription Rules
  payment: {
    adminEmail: 'admin@drsrv.net.ar',
    dueDayOfMonth: 5, // Account suspension happens on the 6th if unpaid
    bankTransfer: {
      bankName: 'BBVA',
      cbu: '0170316840000040617332',
      alias: 'drcarlo'
    },
    mercadoPago: {
      cvu: '0000003100079017216982',
      alias: 'drcar.lo'
    }
  },

  platform: {
    publicUrl: process.env.PLATFORM_URL || 'https://sexappeal.drsrv.net.ar',
    registerUrl: process.env.PLATFORM_REGISTER_URL || 'https://sexappeal.drsrv.net.ar/register.html'
  },

  // Age-verification + Terms & Conditions acceptance.
  // Bump TERMS_VERSION (env or here) whenever the legal text materially changes;
  // every user/visitor will then be asked to accept again. Keep this value in
  // sync with the frontend constant in public/js/globals.js (TERMS_VERSION).
  terms: {
    version: process.env.TERMS_VERSION || '2026-06-18',
    contactEmail: 'admin@drsrv.net.ar'
  },

  // Grand opening curtain (America/Argentina/Buenos_Aires)
  launchCurtain: {
    openingAt: process.env.LAUNCH_OPENING_AT || '2026-06-24T00:00:00-03:00'
  },

  // WhatsApp lead outreach pacing ("slow nightly drip")
  // All values overridable via env. Times are LOCAL (Argentina, UTC-3) "HH:MM".
  outreach: {
    // Master switch. When false, outreach reverts to the legacy fast burst
    // (random 15-30s between messages, no night-window gating).
    // Env: OUTREACH_SLOW_DRIP ("false" disables; anything else / unset = enabled).
    slowDripEnabled: process.env.OUTREACH_SLOW_DRIP !== 'false',

    // Night window in which bulk sending is allowed. Local time, "HH:MM".
    // The window may cross midnight (e.g. 21:00 -> 08:00).
    // When start === end the window is 24h (no gating) — send ASAP, any hour.
    // Env: OUTREACH_NIGHT_START (default '00:00'), OUTREACH_NIGHT_END (default '00:00').
    nightWindowStart: process.env.OUTREACH_NIGHT_START || '00:00',
    nightWindowEnd: process.env.OUTREACH_NIGHT_END || '00:00',

    // Local timezone offset (hours from UTC) used to evaluate the night window.
    // Argentina is UTC-3 year round. Env: OUTREACH_TZ_OFFSET (default -3).
    timezoneOffsetHours: parseFloat(process.env.OUTREACH_TZ_OFFSET) || -3,

    // Jittered delay between messages (milliseconds). A uniform random value
    // in [minDelayMs, maxDelayMs] is waited after each successful send.
    // Defaults: 10000-20000 (random 10-20s, ~15s avg) — finish ASAP while
    // keeping randomized spacing so it isn't a robotic constant (anti-ban).
    // Env: OUTREACH_MIN_DELAY_MS, OUTREACH_MAX_DELAY_MS.
    minDelayMs: parseInt(process.env.OUTREACH_MIN_DELAY_MS, 10) || 10000,
    maxDelayMs: parseInt(process.env.OUTREACH_MAX_DELAY_MS, 10) || 20000,

    // Maximum messages to send per calendar night. 0 = unlimited.
    // When the cap is hit, sending pauses until the next night window opens.
    // Env: OUTREACH_NIGHTLY_CAP (default 0).
    nightlyCap: parseInt(process.env.OUTREACH_NIGHTLY_CAP, 10) || 0,

    // How often (ms) to re-check the clock while paused (outside window / cap hit).
    // Env: OUTREACH_POLL_INTERVAL_MS (default 30000).
    pollIntervalMs: parseInt(process.env.OUTREACH_POLL_INTERVAL_MS, 10) || 30000
  },

  // WhatsApp "quarter drip" scheduler (whatsapp_drip.js). A deliberately slow,
  // human-like cadence to carefully resume WhatsApp outreach after a restriction.
  // The hour is split into N equal quarters; exactly ONE message is sent per
  // quarter at a RANDOM minute within it (re-randomized every hour). All values
  // overridable via env.
  whatsappDrip: {
    // Messages per hour. With the default 4, the hour splits into 15-min quarters
    // [0-14],[15-29],[30-44],[45-59] and one send lands at a random minute in each.
    // Env: WHATSAPP_DRIP_PER_HOUR (default 4).
    messagesPerHour: parseInt(process.env.WHATSAPP_DRIP_PER_HOUR, 10) || 4,

    // Outreach drip image (PNG/JPG). Default is outreach-logo.png ("SelfAppeal"
    // wordmark — no "sex" substring for OCR). Site UI keeps brand-logo.png.
    // Env: WHATSAPP_DRIP_IMAGE (override path).
    brandImagePath: process.env.WHATSAPP_DRIP_IMAGE
      || path.resolve(__dirname, '..', 'public', 'images', 'outreach-logo.png'),

    // Neutral outreach alias (same app, no "sex" in hostname). Used for WhatsApp
    // step-2 register links (manual reply), NOT in the cold drip caption.
    // Env: WHATSAPP_DRIP_ALIAS_DOMAIN (unset = selfappeal.drsrv.net.ar; "" = off).
    aliasDomain: process.env.WHATSAPP_DRIP_ALIAS_DOMAIN !== undefined
      ? process.env.WHATSAPP_DRIP_ALIAS_DOMAIN
      : 'selfappeal.drsrv.net.ar',

    // Hard ceiling (ms) for a single registration-check / send call so a hung
    // whatsapp-web.js call never stalls the scheduler.
    // Env: WHATSAPP_DRIP_REGISTER_TIMEOUT_MS, WHATSAPP_DRIP_SEND_TIMEOUT_MS.
    registerCheckTimeoutMs: parseInt(process.env.WHATSAPP_DRIP_REGISTER_TIMEOUT_MS, 10) || 30000,
    sendTimeoutMs: parseInt(process.env.WHATSAPP_DRIP_SEND_TIMEOUT_MS, 10) || 60000
  },

  // SMS lead outreach via Twilio. Mirrors the WhatsApp `outreach` block but uses
  // Twilio's REST API. Sending defaults to 24/7 (no night window) and a fast,
  // jittered drip. All values overridable via env. Times are LOCAL (UTC-3) "HH:MM".
  sms: {
    // Twilio credentials. Required to send. Surface a clear error when missing.
    // Env: TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN.
    accountSid: process.env.TWILIO_ACCOUNT_SID || '',
    authToken: process.env.TWILIO_AUTH_TOKEN || '',

    // Sender identity. Prefer a Messaging Service SID when set; otherwise fall
    // back to a single "from" number. At least one must be configured.
    // Env: TWILIO_MESSAGING_SERVICE_SID, TWILIO_FROM_NUMBER.
    messagingServiceSid: process.env.TWILIO_MESSAGING_SERVICE_SID || '',
    fromNumber: process.env.TWILIO_FROM_NUMBER || '',

    // Official WhatsApp Business sender on Twilio (E.164). When set, this is the
    // platform origin number in admin UI and wa.me links (overrides admin DB phone).
    // Env: TWILIO_WHATSAPP_FROM_NUMBER (falls back to TWILIO_FROM_NUMBER if unset).
    whatsappFromNumber: process.env.TWILIO_WHATSAPP_FROM_NUMBER || '',

    // Global master switch. When false (default), every SMS path no-ops safely
    // (logs, never throws). Must be explicitly turned on to send anything.
    // Env: SMS_ENABLED ("true" enables; default disabled).
    enabled: process.env.SMS_ENABLED === 'true',

    // When true, bulk SMS outreach API returns 503 immediately (Twilio sender not
    // ready yet). Does not block deploy or container startup.
    // Env: TWILIO_SENDER_BYPASS ("true" = bypass until WhatsApp Business is set up).
    senderBypass: process.env.TWILIO_SENDER_BYPASS !== 'false',

    // Extra guard so SMS does not fire from a dev/non-production box even if a
    // developer leaves SMS_ENABLED on. In non-production, sending also requires
    // SMS_ALLOW_NON_PROD=true. Env: SMS_ALLOW_NON_PROD (default disabled).
    allowNonProd: process.env.SMS_ALLOW_NON_PROD === 'true',

    // Per-notification toggles for the transactional SMS channel. Each is
    // independent so a single event type can be enabled/disabled in isolation.
    // Env: SMS_NOTIFY_VISIBILITY, SMS_NOTIFY_DUEDATE, SMS_NOTIFY_TARIFF.
    notifyVisibility: process.env.SMS_NOTIFY_VISIBILITY === 'true',
    notifyDueDate: process.env.SMS_NOTIFY_DUEDATE === 'true',
    notifyTariff: process.env.SMS_NOTIFY_TARIFF === 'true',

    // Master switch for the slow nightly drip. When false, the fast burst
    // pacing below is used with no night-window gating.
    // Env: SMS_SLOW_DRIP ("true" enables nightly drip; default disabled = 24/7).
    slowDripEnabled: process.env.SMS_SLOW_DRIP === 'true',

    // Night window in which sending is allowed (only honored when slow drip is
    // enabled). Local time "HH:MM"; may cross midnight. start === end == 24h.
    // Env: SMS_NIGHT_START (default '00:00'), SMS_NIGHT_END (default '00:00').
    nightWindowStart: process.env.SMS_NIGHT_START || '00:00',
    nightWindowEnd: process.env.SMS_NIGHT_END || '00:00',

    // Local timezone offset (hours from UTC) for the night window. Argentina is
    // UTC-3. Env: SMS_TZ_OFFSET (default -3).
    timezoneOffsetHours: parseFloat(process.env.SMS_TZ_OFFSET) || -3,

    // Jittered delay between messages (ms). Uniform random in [min, max] after
    // each successful send. Defaults 10000-20000 (~15s avg): reasonably fast
    // but not a single burst. Env: SMS_MIN_DELAY_MS, SMS_MAX_DELAY_MS.
    minDelayMs: parseInt(process.env.SMS_MIN_DELAY_MS, 10) || 10000,
    maxDelayMs: parseInt(process.env.SMS_MAX_DELAY_MS, 10) || 20000,

    // Maximum messages per calendar night (only honored with slow drip). 0 = unlimited.
    // Env: SMS_NIGHTLY_CAP (default 0).
    nightlyCap: parseInt(process.env.SMS_NIGHTLY_CAP, 10) || 0,

    // How often (ms) to re-check the clock while paused. Env: SMS_POLL_INTERVAL_MS (default 30000).
    pollIntervalMs: parseInt(process.env.SMS_POLL_INTERVAL_MS, 10) || 30000,

    // Hard ceiling (ms) for a single Twilio API call so a hung request never
    // stalls the loop. Env: SMS_SEND_TIMEOUT_MS (default 30000).
    sendTimeoutMs: parseInt(process.env.SMS_SEND_TIMEOUT_MS, 10) || 30000
  }
};

module.exports = config;
