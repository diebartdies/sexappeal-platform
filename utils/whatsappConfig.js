const mongoose = require('mongoose');
const User = require('../models/User');
const { normalizeWhatsAppPhone } = require('./professionalInviteMessage');

const DEFAULT_WHATSAPP_PHONE = '5491178280156';

function envFallbackPhone() {
  const envRaw = process.env.WATCH_ALERT_WHATSAPP;
  const raw = (envRaw && envRaw !== 'off' ? envRaw : '') || DEFAULT_WHATSAPP_PHONE;
  return normalizeWhatsAppPhone(raw) || DEFAULT_WHATSAPP_PHONE;
}

async function getAdminWhatsAppSettings() {
  if (mongoose.connection.readyState !== 1) {
    return {};
  }
  const admin = await User.findOne({ role: 'admin' }).select('adminSettings.whatsapp');
  return admin?.adminSettings?.whatsapp || {};
}

async function getPlatformWhatsAppPhone() {
  try {
    const settings = await getAdminWhatsAppSettings();
    if (settings.phoneNumber) {
      return normalizeWhatsAppPhone(settings.phoneNumber) || DEFAULT_WHATSAPP_PHONE;
    }
  } catch {
    /* fall through to env/default */
  }
  return envFallbackPhone();
}

async function updatePlatformWhatsAppPhone(phone) {
  const clean = normalizeWhatsAppPhone(phone);
  if (!clean) {
    throw new Error('Invalid WhatsApp phone number');
  }

  if (mongoose.connection.readyState !== 1) {
    throw new Error('Database not connected');
  }

  const admin = await User.findOne({ role: 'admin' });
  if (!admin) {
    throw new Error('Admin account not found');
  }

  admin.adminSettings = admin.adminSettings || {};
  admin.adminSettings.whatsapp = admin.adminSettings.whatsapp || {};
  admin.adminSettings.whatsapp.phoneNumber = clean;
  await admin.save();

  return clean;
}

async function markWhatsAppRegistered() {
  if (mongoose.connection.readyState !== 1) return;

  const admin = await User.findOne({ role: 'admin' });
  if (!admin) return;

  admin.adminSettings = admin.adminSettings || {};
  admin.adminSettings.whatsapp = admin.adminSettings.whatsapp || {};
  admin.adminSettings.whatsapp.registeredAt = admin.adminSettings.whatsapp.registeredAt || new Date();
  admin.adminSettings.whatsapp.lastConnectedAt = new Date();
  await admin.save();
}

function formatWhatsAppPhoneDisplay(phone) {
  const clean = normalizeWhatsAppPhone(phone) || DEFAULT_WHATSAPP_PHONE;
  return `+${clean}`;
}

module.exports = {
  DEFAULT_WHATSAPP_PHONE,
  getAdminWhatsAppSettings,
  getPlatformWhatsAppPhone,
  updatePlatformWhatsAppPhone,
  markWhatsAppRegistered,
  formatWhatsAppPhoneDisplay
};
