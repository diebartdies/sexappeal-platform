const User = require('../models/User');
const ActivityLog = require('../models/ActivityLog');
const sendEmail = require('../sendEmail');

// @desc    Get all professionals
// @route   GET /api/v1/admin/professionals
// @access  Private/Admin
exports.getAllProfessionals = async (req, res, next) => {
  try {
    const { alias, page = 1, limit = 50 } = req.query;
    const query = { role: 'professional' };
    
    if (alias) {
      query['professionalProfile.alias'] = { $regex: alias, $options: 'i' };
    }

    const skip = (page - 1) * limit;

    const professionals = await User.find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit, 10));

    const total = await User.countDocuments(query);

    res.status(200).json({
      success: true,
      count: professionals.length,
      pagination: { page: parseInt(page, 10), limit: parseInt(limit, 10), total },
      data: professionals
    });
  } catch (error) {
    res.status(400).json({ success: false, error: error.message });
  }
};

// @desc    Get all pending professional verifications
// @route   GET /api/v1/admin/verifications/pending
// @access  Private/Admin
exports.getPendingVerifications = async (req, res, next) => {
  try {
    const { page = 1, limit = 50 } = req.query;
    const skip = (page - 1) * limit;

    const query = { role: 'professional', verificationStatus: 'pending' };

    const pending = await User.find(query)
      .select('+verificationDocuments')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit, 10));

    const total = await User.countDocuments(query);

    res.status(200).json({
      success: true,
      count: pending.length,
      pagination: { page: parseInt(page, 10), limit: parseInt(limit, 10), total },
      data: pending
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      error: error.message
    });
  }
};

// @desc    Send broadcast email to professionals
// @route   POST /api/v1/admin/notifications/mail/broadcast
// @access  Private/Admin
exports.sendBroadcastEmail = async (req, res, next) => {
  try {
    const { subject, message, audience } = req.body;
    
    if (!subject || !message) {
      return res.status(400).json({ success: false, error: 'Subject and message are required' });
    }

    const query = { role: 'professional' };
    if (audience === 'approved') {
      query.verificationStatus = 'approved';
    }

    const professionals = await User.find(query);

    // Send emails in background
    professionals.forEach(p => {
      sendEmail({
        email: p.email,
        subject: subject,
        message: `Hello ${p.professionalProfile?.alias || 'Professional'},\n\n${message}`
      }).catch(err => console.error(`Failed to send email to ${p.email}:`, err));
    });

    await ActivityLog.create({
      professional: req.user.id, // Log against the admin who triggered it
      action: 'admin_broadcast_email',
      ipAddress: req.ip,
      userAgent: req.headers['user-agent'],
      details: { adminId: req.user.id, count: professionals.length, subject, audience }
    });

    res.status(200).json({
      success: true,
      message: `Broadcast email triggered for ${professionals.length} professionals`
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

// @desc    Get all activity logs
// @route   GET /api/v1/admin/logs
// @access  Private/Admin
exports.getActivityLogs = async (req, res, next) => {
  try {
    const { action, ipAddress, userAgent, isGuest, page = 1, limit = 50 } = req.query;

    const query = {};
    if (action) query.action = { $regex: action, $options: 'i' };
    if (ipAddress) query.ipAddress = { $regex: ipAddress, $options: 'i' };
    if (userAgent) query.userAgent = { $regex: userAgent, $options: 'i' };
    if (isGuest !== undefined) query.isGuest = isGuest === 'true';

    const skip = (page - 1) * limit;

    const logs = await ActivityLog.find(query)
      .populate('professional', 'email professionalProfile.alias')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit, 10));

    const total = await ActivityLog.countDocuments(query);

    res.status(200).json({
      success: true,
      count: logs.length,
      pagination: {
        page: parseInt(page, 10),
        limit: parseInt(limit, 10),
        total
      },
      data: logs
    });
  } catch (error) {
    res.status(400).json({ success: false, error: error.message });
  }
};

// @desc    Verify a professional
// @route   PUT /api/v1/admin/verifications/:id
// @access  Private/Admin
exports.verifyProfessional = async (req, res, next) => {
  try {
    const { status } = req.body;

    if (!['approved', 'rejected'].includes(status)) {
      return res.status(400).json({
        success: false,
        error: 'Please provide a valid status (approved or rejected)'
      });
    }

    const user = await User.findById(req.params.id);

    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'User not found'
      });
    }

    user.verificationStatus = status;
    user.isVerified = status === 'approved';
    await user.save();

    await ActivityLog.create({
      professional: user._id,
      action: status === 'approved' ? 'admin_approve_verification' : 'admin_reject_verification',
      ipAddress: req.ip,
      userAgent: req.headers['user-agent'],
      details: { adminId: req.user.id }
    });

    res.status(200).json({
      success: true,
      data: {
        id: user._id,
        email: user.email,
        verificationStatus: user.verificationStatus,
        isVerified: user.isVerified
      }
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      error: error.message
    });
  }
};

// @desc    Update a professional profile by admin
// @route   PUT /api/v1/admin/professionals/:id
// @access  Private/Admin
exports.updateProfessionalProfile = async (req, res, next) => {
  try {
    const user = await User.findById(req.params.id);

    if (!user || user.role !== 'professional') {
      return res.status(404).json({
        success: false,
        error: 'Professional not found'
      });
    }

    // Allow admin to update email, verification status, or nested profile data
    if (req.body.email) user.email = req.body.email;
    if (req.body.verificationStatus) {
      user.verificationStatus = req.body.verificationStatus;
      user.isVerified = req.body.verificationStatus === 'approved';
    }

    if (req.body.professionalProfile) {
      user.professionalProfile = {
        ...user.professionalProfile.toObject(),
        ...req.body.professionalProfile
      };
    }

    await user.save();

    await ActivityLog.create({
      professional: user._id,
      action: 'admin_edit_profile',
      ipAddress: req.ip,
      userAgent: req.headers['user-agent'],
      details: { adminId: req.user.id }
    });

    res.status(200).json({
      success: true,
      data: user
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      error: error.message
    });
  }
};
