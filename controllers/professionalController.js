const User = require('../models/User');
const config = require('../config/appConfig');

// Simple in-memory cache setup
const cache = new Map();
const CACHE_TTL = 60 * 1000; // 1 minute TTL in milliseconds

// @desc    Discover all revealed Living Treasures (Public)
// @route   GET /api/v1/professionals
// @access  Public
exports.getProfessionals = async (req, res, next) => {
  try {
    // Generate cache key ignoring the cache-busting '_' parameter from the frontend
    const queryForCache = { ...req.query };
    delete queryForCache._;
    const cacheKey = 'getProfessionals_' + JSON.stringify(queryForCache);

    const cachedData = cache.get(cacheKey);
    if (cachedData && cachedData.expires > Date.now()) {
      return res.status(200).json(cachedData.response);
    }

    let query = { 
      role: 'professional', 
      isVerified: true 
    };

    // Filter by Quality (formerly Tier)
    if (req.query.quality && req.query.quality.trim()) {
      query['professionalProfile.quality'] = req.query.quality.trim();
    }

    // Filter by Alias (partial match)
    if (req.query.alias && req.query.alias.trim()) {
      query['professionalProfile.alias'] = { $regex: req.query.alias.trim(), $options: 'i' };
    }

    // Filter by Specialty (searches the services array)
    if (req.query.specialty && req.query.specialty.trim()) {
      query['professionalProfile.services'] = req.query.specialty.trim();
    }

    // Hierarchical Location Search
    if (req.query.province && req.query.province.trim()) {
      query['professionalProfile.location.province'] = { $regex: req.query.province.trim(), $options: 'i' };
    }
    if (req.query.city && req.query.city.trim()) {
      query['professionalProfile.location.city'] = { $regex: req.query.city.trim(), $options: 'i' };
    }
    if (req.query.neighborhood && req.query.neighborhood.trim()) {
      query['professionalProfile.location.neighborhood'] = { $regex: req.query.neighborhood.trim(), $options: 'i' };
    }

    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 12;
    const skip = (page - 1) * limit;

    const total = await User.countDocuments(query);

    const professionals = await User.find(query)
      .select('professionalProfile.alias professionalProfile.quality professionalProfile.bio professionalProfile.services professionalProfile.location professionalProfile.pricing professionalProfile.measurements professionalProfile.height professionalProfile.eyeColor professionalProfile.hasTattoos professionalProfile.whatsappNumber professionalProfile.photos -_id')
      .skip(skip)
      .limit(limit);

    const responsePayload = {
      success: true,
      message: config.experience ? config.experience.discoveryText : 'Discovery',
      count: professionals.length,
      pagination: {
        page,
        limit,
        total,
        hasMore: skip + professionals.length < total
      },
      data: professionals.map(p => ({
        ...(p.toObject ? p.toObject() : (p._doc || p)),
        revelationStatus: config.experience ? config.experience.statusRevealed : 'REVEALED'
      }))
    };

    // Store the response in cache
    cache.set(cacheKey, {
      response: responsePayload,
      expires: Date.now() + CACHE_TTL
    });

    res.status(200).json(responsePayload);
  } catch (error) {
    res.status(400).json({
      success: false,
      error: error.message
    });
  }
};

// @desc    Get single professional by alias (Public)
// @route   GET /api/v1/professionals/:alias
// @access  Public
exports.getProfessionalByAlias = async (req, res, next) => {
  try {
    const professional = await User.findOne({ 
      'professionalProfile.alias': req.params.alias,
      role: 'professional',
      isVerified: true
    }).select('professionalProfile.alias professionalProfile.quality professionalProfile.bio professionalProfile.services professionalProfile.location professionalProfile.pricing professionalProfile.measurements professionalProfile.height professionalProfile.eyeColor professionalProfile.hasTattoos professionalProfile.whatsappNumber professionalProfile.photos -_id');

    if (!professional) {
      return res.status(404).json({
        success: false,
        error: 'Professional not found'
      });
    }

    res.status(200).json({
      success: true,
      data: professional
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      error: error.message
    });
  }
};

// @desc    Get all unique specialties (from services)
// @route   GET /api/v1/professionals/specialties
// @access  Public
exports.getSpecialties = async (req, res, next) => {
  try {
    // Bypass the database entirely and only retrieve the real, 
    // official specialty types defined in the app configuration.
    const services = config.services ? [...config.services] : [];

    const responsePayload = {
      success: true,
      count: services.length,
      data: services.sort()
    };
    
    res.status(200).json(responsePayload);
  } catch (error) {
    res.status(400).json({
      success: false,
      error: error.message
    });
  }
};

