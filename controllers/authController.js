const User = require('../models/User');
const config = require('../config/appConfig');
const sendEmail = require('../sendEmail');
const crypto = require('crypto');
const ActivityLog = require('../models/ActivityLog');

// @desc    Register user
// @route   POST /api/v1/auth/register
// @access  Public
exports.register = async (req, res, next) => {
  try {
    const { email, password, role, professionalProfile } = req.body;

    // Check if user already exists
    let existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({
        success: false,
        error: 'This email is already registered. If you forgot your password, please use the recovery option.'
      });
    }

    // Generate a 6-digit verification code
    const verificationCode = Math.floor(100000 + Math.random() * 900000).toString();
    // Set expiration to 10 minutes from now
    const verificationCodeExpire = new Date(Date.now() + 10 * 60 * 1000);

    // Randomly assign a verification gesture for professionals
    const gestures = ['1 finger', '2 fingers', '3 fingers', 'thumbs up'];
    const assignedGesture = role === 'professional' ? gestures[Math.floor(Math.random() * gestures.length)] : undefined;

    // Calculate Category (Quality) automatically if professionalProfile is provided
    if (role === 'professional' && professionalProfile) {
      let score = 0;
      if (professionalProfile.hasOwnApartment === 'true' || professionalProfile.hasOwnApartment === true) score += 2;
      if (professionalProfile.hasFantasyWardrobe === 'true' || professionalProfile.hasFantasyWardrobe === true) score += 2;
      
      const nbhd = (professionalProfile.location?.neighborhood || '').trim().toLowerCase();
      if (['recoleta', 'puerto madero', 'palermo'].includes(nbhd)) score += 3;
      else if (['belgrano', 'caballito', 'san telmo'].includes(nbhd)) score += 2;
      else if (nbhd !== '') score += 1;

      if (score >= 6) professionalProfile.quality = 'Premium';
      else if (score >= 4) professionalProfile.quality = 'Gold';
      else if (score >= 2) professionalProfile.quality = 'Silver';
      else professionalProfile.quality = 'Standard';
    }

    // Create user
    const user = await User.create({
      email,
      password,
      role,
      professionalProfile: role === 'professional' ? professionalProfile : undefined,
      verificationStatus: role === 'professional' ? 'pending' : 'approved',
      verificationGesture: assignedGesture,
      isVerified: role !== 'professional',
      isEmailVerified: false,
nos       emailVerificationCode: verificationCode,
      emailVerificationCodeExpire: verificationCodeExpire
    });

    // Craft a luxurious welcome message specifically for professionals
    let emailSubject = 'SexAppeal Platform - Email Verification Code';
    let emailMessage = `Welcome to the SexAppeal Platform!\n\nYour verification code is: ${verificationCode}\n\nThis code will expire in 10 minutes.`;

    if (role === 'professional') {
      emailSubject = 'Welcome to SexAppeal - Verification & Next Steps';
      emailMessage = 'Welcome to the SexAppeal Platform, a sanctuary designed exclusively for Living Treasures like you.

Your verification code is: ${verificationCode}
(This code will expire in 10 minutes)

OUR PROMISE TO YOU
We built SexAppeal with one goal: to make your professional life easier, safer, and economically better. We are moving away from the cluttered, exploitative models of the past.

THE 2-MONTH GRACE PERIOD & FAIR PRICING
To prove our value to you, your first 2 months on the platform are completely free. No hidden fees, no credit cards required upfront. 
After your 2-month trial, our subscription fee is strictly set at 50% of what legacy competitors charge. In real terms, a full month of access costs roughly half of what you would earn in a single shift or meeting. You keep more of what you earn.

NEXT STEPS: PROFILE COMPLETION & IDENTITY VERIFICATION
To protect our community and ensure your safety, we require a strict but entirely private identity verification. Once you log in, you will need to complete your profile request by:
1. Supplying the Category you wish to enroll in and selecting the types of Services you will be delivering (including our new "Content Delivery" option).
2. Securely submitting a clear photo of your valid Government ID.
3. Securely submitting a live selfie holding your ID next to your face, while holding up ${assignedGesture} (to prove it is a live, authentic photo).

Your documents are handled with absolute discretion, stored securely, and are never shared or published.

Welcome to the Architecture of Intimacy.\`;
    }

    try {
      await sendEmail({
        email: user.email,
        subject: emailSubject,
        message: emailMessage
      });
    } catch (err) {
      console.error('Email error:', err);
      // In production, we might want to fail, but for now we just log it
      // so the registration can proceed and we can test the rest of the flow.
    }

    const responsePayload = {
      success: true,
      data: user,
      message: 'Registration successful. Please check your email for the verification code.'
    };

    if (process.env.NODE_ENV !== 'production') {
      responsePayload.verificationCode = verificationCode;
    }

    res.status(201).json(responsePayload);
  } catch (error) {
    res.status(400).json({
      success: false,
      error: error.message
    });
  }
};

// @desc    Verify email with code
// @route   POST /api/v1/auth/verify-email
// @access  Public
exports.verifyEmail = async (req, res, next) => {
  try {
    const { email, code } = req.body;

    if (!email || !code) {
      return res.status(400).json({ success: false, error: 'Please provide email and code' });
    }

    const user = await User.findOne({ 
      email,
      emailVerificationCode: code,
      emailVerificationCodeExpire: { $gt: Date.now() } // Ensure code is not expired
    });

    if (!user) {
      return res.status(400).json({ success: false, error: 'Invalid or expired verification code' });
    }

    // Mark as verified, log them in, and clean up the database fields
    user.isEmailVerified = true;
    user.emailVerificationCode = undefined;
    user.emailVerificationCodeExpire = undefined;
    await user.save();

    sendTokenResponse(user, 200, res);
  } catch (error) {
    res.status(400).json({ success: false, error: error.message });
  }
};

// @desc    Login user
// @route   POST /api/v1/auth/login
// @access  Public
exports.login = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    // Validate email & password
    if (!email || !password) {
      return res.status(400).json({
        success: false,
        error: 'Please provide an email and password'
      });
    }

    // Check for user
    const user = await User.findOne({ email }).select('+password');

    if (!user) {
      return res.status(401).json({
        success: false,
        error: 'Invalid credentials'
      });
    }

    // Check if password matches
    const isMatch = await user.matchPassword(password);

    if (!isMatch) {
      return res.status(401).json({
        success: false,
        error: 'Invalid credentials'
      });
    }

    if (!user.isEmailVerified) {
      return res.status(401).json({
        success: false,
        error: 'Please verify your email before logging in'
      });
    }

    // Log professional login activity
    if (user.role === 'professional') {
      await ActivityLog.create({
        professional: user._id,
        action: 'login',
        ipAddress: req.ip,
        userAgent: req.headers['user-agent']
      });
    }

    sendTokenResponse(user, 200, res);
  } catch (error) {
    res.status(400).json({
      success: false,
      error: error.message
    });
  }
};

// @desc    Guest login (Anonymous browsing)
// @route   POST /api/v1/auth/guest-login
// @access  Public
exports.guestLogin = async (req, res, next) => {
  try {
    const guestId = crypto.randomBytes(4).toString('hex');
    const guestUsername = `Guest_${guestId}`;

    const guestUser = await User.create({
      name: guestUsername,
      email: `${guestUsername}@anonymous.com`,
      password: crypto.randomBytes(16).toString('hex'),
      role: 'user', // Default role for regular viewing
      verificationStatus: 'approved', // Required by schema to pass validation
      isVerified: true, // Bypass verification
      isEmailVerified: true, // Bypass verification
      isAnonymous: true // Flag to identify temporary accounts
    });

    sendTokenResponse(guestUser, 200, res);
  } catch (error) {
    console.error('Guest Login Error:', error);
    res.status(500).json({ success: false, error: error.message || 'Failed to generate guest session' });
  }
};

// @desc    Forgot password
// @route   POST /api/v1/auth/forgotpassword
// @access  Public
exports.forgotPassword = async (req, res, next) => {
  try {
    const { email } = req.body;
    const user = await User.findOne({ email });

    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'There is no user with that email'
      });
    }

    // Generate a 6-digit recovery code
    const resetCode = Math.floor(100000 + Math.random() * 900000).toString();
    const resetCodeExpire = new Date(Date.now() + 10 * 60 * 1000);

    // We reuse the emailVerificationCode fields to store the reset code 
    // since we know they exist in the User schema.
    user.emailVerificationCode = resetCode;
    user.emailVerificationCodeExpire = resetCodeExpire;
    await user.save({ validateBeforeSave: false });

    try {
      await sendEmail({
        email: user.email,
        subject: 'SexAppeal Platform - Password Reset Code',
        message: `You requested a password reset.\n\nYour reset code is: ${resetCode}\n\nThis code will expire in 10 minutes.`
      });

      res.status(200).json({ success: true, message: 'Email sent' });
    } catch (err) {
      console.error('Email error:', err);
      user.emailVerificationCode = undefined;
      user.emailVerificationCodeExpire = undefined;
      await user.save({ validateBeforeSave: false });

      return res.status(500).json({ success: false, error: 'Email could not be sent' });
    }
  } catch (error) {
    res.status(400).json({ success: false, error: error.message });
  }
};

// @desc    Reset password
// @route   PUT /api/v1/auth/resetpassword
// @access  Public
exports.resetPassword = async (req, res, next) => {
  try {
    const { email, code, password } = req.body;

    if (!email || !code || !password) {
      return res.status(400).json({ success: false, error: 'Please provide email, code, and new password' });
    }

    const user = await User.findOne({
      email,
      emailVerificationCode: code,
      emailVerificationCodeExpire: { $gt: Date.now() }
    });

    if (!user) {
      return res.status(400).json({
        success: false,
        error: 'Invalid or expired reset code'
      });
    }

    // Set new password
    user.password = password;
    user.emailVerificationCode = undefined;
    user.emailVerificationCodeExpire = undefined;
    await user.save();

    sendTokenResponse(user, 200, res);
  } catch (error) {
    res.status(400).json({ success: false, error: error.message });
  }
};

// Get token from model, create cookie and send response
const sendTokenResponse = (user, statusCode, res) => {
  // Create token
  const token = user.getSignedJwtToken();

  const options = {
    expires: new Date(Date.now() + process.env.JWT_COOKIE_EXPIRE * 24 * 60 * 60 * 1000),
    httpOnly: true
  };

  if (process.env.NODE_ENV === 'production') {
    options.secure = true;
  }

  res
    .status(statusCode)
    .cookie('token', token, options)
    .json({
      success: true,
      token,
      user
    });
};