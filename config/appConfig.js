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
  rateLimitWindow: 10 * 60 * 1000, // 10 minutes
  rateLimitMax: 100,

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

  // Grand opening curtain (America/Argentina/Buenos_Aires)
  launchCurtain: {
    openingAt: process.env.LAUNCH_OPENING_AT || '2026-06-19T00:00:00-03:00'
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
  }
};

module.exports = config;
