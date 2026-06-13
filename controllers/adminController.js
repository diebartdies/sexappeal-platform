const User = require('../models/User');
const ActivityLog = require('../models/ActivityLog');
const sendEmail = require('../sendEmail');
const { isValidRejectionReason, buildRejectionEmail } = require('../utils/rejectionMessages');
const { resolvePhotoForClient, resolvePhotosForClient, resolveFirstPhotoForClient } = require('../utils/photoUtils');
const { getProfessionalIdNumberError, normalizeProfessionalIdNumber } = require('../utils/idNumber');

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

    const professionalsData = professionals.map(p => {
        const obj = p.toObject();
        if (obj.professionalProfile && obj.professionalProfile.photos) {
            const first = resolveFirstPhotoForClient(obj.professionalProfile.photos);
            obj.professionalProfile.photos = first ? [first] : [];
        }
        return obj;
    });

    res.status(200).json({
      success: true,
      count: professionals.length,
      pagination: { page: parseInt(page, 10), limit: parseInt(limit, 10), total },
      data: professionalsData
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

    const pendingData = pending.map(p => {
        const obj = p.toObject();
        if (obj.professionalProfile && obj.professionalProfile.photos) {
            obj.professionalProfile.photos = resolvePhotosForClient(obj.professionalProfile.photos);
        }
        return obj;
    });

    res.status(200).json({
      success: true,
      count: pending.length,
      pagination: { page: parseInt(page, 10), limit: parseInt(limit, 10), total },
      data: pendingData
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

    const clientIp = req.headers['x-forwarded-for'] ? req.headers['x-forwarded-for'].split(',')[0].trim() : (req.socket ? req.socket.remoteAddress : req.ip);
    await ActivityLog.create({
      professional: req.user.id, // Log against the admin who triggered it
      action: 'admin_broadcast_email',
      ipAddress: clientIp,
      userAgent: req.headers['user-agent'],
      isGuest: false,
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
    if (isGuest !== undefined) {
        query.isGuest = isGuest === 'true' ? true : { $ne: true };
    }

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
    const { status, rejectionReason, rejectionDetails } = req.body;

    if (!['approved', 'rejected'].includes(status)) {
      return res.status(400).json({
        success: false,
        error: 'Please provide a valid status (approved or rejected)'
      });
    }

    if (status === 'rejected') {
      if (!isValidRejectionReason(rejectionReason)) {
        return res.status(400).json({
          success: false,
          error: 'Please select a valid rejection reason.'
        });
      }
      if (!rejectionDetails || !String(rejectionDetails).trim()) {
        return res.status(400).json({
          success: false,
          error: 'Please provide rejection details in the text field.'
        });
      }
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

    if (status === 'approved') {
      user.rejectionReason = null;
      user.rejectionDetails = null;
      user.allowResubmission = false;
    } else {
      const details = String(rejectionDetails).trim();
      user.rejectionReason = rejectionReason;
      user.rejectionDetails = details;
      user.allowResubmission = rejectionReason === 'photos_unclear' || rejectionReason === 'photo_info_mismatch';
    }

    await user.save();

    if (status === 'approved') {
      sendEmail({
        email: user.email,
        subject: 'SexAppeal - Your Profile Has Been Approved!',
        message: `Hello ${user.professionalProfile?.alias || 'Professional'},\n\nGreat news! Your SexAppeal profile has been approved by our team.\n\nYou can now edit your profile, upload gallery photos, and appear in the public directory.\n\nPlease log in to your Professional Dashboard to complete your profile.\n\nWelcome to the Architecture of Intimacy.`
      }).catch(err => console.error(`Failed to send approval email to ${user.email}:`, err.message));
    } else {
      const emailMessage = buildRejectionEmail({
        alias: user.professionalProfile?.alias,
        reason: rejectionReason,
        details: String(rejectionDetails).trim()
      });
      sendEmail({
        email: user.email,
        subject: 'SexAppeal - Profile Verification Update',
        message: emailMessage
      }).catch(err => console.error(`Failed to send rejection email to ${user.email}:`, err.message));
    }

    const clientIp = req.headers['x-forwarded-for'] ? req.headers['x-forwarded-for'].split(',')[0].trim() : (req.socket ? req.socket.remoteAddress : req.ip);
    await ActivityLog.create({
      professional: user._id,
      action: status === 'approved' ? 'admin_approve_verification' : 'admin_reject_verification',
      ipAddress: clientIp,
      userAgent: req.headers['user-agent'],
      isGuest: false,
      details: {
        adminId: req.user.id,
        rejectionReason: status === 'rejected' ? rejectionReason : undefined,
        rejectionDetails: status === 'rejected' ? String(rejectionDetails).trim() : undefined
      }
    });

    res.status(200).json({
      success: true,
      data: {
        id: user._id,
        email: user.email,
        verificationStatus: user.verificationStatus,
        isVerified: user.isVerified,
        allowResubmission: user.allowResubmission
      }
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      error: error.message
    });
  }
};

// @desc    Get pending payments
// @route   GET /api/v1/admin/payments/pending
// @access  Private/Admin
exports.getPendingPayments = async (req, res, next) => {
  try {
    const pending = await User.find({
      role: 'professional',
      'professionalProfile.paymentReceiptUrl': { $exists: true, $ne: null },
      'professionalProfile.paymentProcessed': { $ne: true }
    }).select('email professionalProfile.alias professionalProfile.firstName professionalProfile.lastName professionalProfile.paymentReceiptUrl createdAt');

    res.status(200).json({
      success: true,
      count: pending.length,
      data: pending
    });
  } catch (error) {
    res.status(400).json({ success: false, error: error.message });
  }
};

// @desc    Acknowledge payment
// @route   PUT /api/v1/admin/payments/:id/acknowledge
// @access  Private/Admin
exports.acknowledgePayment = async (req, res, next) => {
  try {
    const user = await User.findById(req.params.id);

    if (!user || user.role !== 'professional') {
      return res.status(404).json({ success: false, error: 'Professional not found' });
    }

    user.professionalProfile.paymentProcessed = true;
    user.professionalProfile.subscriptionStatus = 'active';

    if (user.professionalProfile.invoices) {
      user.professionalProfile.invoices.forEach(inv => {
        if (inv.status === 'pending') inv.status = 'paid';
      });
    }

    await user.save();
    res.status(200).json({ success: true, data: user });
  } catch (error) {
    res.status(400).json({ success: false, error: error.message });
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
      if (req.body.professionalProfile.idNumber !== undefined) {
        const idNumberError = getProfessionalIdNumberError(req.body.professionalProfile.idNumber);
        if (idNumberError) {
          return res.status(400).json({ success: false, error: idNumberError });
        }
        req.body.professionalProfile.idNumber = normalizeProfessionalIdNumber(req.body.professionalProfile.idNumber);
      }

      if (req.body.professionalProfile.photos) {
          const remainingUrls = req.body.professionalProfile.photos;
          const keptPhotos = (user.professionalProfile.photos || []).filter(p => {
              if (typeof p === 'string') return remainingUrls.includes(p);
              if (p.url) return remainingUrls.includes(p.url);
              const blobUrl = `/api/v1/professionals/photo/${user._id}/${p._id}`;
              return remainingUrls.includes(blobUrl);
          });
          user.professionalProfile.photos = keptPhotos;
          delete req.body.professionalProfile.photos;
      }

      user.professionalProfile = {
        ...user.professionalProfile.toObject(),
        ...req.body.professionalProfile
      };
    }

    await user.save();

    const clientIp = req.headers['x-forwarded-for'] ? req.headers['x-forwarded-for'].split(',')[0].trim() : (req.socket ? req.socket.remoteAddress : req.ip);
    await ActivityLog.create({
      professional: user._id,
      action: 'admin_edit_profile',
      ipAddress: clientIp,
      userAgent: req.headers['user-agent'],
      isGuest: false,
      details: { adminId: req.user.id }
    });

    const responseUser = user.toObject();
    if (responseUser.professionalProfile && responseUser.professionalProfile.photos) {
        responseUser.professionalProfile.photos = resolvePhotosForClient(responseUser.professionalProfile.photos);
    }

    res.status(200).json({
      success: true,
      data: responseUser
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      error: error.message
    });
  }
};
