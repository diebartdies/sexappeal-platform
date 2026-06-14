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

// @desc    Send WhatsApp to selected leads and/or professionals
// @route   POST /api/v1/admin/outreach/whatsapp/targeted
// @access  Private/Admin
exports.startTargetedWhatsApp = async (req, res, next) => {
  try {
    const { leadIds = [], professionalIds = [], message = '' } = req.body;
    const hasLeads = Array.isArray(leadIds) && leadIds.length > 0;
    const hasProfessionals = Array.isArray(professionalIds) && professionalIds.length > 0;

    if (!hasLeads && !hasProfessionals) {
      return res.status(400).json({ success: false, error: 'Select at least one recipient' });
    }

    const status = outreachService.startTargetedOutreachBackground({
      leadIds: hasLeads ? leadIds : [],
      professionalIds: hasProfessionals ? professionalIds : [],
      message
    });

    res.status(202).json({
      success: true,
      message: 'Targeted WhatsApp outreach started',
      data: status
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};