// @desc    Get current logged in professional's profile (Private)
// @route   GET /api/v1/professionals/me
// @access  Private/Professional
exports.getMe = async (req, res, next) => {
  try {
    const user = await User.findById(req.user.id);

    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'User not found in dashboard'
      });
    }

    // Check transaction readiness
    let isReadyForTransactions = user.professionalProfile.rateChangeAcknowledged;
    
    // If it's a duo, the partner must also have acknowledged
    if (user.professionalProfile.isDuo && user.professionalProfile.duoPartner) {
      const partner = await User.findById(user.professionalProfile.duoPartner);
      if (partner && !partner.professionalProfile.rateChangeAcknowledged) {
        isReadyForTransactions = false;
      }
    }

    res.status(200).json({
      success: true,
      isReadyForTransactions,
      data: user
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      error: error.message
    });
  }
};

// @desc    Acknowledge price rate change (Private)
// @route   PUT /api/v1/professionals/acknowledge-rate
// @access  Private/Professional
exports.acknowledgeRateChange = async (req, res, next) => {
  try {
    const user = await User.findById(req.user.id);

    if (user.role !== 'professional') {
      return res.status(403).json({ success: false, error: 'Only professionals can acknowledge rates' });
    }

    user.professionalProfile.rateChangeAcknowledged = true;
    await user.save();

    res.status(200).json({
      success: true,
      message: 'Rate change acknowledged successfully'
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      error: error.message
    });
  }
};

// @desc    Admin: Notify all professionals of rate change (Private/Admin)
// @route   POST /api/v1/professionals/notify-rate-change
// @access  Private/Admin
exports.notifyRateChange = async (req, res, next) => {
  try {
    const sendEmail = require('../sendEmail');
    
    // Reset acknowledgment for all professionals
    await User.updateMany(
      { role: 'professional' },
      { 'professionalProfile.rateChangeAcknowledged': false }
    );

    const professionals = await User.find({ role: 'professional' });

    // Send emails in background (could use a queue in a real app)
    const emailPromises = professionals.map(p => 
      sendEmail({
        email: p.email,
        subject: 'SexAppeal Platform - Price Rate Change',
        message: `Hello ${p.professionalProfile.alias || 'Professional'},\n\nThere has been a change in the price rates. You must acknowledge this change in your dashboard before you can continue with transactions.\n\nThank you!`
      }).catch(err => console.error(`Failed to send email to ${p.email}:`, err))
    );

    res.status(200).json({
      success: true,
      message: `Rate change notification triggered for ${professionals.length} professionals`
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      error: error.message
    });
  }
};

// @desc    Update professional profile (Private)
// @route   PUT /api/v1/professionals/updateprofile
// @access  Private/Professional
exports.updateProfile = async (req, res, next) => {
  try {
    // Get existing photos from the form (sent as a JSON string)
    const existingPhotos = req.body.existingPhotos ? JSON.parse(req.body.existingPhotos) : [];

    // Get URLs of newly uploaded files from multer
    const newPhotoUrls = req.files ? req.files.map(file => `/uploads/photos/${file.filename}`) : [];

    // Combine old and new photo URLs
    const allPhotos = [...existingPhotos, ...newPhotoUrls];

    // Build the professionalProfile object from the form fields
    const professionalProfile = {
      alias: req.body.alias,
      bio: req.body.bio,
      services: req.body.services ? req.body.services.split(',').map(s => s.trim()).filter(s => s) : [],
      measurements: req.body.measurements,
      height: req.body.height,
      photos: allPhotos,
      whatsappNumber: req.body.whatsappNumber,
      hasOwnApartment: req.body.hasOwnApartment === 'true',
      hasFantasyWardrobe: req.body.hasFantasyWardrobe === 'true'
    };

    // Safely update the nested location object if location data is provided
    if (req.body.province || req.body.city || req.body.neighborhood) {
      professionalProfile.location = {
        province: req.body.province || undefined,
        city: req.body.city || undefined,
        neighborhood: req.body.neighborhood || undefined
      };
    }

    // Auto-calculate Category (Quality) based on scoring algorithm
    let score = 0;
    if (professionalProfile.hasOwnApartment) score += 2;
    if (professionalProfile.hasFantasyWardrobe) score += 2;
    
    const nbhd = (professionalProfile.location?.neighborhood || '').trim().toLowerCase();
    if (['recoleta', 'puerto madero', 'palermo'].includes(nbhd)) score += 3;
    else if (['belgrano', 'caballito', 'san telmo'].includes(nbhd)) score += 2;
    else if (nbhd !== '') score += 1;

    if (score >= 6) professionalProfile.quality = 'Premium';
    else if (score >= 4) professionalProfile.quality = 'Gold';
    else if (score >= 2) professionalProfile.quality = 'Silver';
    else professionalProfile.quality = 'Standard';

    const fieldsToUpdate = {
      professionalProfile: professionalProfile
    };

    const user = await User.findByIdAndUpdate(req.user.id, fieldsToUpdate, {
      new: true,
      runValidators: true
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
