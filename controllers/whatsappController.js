const {
  getPlatformWhatsAppPhone,
  updatePlatformWhatsAppPhone,
  formatWhatsAppPhoneDisplay,
  getAdminWhatsAppSettings,
  getPlatformWhatsAppPhoneSource,
  isTwilioWhatsAppPhoneConfigured
} = require('../utils/whatsappConfig');
const platformService = require('../services/whatsappPlatformService');
const dripRunner = require('../services/whatsappDripRunner');

// @desc    Get platform WhatsApp configuration
// @route   GET /api/v1/admin/whatsapp/config
// @access  Private/Admin
exports.getWhatsAppConfig = async (req, res) => {
  try {
    const settings = await getAdminWhatsAppSettings();
    const status = await platformService.getRegistrationStatus();
    const phoneSource = await getPlatformWhatsAppPhoneSource();

    res.status(200).json({
      success: true,
      data: {
        phoneNumber: status.phoneNumber,
        displayPhone: status.displayPhone,
        phoneSource,
        twilioConfigured: phoneSource === 'twilio',
        twilioEnvDefault: isTwilioWhatsAppPhoneConfigured(),
        transport: status.transport || 'webjs',
        twilioApi: Boolean(status.twilioApi),
        registeredAt: settings.registeredAt || null,
        lastConnectedAt: settings.lastConnectedAt || null,
        sessionSaved: status.sessionSaved,
        connected: status.connected,
        phase: status.phase,
        qr: status.qr || null,
        lastError: status.lastError || null
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

// @desc    Update platform WhatsApp origin phone number
// @route   PUT /api/v1/admin/whatsapp/config
// @access  Private/Admin
exports.updateWhatsAppPhone = async (req, res) => {
  try {
    const { phoneNumber } = req.body;
    if (!phoneNumber || !String(phoneNumber).trim()) {
      return res.status(400).json({ success: false, error: 'Phone number is required' });
    }

    const clean = await updatePlatformWhatsAppPhone(phoneNumber);

    res.status(200).json({
      success: true,
      message: 'WhatsApp phone number updated',
      data: {
        phoneNumber: clean,
        displayPhone: formatWhatsAppPhoneDisplay(clean)
      }
    });
  } catch (error) {
    res.status(400).json({ success: false, error: error.message });
  }
};

// @desc    Start WhatsApp Web registration (QR flow)
// @route   POST /api/v1/admin/whatsapp/register
// @access  Private/Admin
exports.startWhatsAppRegistration = async (req, res) => {
  try {
    const status = await platformService.startRegistration();
    const message = status.twilioApi
      ? 'Twilio WhatsApp API is active — no QR scan required'
      : 'WhatsApp registration started — scan the QR with the configured phone';
    res.status(202).json({
      success: true,
      message,
      data: status
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

// @desc    Poll WhatsApp registration / connection status
// @route   GET /api/v1/admin/whatsapp/register/status
// @access  Private/Admin
exports.getWhatsAppRegistrationStatus = async (req, res) => {
  try {
    const status = await platformService.getRegistrationStatus();
    res.status(200).json({ success: true, data: status });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

// @desc    Start the in-app WhatsApp quarter-drip sender (4 msgs/hour)
// @route   POST /api/v1/admin/whatsapp/drip/start
// @access  Private/Admin
exports.startWhatsAppDrip = async (req, res) => {
  try {
    const result = await dripRunner.start();
    const status = await dripRunner.getStatus();

    if (!result.ok) {
      // Not-connected is a conflict (the admin must link WhatsApp first); every
      // other refusal (already running / no pending leads) is a bad request.
      const code = result.notConnected ? 409 : 400;
      return res.status(code).json({ success: false, error: result.error, data: status });
    }

    res.status(202).json({
      success: true,
      message: 'WhatsApp drip started',
      data: status
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

// @desc    Stop the in-app WhatsApp quarter-drip sender
// @route   POST /api/v1/admin/whatsapp/drip/stop
// @access  Private/Admin
exports.stopWhatsAppDrip = async (req, res) => {
  try {
    dripRunner.stop();
    const status = await dripRunner.getStatus();
    res.status(200).json({
      success: true,
      message: 'WhatsApp drip stopped',
      data: status
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

// @desc    Live status of the in-app WhatsApp quarter-drip sender
// @route   GET /api/v1/admin/whatsapp/drip/status
// @access  Private/Admin
exports.getWhatsAppDripStatus = async (req, res) => {
  try {
    const status = await dripRunner.getStatus();
    res.status(200).json({ success: true, data: status });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

// @desc    Get configured origin phone (for UI labels)
// @route   GET /api/v1/admin/whatsapp/phone
// @access  Private/Admin
exports.getWhatsAppPhone = async (req, res) => {
  try {
    const phoneNumber = await getPlatformWhatsAppPhone();
    res.status(200).json({
      success: true,
      data: {
        phoneNumber,
        displayPhone: formatWhatsAppPhoneDisplay(phoneNumber)
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};
