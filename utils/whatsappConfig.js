const mongoose = require('mongoose');
const User = require('../models/User');
const config = require('../config/appConfig');
const { normalizeE164Digits, normalizeWhatsAppPhone } = require('./professionalInviteMessage');

const DEFAULT_WHATSAPP_PHONE = '5491178280156';

function envFallbackPhone() {
  const envRaw = process.env.WATCH_ALERT_WHATSAPP;
  const raw = (envRaw && envRaw !== 'off' ? envRaw : '') || DEFAULT_WHATSAPP_PHONE;
  return normalizeWhatsAppPhone(raw) || DEFAULT_WHATSAPP_PHONE;
}

/** Strip to digits; US/CA NANP kept as-is; otherwise Argentina mobile normalization. */
function normalizePlatformOriginPhone(phone) {
  const digits = normalizeE164Digits(phone);
  if (!digits) return '';
  if (digits.startsWith('1') && digits.length === 11) return digits;
  return normalizeWhatsAppPhone(phone) || '';
}

/** Twilio WhatsApp sender default from server .env (sync). */
function getTwilioWhatsAppPhone() {
  const raw = config.sms?.whatsappFromNumber || config.sms?.fromNumber || '';
  if (!raw) return '';
  return normalizeE164Digits(raw) || '';
}

function isTwilioWhatsAppPhoneConfigured() {
  return Boolean(getTwilioWhatsAppPhone());
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
      return normalizePlatformOriginPhone(settings.phoneNumber) || DEFAULT_WHATSAPP_PHONE;
    }
  } catch {
    /* fall through */
  }

  const twilioPhone = getTwilioWhatsAppPhone();
  if (twilioPhone) return twilioPhone;

  return envFallbackPhone();
}

async function getPlatformWhatsAppPhoneSource() {
  try {
    const settings = await getAdminWhatsAppSettings();
    if (settings.phoneNumber) return 'admin';
  } catch {
    /* ignore */
  }
  if (getTwilioWhatsAppPhone()) return 'twilio';
  return 'env';
}

async function updatePlatformWhatsAppPhone(phone) {
  const clean = normalizePlatformOriginPhone(phone);
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
  const clean = normalizePlatformOriginPhone(phone)
    || getTwilioWhatsAppPhone()
    || DEFAULT_WHATSAPP_PHONE;
  return clean ? `+${clean}` : '';
}

async function buildPlatformWhatsAppContactUrl() {
  const phone = await getPlatformWhatsAppPhone();
  return `https://wa.me/${phone}`;
}

module.exports = {
  DEFAULT_WHATSAPP_PHONE,
  getTwilioWhatsAppPhone,
  isTwilioWhatsAppPhoneConfigured,
  getAdminWhatsAppSettings,
  getPlatformWhatsAppPhone,
  getPlatformWhatsAppPhoneSource,
  updatePlatformWhatsAppPhone,
  markWhatsAppRegistered,
  formatWhatsAppPhoneDisplay,
  buildPlatformWhatsAppContactUrl
};
