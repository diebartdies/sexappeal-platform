const path = require('path');
require('dotenv').config();

const config = {
  // Environment
  env: process.env.NODE_ENV || 'development',
  port: process.env.PORT || 5000,

  // App Paths
  root: path.resolve(__dirname, '..'),
  modelsDir: path.resolve(__dirname, '..', 'models'),
  controllersDir: path.resolve(__dirname, '..', 'controllers'),
  middlewareDir: path.resolve(__dirname, '..', 'middleware'),
  uploadsDir: process.env.UPLOAD_PATH || path.resolve(__dirname, '..', 'uploads'),

  // Database
  mongoUri: process.env.MONGO_URI,

  // Security
  jwtSecret: process.env.JWT_SECRET,
  jwtExpire: process.env.JWT_EXPIRE,
  jwtCookieExpire: process.env.JWT_COOKIE_EXPIRE,
  
  // Platform Globals
  maxBioLength: 500,
  maxAliasLength: 50,
  minPasswordLength: 6,
  rateLimitWindow: 10 * 60 * 1000, // 10 minutes
  rateLimitMax: 100,

  // Enums
  roles: ['user', 'professional', 'admin'],
  verificationStatuses: ['pending', 'approved', 'rejected'],
  services: [
    'Massage',
    'Virtual Connection',
    'love alchemy',
    'Fantasies'
  ],
  experience: {
    statusHidden: 'Living Treasure - Veiled',
    statusRevealed: 'Living Treasure - Revealed',
    discoveryText: 'A new living treasure has been revealed.',
  },
  respectAgreement: {
    adminEmail: 'admin@drsrv.net.ar',
    inappropriateTerms: ['offensive1', 'offensive2', 'spam', 'scam', 'abuse', 'illegal', 'escort', 'prostitution', 'drugs'],
    violationMessage: 'Feedback must adhere to our Respect Agreement. Inappropriate terms have been flagged and reported.',
  },
  // Payment & Subscription Rules
  payment: {
    adminEmail: 'admin@drsrv.net.ar',
    dueDayOfMonth: 5, // Account suspension happens on the 6th if unpaid
    bankTransfer: {
      cbu: '0170316840000040617332',
      alias: 'drcarlo'
    },
    mercadoPago: {
      cvu: '0000003100079017216982',
      alias: 'drcar.lo'
    }
  },

  platform: {
    publicUrl: process.env.PLATFORM_URL || 'https://sexappeal.drsrv.net.ar',
    registerUrl: process.env.PLATFORM_REGISTER_URL || 'https://sexappeal.drsrv.net.ar/register.html'
  }
};

module.exports = config;
