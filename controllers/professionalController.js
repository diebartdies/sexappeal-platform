const User = require('../models/User');
const config = require('../config/appConfig');
const ActivityLog = require('../models/ActivityLog');
const sendEmail = require('../sendEmail');

// Simple in-memory cache setup
const cache = new Map();
const CACHE_TTL = 60 * 1000; // 1 minute TTL in milliseconds

// Helper function to check if professional is active RIGHT NOW in Argentina timezone
function checkIsActive(profile) {
  if (!profile || !profile.workingDays || profile.workingDays.length === 0) return false;
  if (!profile.workingHours || !profile.workingHours.start || !profile.workingHours.end) return false;

  const now = new Date();
  const formatter = new Intl.DateTimeFormat('en-US', {
    timeZone: 'America/Argentina/Buenos_Aires', weekday: 'long', hour: 'numeric', minute: 'numeric', hour12: false
  });
  const parts = formatter.formatToParts(now);
  let currentDay = '', currentHour = 0, currentMinute = 0;
  for (let p of parts) {
    if (p.type === 'weekday') currentDay = p.value;
    if (p.type === 'hour') currentHour = parseInt(p.value, 10);
    if (p.type === 'minute') currentMinute = parseInt(p.value, 10);
  }
  if (currentHour === 24) currentHour = 0; // standard formatting safeguard

  const currentTotal = currentHour * 60 + currentMinute;
  const [startH, startM] = profile.workingHours.start.split(':').map(Number);
  const [endH, endM] = profile.workingHours.end.split(':').map(Number);
  const startTotal = startH * 60 + startM;
  const endTotal = endH * 60 + endM;

  if (startTotal <= endTotal) {
    // Standard shift (e.g., 09:00 to 18:00)
    if (!profile.workingDays.includes(currentDay)) return false;
    return currentTotal >= startTotal && currentTotal <= endTotal;
  } else {
    // Overnight shift (e.g., 22:00 to 06:00) crosses midnight
    if (currentTotal <= endTotal) return profile.workingDays.includes(new Date(now.getTime() - 86400000).toLocaleDateString('en-US', { timeZone: 'America/Argentina/Buenos_Aires', weekday: 'long' }));
    if (currentTotal >= startTotal) return profile.workingDays.includes(currentDay);
    return false;
  }
}

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
      isVerified: true,
      'professionalProfile.subscriptionStatus': { $ne: 'suspended' },
      'professionalProfile.isExposed': { $ne: false }
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
      const specialties = req.query.specialty.trim().split(',').map(s => s.trim()).filter(Boolean);
      if (specialties.length > 0) {
        // Use $in to match any of the selected specialties
        query['professionalProfile.services'] = { $in: specialties };
      }
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
      .select('professionalProfile.alias professionalProfile.quality professionalProfile.bio professionalProfile.services professionalProfile.location professionalProfile.pricing professionalProfile.measurements professionalProfile.height professionalProfile.eyeColor professionalProfile.hasTattoos professionalProfile.photos professionalProfile.workingHours professionalProfile.workingDays -_id')
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
      data: professionals.map(p => {
        const profObj = p.toObject ? p.toObject() : (p._doc || p);
        return {
          ...profObj,
          revelationStatus: config.experience ? config.experience.statusRevealed : 'REVEALED',
          isActiveNow: checkIsActive(profObj.professionalProfile)
        };
      })
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
    }).select('professionalProfile.alias professionalProfile.quality professionalProfile.bio professionalProfile.services professionalProfile.location professionalProfile.pricing professionalProfile.measurements professionalProfile.height professionalProfile.eyeColor professionalProfile.hasTattoos professionalProfile.whatsappNumber professionalProfile.photos professionalProfile.workingHours professionalProfile.workingDays -_id');

    if (!professional) {
      return res.status(404).json({
        success: false,
        error: 'Professional not found'
      });
    }

    // Convert to object, check for WhatsApp, and delete the actual number so it's never sent to the browser
    const profObj = professional.toObject();
    const hasWhatsapp = !!(profObj.professionalProfile.whatsappNumber && profObj.professionalProfile.whatsappNumber.trim() !== '');
    delete profObj.professionalProfile.whatsappNumber;
    profObj.professionalProfile.hasWhatsapp = hasWhatsapp;
    profObj.isActiveNow = checkIsActive(profObj.professionalProfile);

    // Track the Profile View Activity
    try {
      await ActivityLog.create({
        professional: professional._id,
        action: 'profile_view',
        ipAddress: req.ip,
        userAgent: req.headers['user-agent']
      });
    } catch(err) { console.error('Activity log error:', err.message); }

    // Fetch dynamic pricing
    const adminUser = await User.findOne({ role: 'admin' });
    const globalPricing = adminUser?.adminSettings?.pricing || {
        Elite: 50000, Premium: 40000, Gold: 30000, Silver: 20000, Standard: 15000
    };

    res.status(200).json({
      success: true,
      data: profObj
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      error: error.message
    });
  }
};

