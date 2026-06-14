const outreachService = require('../services/whatsappOutreachService');

// @desc    Start bulk WhatsApp outreach to pending leads
// @route   POST /api/v1/admin/outreach/bulk-whatsapp
// @access  Private/Admin
exports.startBulkWhatsApp = async (req, res, next) => {
  try {
    const status = outreachService.startBulkOutreachBackground();
    res.status(202).json({
      success: true,
      message: 'Bulk WhatsApp outreach started',
      data: status
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

// @desc    Bulk WhatsApp outreach progress
// @route   GET /api/v1/admin/outreach/bulk-whatsapp/status
// @access  Private/Admin
exports.getBulkWhatsAppStatus = async (req, res, next) => {
  try {
    res.status(200).json({
      success: true,
      data: outreachService.getStatus()
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};
