const {
  getPlatformWhatsAppPhone,
  updatePlatformWhatsAppPhone,
  formatWhatsAppPhoneDisplay,
  getAdminWhatsAppSettings
} = require('../utils/whatsappConfig');
const platformService = require('../services/whatsappPlatformService');

// @desc    Get platform WhatsApp configuration
// @route   GET /api/v1/admin/whatsapp/config
// @access  Private/Admin
exports.getWhatsAppConfig = async (req, res) => {
  try {
    const settings = await getAdminWhatsAppSettings();
    const status = await platformService.getRegistrationStatus();

    res.status(200).json({
      success: true,
      data: {
        phoneNumber: status.phoneNumber,
        displayPhone: status.displayPhone,
        registeredAt: settings.registeredAt || null,
        lastConnectedAt: settings.lastConnectedAt || null,
        sessionSaved: status.sessionSaved,
        connected: status.connected,
        phase: status.phase,
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
    res.status(202).json({
      success: true,
      message: 'WhatsApp registration started — scan the QR with the configured phone',
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