// @desc    Redirect to Professional's WhatsApp (Anti-Scraping Protection)
// @route   GET /api/v1/professionals/:alias/whatsapp
// @access  Public
exports.contactWhatsApp = async (req, res, next) => {
  try {
    const professional = await User.findOne({ 
      'professionalProfile.alias': req.params.alias,
      role: 'professional',
      isVerified: true
    }).select('professionalProfile.whatsappNumber professionalProfile.alias');

    if (!professional || !professional.professionalProfile.whatsappNumber) {
      return res.status(404).send('WhatsApp contact not available for this professional.');
    }

    const cleanNumber = professional.professionalProfile.whatsappNumber.replace(/\D/g, '');
    const message = `Hello ${professional.professionalProfile.alias}, I saw your profile on SexAppeal and I'm interested in your services.`;
    const waUrl = `https://wa.me/${cleanNumber}?text=${encodeURIComponent(message)}`;

    // Track the WhatsApp Click Activity
    try {
      await ActivityLog.create({
        professional: professional._id,
        action: 'whatsapp_click',
        ipAddress: req.ip,
        userAgent: req.headers['user-agent']
      });
    } catch(err) { console.error('Activity log error:', err.message); }

    res.redirect(waUrl);
  } catch (error) {
    res.status(400).send('Unable to redirect to WhatsApp.');
  }
};

