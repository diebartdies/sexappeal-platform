const User = require('../models/User');
const config = require('../config/appConfig');
const sendEmail = require('../sendEmail');
const crypto = require('crypto');
const fs = require('fs');
const ActivityLog = require('../models/ActivityLog');
const { getClientIp } = require('../utils/clientIp');
const { recordAdminLoginIp, HOME_LABEL } = require('../utils/adminKnownIps');
const Specialty = require('../models/Specialty');
const { normalizeRegistrationMobilePhone } = require('../utils/professionalInviteMessage');

function ageFromBirthDate(dateStr) {
  if (!dateStr) return null;
  const dob = new Date(dateStr);
  if (Number.isNaN(dob.getTime())) return null;
  const today = new Date();
  let years = today.getFullYear() - dob.getFullYear();
  const monthDiff = today.getMonth() - dob.getMonth();
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < dob.getDate())) years -= 1;
  return years;
}

// @desc    Register user
// @route   POST /api/v1/auth/register
// @access  Public
exports.register = async (req, res, next) => {
  try {
    // Destructure all fields from the multipart form body
    let { 
      email, password, role, alias, bio, hasOwnApartment, hasFantasyWardrobe, 
      province, city, neighborhood, measurements, height, services, verificationGesture,
      firstName, surname, middleName, idNumber, birthDate, age: ageField, mobilePhone, street, number, floor, apartment, postalCode,
      originCountry, instagram, facebook, quality, termsAccepted, registrationMode
    } = req.body;

    const isExpressRegistration = role === 'professional'
      && (registrationMode === 'express' || String(registrationMode || '').toLowerCase() === 'express');

    // Normalize email to prevent case-sensitive duplicate accounts
    if (email) email = email.toLowerCase().trim();

    let age;
    if (birthDate) {
        age = ageFromBirthDate(birthDate);
    } else if (ageField !== undefined && ageField !== null && String(ageField).trim() !== '') {
        age = parseInt(String(ageField).trim(), 10);
        if (!Number.isFinite(age) || age < 18 || age > 99) {
          return res.status(400).json({ success: false, error: 'Please enter a valid age (18–99).' });
        }
        birthDate = new Date(new Date().getFullYear() - age, 0, 1).toISOString().slice(0, 10);
    }

    if (role === 'professional' && isExpressRegistration) {
      if (!email || !String(email).trim()) {
        return res.status(400).json({ success: false, error: 'Email is required.' });
      }
      if (!password || String(password).length < 6) {
        return res.status(400).json({ success: false, error: 'Password must be at least 6 characters.' });
      }
      if (!mobilePhone || !String(mobilePhone).trim()) {
        return res.status(400).json({ success: false, error: 'Mobile phone is required.' });
      }
      const normalizedMobile = normalizeRegistrationMobilePhone(mobilePhone);
      if (normalizedMobile) mobilePhone = normalizedMobile;
      if (!birthDate || !String(birthDate).trim()) {
        return res.status(400).json({ success: false, error: 'Birth date is required.' });
      }
      if (age === undefined || age === null || !Number.isFinite(age) || age < 18 || age > 99) {
        return res.status(400).json({ success: false, error: 'You must be at least 18 years old to register.' });
      }
    } else if (role === 'professional') {
      const required = [
        ['firstName', firstName], ['surname', surname], ['alias', alias], ['idNumber', idNumber],
        ['street', street], ['number', number], ['province', province], ['city', city],
        ['originCountry', originCountry], ['mobilePhone', mobilePhone]
      ];
      for (const [label, val] of required) {
        if (!val || !String(val).trim()) {
          return res.status(400).json({ success: false, error: `Missing required field: ${label}` });
        }
      }
      const allowedQualities = ['Standard', 'Silver', 'Gold', 'Premium', 'Elite'];
      if (quality && !allowedQualities.includes(String(quality).trim())) {
        return res.status(400).json({ success: false, error: 'Please select a valid category.' });
      }
      if (!req.files || req.files.length < 3) {
        return res.status(400).json({ success: false, error: 'All three verification photos are required.' });
      }
    }

    async function generateExpressAlias(phone, mail) {
      const digits = String(phone || '').replace(/\D/g, '').slice(-4);
      const mailLocal = String(mail || '').split('@')[0].replace(/\W/g, '').slice(0, 12);
      const base = (mailLocal || `treasure${digits || 'new'}`).toLowerCase();
      let candidate = base;
      let suffix = 0;
      // eslint-disable-next-line no-constant-condition
      while (true) {
        const taken = await User.findOne({
          role: 'professional',
          'professionalProfile.alias': { $regex: new RegExp(`^${candidate.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`, 'i') }
        });
        if (!taken) return candidate;
        suffix += 1;
        candidate = `${base}${suffix}`;
      }
    }

    if (role === 'professional' && isExpressRegistration && !alias) {
      alias = await generateExpressAlias(mobilePhone, email);
    }

    const allowedQualities = ['Standard', 'Silver', 'Gold', 'Premium', 'Elite'];
    const selectedQuality = role === 'professional'
      ? (allowedQualities.includes(String(quality || '').trim()) ? String(quality).trim() : undefined)
      : (allowedQualities.includes(String(quality || '').trim()) ? String(quality).trim() : 'Standard');
    const evaluationQuality = role === 'professional'
      ? allowedQualities[Math.floor(Math.random() * allowedQualities.length)]
      : selectedQuality;

    // Reconstruct the professionalProfile object
    const professionalProfile = role === 'professional' ? {
      firstName, surname, middleName, idNumber, birthDate: birthDate ? new Date(birthDate) : undefined, age, mobilePhone,
      instagram, facebook,
      alias, bio: bio || '',
      hasOwnApartment: hasOwnApartment === 'true',
      hasFantasyWardrobe: hasFantasyWardrobe === 'true',
      location: { province, city, neighborhood, street, number, floor, apartment, postalCode, country: originCountry },
      measurements, height,
      whatsappNumber: mobilePhone ? String(mobilePhone).trim() : '',
      services: services ? services.split(',').map(s => s.trim()).filter(Boolean) : [],
      ...(selectedQuality ? { desiredQuality: selectedQuality } : {}),
      quality: evaluationQuality,
      isEvaluationPeriod: true,
      expressRegistration: isExpressRegistration
    } : undefined;

    // Check if user already exists
    let existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({
        success: false,
        error: 'This email is already registered. If you forgot your password, please use the recovery option.'
      });
    }

    // Check if Alias is already taken (case-insensitive)
    if (role === 'professional' && alias) {
      let existingAlias = await User.findOne({ 
        role: 'professional',
        'professionalProfile.alias': { $regex: new RegExp('^' + alias.trim() + '$', 'i') } 
      });
      if (existingAlias) {
        return res.status(400).json({
          success: false,
          error: 'This alias is already in use by another professional. Please choose a different one.'
        });
      }
    }

    // Generate a 6-digit verification code
    const verificationCode = Math.floor(100000 + Math.random() * 900000).toString();
    const codeExpireMs = config.verificationCodeExpireMinutes * 60 * 1000;
    const verificationCodeExpire = new Date(Date.now() + codeExpireMs);

    // Category chosen at registration (admin pricing table); legacy auto-score removed.
    // Convert uploaded files to Base64 strings to store directly in the database
    const verificationDocuments = [];
    if (req.files) {
      for (const file of req.files) {
        const base64Data = fs.readFileSync(file.path, 'base64');
        verificationDocuments.push(`data:${file.mimetype};base64,${base64Data}`);
        if (fs.existsSync(file.path)) fs.unlinkSync(file.path); // Remove external file
      }
    }

    // Age-verification + Terms & Conditions acceptance captured at registration.
    // The frontend blocks submission until the checkbox is ticked, so this is
    // expected to be truthy for every real registration.
    const acceptedTerms = termsAccepted === true || termsAccepted === 'true' || termsAccepted === 'on';

    // Create user
    const user = await User.create({
      email,
      password,
      role,
      professionalProfile: role === 'professional' ? professionalProfile : undefined,
      verificationDocuments,
      verificationStatus: role === 'professional' ? 'pending' : 'approved',
      verificationGesture: role === 'professional' ? verificationGesture : undefined,
      isVerified: role !== 'professional',
      isEmailVerified: false,
      emailVerificationCode: verificationCode,
      emailVerificationCodeExpire: verificationCodeExpire,
      termsAcceptedAt: acceptedTerms ? new Date() : undefined,
      termsVersion: acceptedTerms ? config.terms.version : undefined
    });

    // Audit-log the registration acceptance alongside the per-account stamp.
    if (acceptedTerms) {
      try {
        const TermsAcceptance = require('../models/TermsAcceptance');
        const acceptIp = req.headers['x-forwarded-for'] ? req.headers['x-forwarded-for'].split(',')[0].trim() : (req.socket?.remoteAddress || req.ip);
        await TermsAcceptance.create({
          user: user._id,
          termsVersion: config.terms.version,
          source: 'registration',
          ip: acceptIp,
          userAgent: req.headers['user-agent'] ? String(req.headers['user-agent']).slice(0, 500) : undefined
        });
      } catch (err) {
        console.error('Failed to log registration terms acceptance:', err.message);
      }
    }

    // Sync the new Specialties many-to-many junction table
    if (role === 'professional' && professionalProfile && professionalProfile.services && professionalProfile.services.length > 0) {
      const specialtyDocs = professionalProfile.services.map(s => ({
        user: user._id,
        specialty: s
      }));
      await Specialty.insertMany(specialtyDocs).catch(err => console.error('Failed to sync specialties table:', err.message));
    }

    if (role === 'professional') {
      const clientIp = req.headers['x-forwarded-for'] ? req.headers['x-forwarded-for'].split(',')[0].trim() : (req.socket.remoteAddress || req.ip);
      await ActivityLog.create({
        professional: user._id,
        action: 'register',
        ipAddress: req.ip,
        ipAddress: clientIp,
        userAgent: req.headers['user-agent']
      });

      // Notify Admin of new registration
      try {
        const adminEmail = config.payment && config.payment.adminEmail ? config.payment.adminEmail : 'admin@drsrv.net.ar';
        await sendEmail({
          email: adminEmail,
          subject: 'SexAppeal - New Professional Registration',
          message: isExpressRegistration
            ? `Express registration (minimal signup): ${email}\nPhone: ${mobilePhone}\nBirth date: ${birthDate} (age ${age})\nAlias (temp): ${alias}\n\nComplete profile and upload gallery photos in Admin before approving.`
            : `A new professional has registered: ${email}\nRole: ${role}\nVerification Status: ${user.verificationStatus}`
        });
      } catch (err) { console.error('Failed to notify admin:', err.message); }
    }

    // Craft a luxurious welcome message specifically for professionals
    let emailSubject = 'SexAppeal Platform - Email Verification Code';
    let emailMessage = `Welcome to the SexAppeal Platform!\n\nYour verification code is: ${verificationCode}\n\nThis code will expire in ${config.verificationCodeExpireMinutes} minutes.`;

    if (role === 'professional') {
      if (isExpressRegistration) {
        emailSubject = 'Bienvenida a SexAppeal — confirmá tu email';
        emailMessage = `Hola,

Bienvenida a SexAppeal.

Tu código de verificación es: ${verificationCode}
(Este código vence en ${config.verificationCodeExpireMinutes} minutos)

Registraste solo lo esencial. Nuestro equipo te contactará por WhatsApp para completar tu perfil y subir tus fotos — no hace falta que lo hagas sola.

Cuando verifiques tu email podés entrar a tu panel con la contraseña que elegiste.

Saludos,
Equipo SexAppeal`;
      } else {
        emailSubject = 'Bienvenida a SexAppeal — Tu mes de evaluación comienza';
        emailMessage = `Hola,

Bienvenida a SexAppeal, el santuario donde tu presencia se convierte en una Living Treasure.

Tu código de verificación es: ${verificationCode}
(Este código vence en ${config.verificationCodeExpireMinutes} minutos)

✨ TU PRIMER MES, SIN COSTO
Durante los próximos 30 días disfrutás de un período de evaluación completamente gratuito. Es tu oportunidad de conocer la plataforma, recibir contactos reales y descubrir el valor de estar visible en un espacio exclusivo, discreto y sin comisiones por conexión.

📂 CATEGORÍA DURANTE LA EVALUACIÓN
En este primer mes, tu perfil aparecerá en una categoría asignada al azar entre todas las participantes activas. Esto nos permite mostrarte cómo funciona la visibilidad en cada nivel.

Cuando finalice tu mes gratuito y tu primer pago sea validado por nuestro equipo, pasarás automáticamente a la categoría que elegiste al registrarte — y pagarás únicamente la tarifa correspondiente a esa categoría.

🏖️ VACACIONES
Si necesitás ausentarte, podés registrar vacaciones desde tu panel. Durante ese período tu perfil figurará como inactivo y, en tu facturación mensual, se descontarán hasta 15 días de vacaciones del saldo a abonar.

💳 DESPUÉS DEL MES GRATUITO
Al finalizar la evaluación, recibirás el monto mensual según tu categoría elegida. Podrás subir tu comprobante de pago desde el botón "Pago mensual" en tu panel, con instrucciones claras de cómo transferir.

🔒 VERIFICACIÓN
Revisaremos tus documentos con absoluta discreción. El proceso puede demorar al menos 48 horas. Te avisaremos por email cuando tu perfil esté aprobado. Revisá también tu carpeta de Spam.

Gracias por confiar en la Arquitectura de la Intimidad.

— Equipo SexAppeal`;
      }
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
    let { email, code } = req.body;
    if (email) email = email.toLowerCase().trim();

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
    let { email, password } = req.body;
    if (email) email = email.toLowerCase().trim();

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
        code: 'USER_NOT_FOUND',
        error: 'No account found with this email address'
      });
    }

    // Check if password matches
    const isMatch = await user.matchPassword(password);

    if (!isMatch) {
      return res.status(401).json({
        success: false,
        code: 'INVALID_PASSWORD',
        error: 'Incorrect password. Please try again.'
      });
    }

    if (!user.isEmailVerified) {
      return res.status(401).json({
        success: false,
        error: 'Please verify your email before logging in'
      });
    }

    // Log professional login activity
    const clientIp = getClientIp(req);
    if (user.role === 'professional') {
      await ActivityLog.create({
        professional: user._id,
        action: 'login',
        ipAddress: clientIp,
        userAgent: req.headers['user-agent']
      });
    } else if (user.role === 'admin') {
      const recordedIp = await recordAdminLoginIp(user, clientIp);
      await ActivityLog.create({
        professional: user._id,
        action: 'admin_login',
        ipAddress: clientIp,
        userAgent: req.headers['user-agent'],
        isGuest: false,
        details: {
          adminId: user._id,
          adminEmail: user.email,
          adminIpLabel: recordedIp ? HOME_LABEL : undefined,
          recordedIp: recordedIp || undefined
        }
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

    try {
      const clientIp = req.headers['x-forwarded-for'] ? req.headers['x-forwarded-for'].split(',')[0].trim() : (req.socket.remoteAddress || req.ip);
      await ActivityLog.create({
        action: 'guest_login',
        isGuest: true,
        ipAddress: clientIp,
        userAgent: req.headers['user-agent']
      });
    } catch (logErr) {
      console.error('Failed to log guest activity:', logErr.message);
    }

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
    let { email } = req.body;
    if (email) email = email.toLowerCase().trim();
    const user = await User.findOne({ email });

    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'There is no user with that email'
      });
    }

    // Generate a 6-digit recovery code
    const resetCode = Math.floor(100000 + Math.random() * 900000).toString();
    const resetCodeExpire = new Date(Date.now() + config.verificationCodeExpireMinutes * 60 * 1000);

    // We reuse the emailVerificationCode fields to store the reset code 
    // since we know they exist in the User schema.
    user.emailVerificationCode = resetCode;
    user.emailVerificationCodeExpire = resetCodeExpire;
    await user.save({ validateBeforeSave: false });

    try {
      await sendEmail({
        email: user.email,
        subject: 'SexAppeal Platform - Password Reset Code',
        message: `You requested a password reset.\n\nYour reset code is: ${resetCode}\n\nThis code will expire in ${config.verificationCodeExpireMinutes} minutes.`
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
    let { email, code, password } = req.body;
    if (email) email = email.toLowerCase().trim();

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