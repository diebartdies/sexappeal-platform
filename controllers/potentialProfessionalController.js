const PotentialProfessional = require('../models/PotentialProfessional');
const {
  buildColdOutreachStep1Message,
  buildOutreachRegisterUrl,
  getOutreachBrandImageUrl,
  buildWhatsAppUrl
} = require('../utils/professionalInviteMessage');

// @desc    Preview outreach invite message (cold WhatsApp step 1 — same as drip/template)
// @route   GET /api/v1/admin/outreach/invite-message
// @access  Private/Admin
exports.getInviteMessage = async (req, res, next) => {
  try {
    const alias = (req.query.alias && String(req.query.alias).trim()) || 'María';
    res.status(200).json({
      success: true,
      data: {
        message: buildColdOutreachStep1Message(alias),
        registerUrl: buildOutreachRegisterUrl(),
        brandImageUrl: getOutreachBrandImageUrl(),
        alias,
        channel: 'whatsapp-cold'
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

// @desc    Get all potential professionals
// @route   GET /api/v1/admin/potential-professionals
// @access  Private/Admin
exports.getPotentialProfessionals = async (req, res, next) => {
  try {
    const { status, sourceUrl, page = 1, limit = 50 } = req.query;
    const query = {};

    // Allow filtering by status or the source website
    if (status) query.status = status;
    if (sourceUrl) query.sourceUrl = sourceUrl;

    const startIndex = (page - 1) * limit;

    const potentials = await PotentialProfessional.find(query)
      .sort({ createdAt: -1 })
      .skip(startIndex)
      .limit(parseInt(limit, 10));

    const total = await PotentialProfessional.countDocuments(query);

    res.status(200).json({
      success: true,
      count: potentials.length,
      pagination: {
        page: parseInt(page, 10),
        limit: parseInt(limit, 10),
        total
      },
      data: potentials.map((lead) => {
        const obj = lead.toObject ? lead.toObject() : lead;
        return {
          ...obj,
          whatsappLink: buildWhatsAppUrl(obj.phone, obj.alias)
        };
      })
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

// @desc    Update potential professional status
// @route   PUT /api/v1/admin/potential-professionals/:id
// @access  Private/Admin
exports.updatePotentialProfessional = async (req, res, next) => {
  try {
    const { status } = req.body;

    if (!['pending', 'contacted', 'joined', 'rejected'].includes(status)) {
        return res.status(400).json({ success: false, error: 'Invalid status' });
    }

    const potential = await PotentialProfessional.findByIdAndUpdate(
      req.params.id,
      { status },
      { new: true, runValidators: true }
    );

    if (!potential) {
      return res.status(404).json({ success: false, error: 'Potential professional not found' });
    }

    res.status(200).json({
      success: true,
      data: potential
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};