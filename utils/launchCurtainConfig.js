const mongoose = require('mongoose');
const config = require('../config/appConfig');
const User = require('../models/User');

// A valid opening value is a non-empty string parseable as a date.
function isValidOpeningAt(value) {
  return typeof value === 'string' && value.trim() !== '' && !Number.isNaN(Date.parse(value));
}

// The admin-configured DB value (adminSettings.launchCurtain.openingAt) wins when
// present & valid; otherwise fall back to the env/code default in config.
function resolveOpeningAtString(settings = {}) {
  if (settings && isValidOpeningAt(settings.openingAt)) {
    return settings.openingAt;
  }
  return config.launchCurtain.openingAt;
}

function getOpeningDate(settings = {}) {
  return new Date(resolveOpeningAtString(settings));
}

function buildLaunchCurtainStatus(settings = {}) {
  const enabled = Boolean(settings.enabled);
  const openingAtLocal = resolveOpeningAtString(settings);
  const openingAt = new Date(openingAtLocal);
  const now = Date.now();
  const openingMs = openingAt.getTime();
  const hasOpened = now >= openingMs;
  const curtainVisible = enabled && !hasOpened;
  const msRemaining = Math.max(0, openingMs - now);

  return {
    enabled,
    openingAt: openingAt.toISOString(),
    // ISO string with offset (e.g. -03:00) used by the admin UI to round-trip
    // the configured Argentina wall-clock time into the datetime-local input.
    openingAtLocal,
    hasOpened,
    curtainVisible,
    msRemaining,
    daysRemaining: Math.floor(msRemaining / (24 * 60 * 60 * 1000)),
    hoursRemaining: Math.floor((msRemaining % (24 * 60 * 60 * 1000)) / (60 * 60 * 1000))
  };
}

async function getAdminLaunchCurtainSettings() {
  if (mongoose.connection.readyState !== 1) {
    return { enabled: false };
  }
  const admin = await User.findOne({ role: 'admin' }).select('adminSettings.launchCurtain');
  return admin?.adminSettings?.launchCurtain || { enabled: false };
}

async function getLaunchCurtainStatus() {
  const settings = await getAdminLaunchCurtainSettings();
  return buildLaunchCurtainStatus(settings);
}

async function setLaunchCurtainEnabled(enabled) {
  if (mongoose.connection.readyState !== 1) {
    throw new Error('Database not connected');
  }

  const admin = await User.findOne({ role: 'admin' });
  if (!admin) {
    throw new Error('Admin account not found');
  }

  admin.adminSettings = admin.adminSettings || {};
  admin.adminSettings.launchCurtain = admin.adminSettings.launchCurtain || {};
  admin.adminSettings.launchCurtain.enabled = Boolean(enabled);
  await admin.save();

  return buildLaunchCurtainStatus(admin.adminSettings.launchCurtain);
}

async function setLaunchCurtainOpeningAt(value) {
  if (mongoose.connection.readyState !== 1) {
    throw new Error('Database not connected');
  }
  if (!isValidOpeningAt(value)) {
    throw new Error('Invalid opening date/time');
  }

  const admin = await User.findOne({ role: 'admin' });
  if (!admin) {
    throw new Error('Admin account not found');
  }

  admin.adminSettings = admin.adminSettings || {};
  admin.adminSettings.launchCurtain = admin.adminSettings.launchCurtain || {};
  admin.adminSettings.launchCurtain.openingAt = value;
  await admin.save();

  return buildLaunchCurtainStatus(admin.adminSettings.launchCurtain);
}

module.exports = {
  getOpeningDate,
  buildLaunchCurtainStatus,
  getLaunchCurtainStatus,
  setLaunchCurtainEnabled,
  setLaunchCurtainOpeningAt
};
