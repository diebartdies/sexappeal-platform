const mongoose = require('mongoose');
const config = require('../config/appConfig');
const User = require('../models/User');

function getOpeningDate() {
  return new Date(config.launchCurtain.openingAt);
}

function buildLaunchCurtainStatus(settings = {}) {
  const enabled = Boolean(settings.enabled);
  const openingAt = getOpeningDate();
  const now = Date.now();
  const openingMs = openingAt.getTime();
  const hasOpened = now >= openingMs;
  const curtainVisible = enabled && !hasOpened;
  const msRemaining = Math.max(0, openingMs - now);

  return {
    enabled,
    openingAt: openingAt.toISOString(),
    openingAtLocal: config.launchCurtain.openingAt,
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

module.exports = {
  getOpeningDate,
  buildLaunchCurtainStatus,
  getLaunchCurtainStatus,
  setLaunchCurtainEnabled
};
