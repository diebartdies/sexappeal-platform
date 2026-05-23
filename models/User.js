const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const config = require('../config/appConfig');

const UserSchema = new mongoose.Schema({
  name: {
    type: String
  },
  email: {
    type: String,
    required: [true, 'Please add an email'],
    unique: true,
    match: [
      /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/,
      'Please add a valid email'
    ]
  },
  password: {
    type: String,
    required: [true, 'Please add a password'],
    minlength: 6,
    select: false // Do not return the password by default in queries
  },
  role: {
    type: String,
    enum: ['user', 'professional', 'admin'],
    default: 'user'
  },
  isEmailVerified: {
    type: Boolean,
    default: false
  },
  emailVerificationCode: String,
  emailVerificationCodeExpire: Date,
  isVerified: {
    type: Boolean,
    default: false
  },
  verificationStatus: {
    type: String,
    enum: ['pending', 'approved', 'rejected'],
    default: 'pending'
  },
  verificationGesture: {
    type: String,
    enum: ['1 finger', '2 fingers', '3 fingers', 'thumbs up']
  },
  isAnonymous: {
    type: Boolean,
    default: false
  },
  professionalProfile: {
    alias: {
      type: String,
      trim: true,
      maxlength: [50, 'Alias cannot be more than 50 characters']
    },
    quality: {
      type: String,
      enum: ['Standard', 'Silver', 'Gold', 'Premium'],
      default: 'Standard'
    },
    bio: {
      type: String,
      maxlength: [500, 'Bio cannot be more than 500 characters']
    },
    hasOwnApartment: {
      type: Boolean,
      default: false
    },
    hasFantasyWardrobe: {
      type: Boolean,
      default: false
    },
    services: [{
      type: String,
      index: true,
      enum: {
        values: config.services,
        message: '{VALUE} is not a valid specialty. Please choose from the official list.'
      }
    }],
    whatsappNumber: String,
    photos: [String],
    location: {
      province: String,
      city: String,
      neighborhood: String
    },
    pricing: mongoose.Schema.Types.Mixed,
    measurements: String,
    height: String,
    eyeColor: String,
    hasTattoos: Boolean,
    isDuo: {
      type: Boolean,
      default: false
    },
    duoPartner: {
      type: mongoose.Schema.ObjectId,
      ref: 'User'
    },
    rateChangeAcknowledged: {
      type: Boolean,
      default: true // Default to true, will be set to false on rate changes
    },
    subscriptionStatus: {
      type: String,
      enum: ['trial', 'active', 'suspended'],
      default: 'trial' // Starts on the 2-month grace period
    },
    trialEndDate: {
      type: Date,
      // Sets the trial end date to 60 days from account creation
      default: () => new Date(Date.now() + 60 * 24 * 60 * 60 * 1000)
    },
    paymentHistory: [{
      date: { type: Date, default: Date.now },
      amount: Number,
      method: { 
        type: String, 
        enum: ['MercadoPago', 'Bank Transfer'] 
      },
      receiptUrl: String, // URL/Path to the uploaded comprobante de pago
      status: { 
        type: String, 
        enum: ['pending', 'verified', 'rejected'], 
        default: 'pending' 
      },
      billingMonth: String // Format: YYYY-MM (e.g., '2026-05')
    }
  },
  resetPasswordToken: String,
  resetPasswordExpire: Date,
  createdAt: {
    type: Date,
    default: Date.now
  }
});

// Encrypt password using bcrypt before saving
UserSchema.pre('save', async function() {
  if (!this.isModified('password')) {
    return;
  }
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
});

// Match user entered password to hashed password in database
UserSchema.methods.matchPassword = async function(enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

// Sign JWT and return
UserSchema.methods.getSignedJwtToken = function() {
  return jwt.sign({ id: this._id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRE
  });
};

// Generate and hash password reset token
UserSchema.methods.getResetPasswordToken = function() {
  // Generate code (6 digits for consistency with email verification)
  const resetToken = Math.floor(100000 + Math.random() * 900000).toString();

  // Set resetPasswordToken field
  this.resetPasswordToken = resetToken;

  // Set expire (10 minutes)
  this.resetPasswordExpire = Date.now() + 10 * 60 * 1000;

  return resetToken;
};

module.exports = mongoose.model('User', UserSchema);