// @desc    Get all unique specialties (from services)
// @route   GET /api/v1/professionals/specialties
// @access  Public
exports.getSpecialties = async (req, res, next) => {
  try {
    const query = {
      role: 'professional',
      isVerified: true,
      'professionalProfile.subscriptionStatus': { $ne: 'suspended' },
      'professionalProfile.isExposed': { $ne: false }
    };

    // If a quality filter is applied, only show specialties from that quality tier
    if (req.query.quality && req.query.quality.trim()) {
      query['professionalProfile.quality'] = req.query.quality.trim();
    }

    // Dynamically get all unique services from active professionals in the database.
    // This is more reliable than a static config list.
    const services = await User.distinct('professionalProfile.services', query);
    
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
    let isReadyForTransactions = false;
    
    if (user.role === 'professional' && user.professionalProfile) {
      isReadyForTransactions = user.professionalProfile.rateChangeAcknowledged || false;
      // If it's a duo, the partner must also have acknowledged
      if (user.professionalProfile.isDuo && user.professionalProfile.duoPartner) {
        const partner = await User.findById(user.professionalProfile.duoPartner);
        if (partner && !partner.professionalProfile.rateChangeAcknowledged) {
          isReadyForTransactions = false;
        }
      }
    } else if (user.role === 'admin') {
      isReadyForTransactions = true;
    }

    // Fetch performance metrics to show on the dashboard
    let profileViews = 0;
    let whatsappClicks = 0;
    try {
      profileViews = await ActivityLog.countDocuments({ professional: user._id, action: 'profile_view' });
      whatsappClicks = await ActivityLog.countDocuments({ professional: user._id, action: 'whatsapp_click' });
    } catch (err) { console.error('Failed to load stats:', err.message); }

    res.status(200).json({
      success: true,
      isReadyForTransactions,
      stats: { profileViews, whatsappClicks },
      globalPricing,
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

    await ActivityLog.create({
      professional: user._id,
      action: 'acknowledge_rate_change',
      ipAddress: req.ip,
      userAgent: req.headers['user-agent']
    });

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
    const currentUser = await User.findById(req.user.id);
    
    // Admin Pricing Override
    if (currentUser.role === 'admin' && req.body.adminPricing) {
        const pricing = JSON.parse(req.body.adminPricing);
        currentUser.adminSettings = currentUser.adminSettings || {};
        currentUser.adminSettings.pricing = pricing;
        await currentUser.save();
        return res.status(200).json({ success: true, data: currentUser });
    }

    // Get existing photos from the form (sent as a JSON string)
    const existingPhotos = req.body.existingPhotos ? JSON.parse(req.body.existingPhotos) : [];

    // Get URLs of newly uploaded files from multer
    const newPhotoUrls = req.files ? req.files.map(file => `/uploads/photos/${file.filename}`) : [];

    // Combine old and new photo URLs
    const allPhotos = [...existingPhotos, ...newPhotoUrls];

    // Check metadata for new photos to validate they are recent (within 1 year)
    let lastPhotoUpdate = undefined;
    if (req.files && req.files.length > 0) {
      const oneYearAgo = Date.now() - 365 * 24 * 60 * 60 * 1000;
      const fs = require('fs');
      let invalidFound = false;
      
      for (const file of req.files) {
        const stats = fs.statSync(file.path);
        // Using file stats as a proxy for EXIF metadata check (enforcing new uploads)
        if (stats.mtimeMs < oneYearAgo) invalidFound = true;
      }
      
      if (invalidFound) {
        req.files.forEach(file => fs.unlinkSync(file.path));
        return res.status(400).json({ success: false, error: 'One or more uploaded photos are older than a year according to metadata. Please upload recent photos.' });
      }
      lastPhotoUpdate = Date.now();
    }

    const rawDays = req.body.workingDays;
    const parsedDays = rawDays ? rawDays.split(',').map(s => s.trim()).filter(s => s) : ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

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
      hasFantasyWardrobe: req.body.hasFantasyWardrobe === 'true',
      workingHours: {
        start: req.body.workingHoursStart || '00:00',
        end: req.body.workingHoursEnd || '23:59'
      },
      workingDays: parsedDays
    };
    
    if (req.body.isExposed !== undefined) {
      professionalProfile.isExposed = req.body.isExposed === 'true';
    }
    if (req.body.paysMonthlyCharges !== undefined) {
      professionalProfile.paysMonthlyCharges = req.body.paysMonthlyCharges === 'true';
    }

    if (lastPhotoUpdate) professionalProfile.lastPhotoUpdate = lastPhotoUpdate;

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

    if (score >= 8) professionalProfile.quality = 'Elite';
    else if (score >= 6) professionalProfile.quality = 'Premium';
    else if (score >= 4) professionalProfile.quality = 'Gold';
    else if (score >= 2) professionalProfile.quality = 'Silver';
    else professionalProfile.quality = 'Standard';

    // Use dot notation to avoid overwriting the entire subdocument
    const fieldsToUpdate = {};
    Object.keys(professionalProfile).forEach(key => {
      fieldsToUpdate[`professionalProfile.${key}`] = professionalProfile[key];
    });

    const user = await User.findByIdAndUpdate(req.user.id, { $set: fieldsToUpdate }, {
      new: true,
      runValidators: true
    });

    await ActivityLog.create({
      professional: user._id,
      action: 'update_profile',
      ipAddress: req.ip,
      userAgent: req.headers['user-agent']
    });

    // Notify admin of profile update
    try {
      const adminEmail = config.payment && config.payment.adminEmail ? config.payment.adminEmail : 'admin@drsrv.net.ar';
      await sendEmail({
        email: adminEmail,
        subject: 'SexAppeal - Professional Profile Updated',
        message: `The professional "${professionalProfile.alias}" (${user.email}) has updated their profile.`
      });
    } catch (err) { console.error('Failed to notify admin:', err.message); }

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
