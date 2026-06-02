const express = require('express');
const dotenv = require('dotenv');
const helmet = require('helmet');
const cors = require('cors');
const rateLimit = require('express-rate-limit');
const cookieParser = require('cookie-parser');
const config = require('./config/appConfig');
const multer = require('multer');
const fs = require('fs');
const connectDB = require('./config/database');
const User = require('./models/User');
const ActivityLog = require('./models/ActivityLog');
const sendEmail = require('./sendEmail');

// Connect to database
connectDB();

const app = express();

// Trust proxy for Nginx
app.set('trust proxy', 1);

// Body parser
app.use(express.json());

// Cookie parser
app.use(cookieParser());

// Set security headers
app.use(helmet({
  // Disable CSP for the prototype so external Unsplash images 
  // and inline frontend scripts/styles are allowed to load
  contentSecurityPolicy: false 
}));

// Enable CORS
app.use(cors({
  origin: [
    'http://localhost:5000',
    'http://127.0.0.1:5000',
    'http://192.168.1.8:5000' // Allow access from local network IP for testing
  ],
  credentials: true
}));

// Rate limiting
const limiter = rateLimit({
  windowMs: config.rateLimitWindow,
  max: config.rateLimitMax
});
app.use('/api', limiter);

// Set static folder
const path = require('path');
app.use(express.static(path.join(__dirname, 'public'), {
  setHeaders: (res, path) => {
    res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, private');
  }
}));

// --- Multer File Upload Configuration ---
const uploadsDir = path.join(__dirname, 'public/uploads/photos');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, uploadsDir);
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({ storage: storage });


// --- Global Guest Activity Tracker ---
// This logs every search and profile view made by non-logged-in users so you can data-mine their preferences
app.use((req, res, next) => {
  // Only track GET requests to the API (searches, profile views, locations)
  if (req.path.startsWith('/api/v1/') && req.method === 'GET') {
    // If there is no authorization header and no token cookie, it's a guest
    if (!req.headers.authorization && !req.cookies.token) {
      const clientIp = req.headers['x-forwarded-for'] ? req.headers['x-forwarded-for'].split(',')[0].trim() : (req.socket.remoteAddress || req.ip);
      
      // We don't use 'await' here so it doesn't slow down the user's request
      ActivityLog.create({
        action: 'guest_browsing',
        isGuest: true,
        details: { path: req.path, query: req.query },
        ipAddress: clientIp,
        userAgent: req.headers['user-agent']
      }).catch(err => console.error('Failed to log guest activity:', err.message));
    }
  }
  next();
});

// Mount routers
const authController = require('./controllers/authController');
const adminController = require('./controllers/adminController');
const professionalController = require('./controllers/professionalController');
const feedbackController = require('./controllers/feedbackController');
const locationController = require('./controllers/locationController');
const transactionController = require('./controllers/transactionController');
const potentialProfessionalController = require('./controllers/potentialProfessionalController');
const paymentController = require('./controllers/paymentController');
const { protect, authorize } = require('./middleware/auth');

app.post('/api/v1/auth/register', upload.array('verificationDocuments', 3), authController.register);
app.post('/api/v1/auth/verify-email', authController.verifyEmail);
app.post('/api/v1/auth/login', authController.login);
app.post('/api/v1/auth/guest-login', authController.guestLogin);
app.post('/api/v1/auth/forgotpassword', authController.forgotPassword);
app.put('/api/v1/auth/resetpassword', authController.resetPassword);
app.post('/api/v1/auth/google', authController.googleAuth);

// Feedback Route (Enforcing Respect Agreement)
app.post('/api/v1/feedback', protect, feedbackController.submitFeedback);

// Location Routes (Public)
app.get('/api/v1/locations/provinces', locationController.getProvinces);
app.get('/api/v1/locations/provinces/:provinceId/sublocations', locationController.getSublocations);

// Professional Public Routes
app.get('/api/v1/professionals', professionalController.getProfessionals);
app.get('/api/v1/professionals/specialties', professionalController.getSpecialties);
app.get('/api/v1/professionals/:alias', professionalController.getProfessionalByAlias);
app.get('/api/v1/professionals/:alias/whatsapp', professionalController.contactWhatsApp);

// Review Routes
const reviewsController = require('./controllers/reviewsController');
app.get('/api/v1/professionals/:professionalId/reviews', reviewsController.getReviews);
app.post('/api/v1/professionals/:professionalId/reviews', protect, reviewsController.addReview);


// Professional Dashboard Routes (Private)
app.get('/api/v1/professionals/me', protect, authorize('professional', 'admin'), professionalController.getMe);
app.put('/api/v1/professionals/updateprofile', protect, authorize('professional'), upload.array('photos', 10), professionalController.updateProfile);
app.put('/api/v1/professionals/acknowledge-rate', protect, authorize('professional'), professionalController.acknowledgeRateChange);
app.post('/api/v1/professionals/upload-receipt', protect, authorize('professional'), upload.single('receipt'), paymentController.uploadReceipt);

// Admin routes
app.get('/api/v1/admin/verifications/pending', protect, authorize('admin'), adminController.getPendingVerifications);
app.put('/api/v1/admin/verifications/:id', protect, authorize('admin'), adminController.verifyProfessional);
app.post('/api/v1/admin/notify-rate-change', protect, authorize('admin'), professionalController.notifyRateChange);
app.get('/api/v1/admin/logs', protect, authorize('admin'), adminController.getActivityLogs);
app.put('/api/v1/admin/professionals/:id', protect, authorize('admin'), adminController.updateProfessionalProfile);
app.get('/api/v1/admin/professionals', protect, authorize('admin'), adminController.getAllProfessionals);
app.get('/api/v1/admin/potential-professionals', protect, authorize('admin'), potentialProfessionalController.getPotentialProfessionals);
app.put('/api/v1/admin/potential-professionals/:id', protect, authorize('admin'), potentialProfessionalController.updatePotentialProfessional);
app.post('/api/v1/admin/notifications/mail/broadcast', protect, authorize('admin'), adminController.sendBroadcastEmail);

if (process.env.NODE_ENV !== 'production') {
  const testingController = require('./controllers/testingController');
  app.post('/api/v1/testing/verify-user', testingController.forceVerifyUser);
}

// SEO-Friendly Profile URLs (e.g., /perfil/AliasDeLaChica)
app.get('/perfil/:alias', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'treasure.html'));
});

app.get('/', (req, res) => {
  res.redirect('/index.html');
});

const PORT = config.port;

const server = app.listen(PORT, () => {
  console.log(`\nServer running in ${config.env} mode on port ${PORT}`);
  console.log(`Access the application at http://localhost:${PORT}\n`);
});

// Handle unhandled promise rejections
process.on('unhandledRejection', (err, promise) => {
  console.log(`Error: ${err.message}`);
  // Close server & exit process
  server.close(() => process.exit(1));
});

// Background Task: Clean up expired guest accounts every hour
setInterval(async () => {
  try {
    const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
    const result = await User.deleteMany({
      isAnonymous: true,
      createdAt: { $lt: twentyFourHoursAgo }
    });
    if (result.deletedCount > 0) {
      console.log(`[Cleanup] Purged ${result.deletedCount} expired guest sessions.`);
    }
  } catch (err) {
    console.error('[Cleanup Error]', err.message);
  }
}, 60 * 60 * 1000);

// Background Task: Send Trial Expiration Reminders (Runs every 24 hours)
setInterval(async () => {
  try {
    // Find professionals whose trial ends between 3 and 4 days from now
    const threeDaysFromNow = new Date(Date.now() + 3 * 24 * 60 * 60 * 1000);
    const fourDaysFromNow = new Date(Date.now() + 4 * 24 * 60 * 60 * 1000);
    
    const expiringUsers = await User.find({
      role: 'professional',
      trialEndsAt: { $gte: threeDaysFromNow, $lt: fourDaysFromNow }
    });

    for (const user of expiringUsers) {
      await sendEmail({
        email: user.email,
        subject: 'SexAppeal Platform - Your Free Trial is Expiring Soon',
        message: `Hello ${user.professionalProfile?.alias || 'Professional'},\n\nWe hope you are enjoying your welcome period on the SexAppeal Platform!\n\nThis is a reminder that your 2-month free trial will expire in 3 days. To maintain your "Revealed" status and keep your profile visible to clients, please ensure your subscription payment is completed.\n\nThank you for being a Living Treasure!`
      });
      console.log(`[Reminder] Sent trial expiration email to ${user.email}`);
    }
  } catch (err) {
    console.error('[Trial Reminder Error]', err.message);
  }
}, 24 * 60 * 60 * 1000);

// Background Task: Send Monthly Payment Reminders (Runs every 24 hours)
setInterval(async () => {
  try {
    const today = new Date();
    // Run this logic only on the 1st of the month
    if (today.getDate() === 1) {
      const activeUsers = await User.find({
        role: 'professional',
        'professionalProfile.subscriptionStatus': 'active'
      });

      for (const user of activeUsers) {
        await sendEmail({
          email: user.email,
          subject: 'SexAppeal Platform - Monthly Subscription Fee Reminder',
          message: `Hello ${user.professionalProfile?.alias || 'Professional'},\n\nThis is a friendly reminder that your monthly subscription fee for the SexAppeal Platform is due between the 1st and 5th of this month.\n\nPlease transfer the fee via MercadoPago (CVU: ${config.payment.mercadoPago.cvu}, Alias: ${config.payment.mercadoPago.alias}) or Bank Transfer (CBU: ${config.payment.bankTransfer.cbu}, Alias: ${config.payment.bankTransfer.alias}).\n\nAfter transferring, please log in to your Dashboard and upload the payment receipt to keep your account active.\n\nThank you for being part of our platform!`
        });
        console.log(`[Payment Reminder] Sent monthly payment reminder email to ${user.email}`);
      }
    }
  } catch (err) {
    console.error('[Payment Reminder Error]', err.message);
  }
}, 24 * 60 * 60 * 1000);

// Background Task: Enforce Yearly Photo Upgrades (Runs every 24 hours)
setInterval(async () => {
  try {
    const oneYearAgo = new Date(Date.now() - 365 * 24 * 60 * 60 * 1000);
    const inactiveUsers = await User.find({
      role: 'professional',
      'professionalProfile.lastPhotoUpdate': { $lt: oneYearAgo },
      verificationStatus: 'approved'
    });

    for (const user of inactiveUsers) {
      user.verificationStatus = 'pending';
      user.isVerified = false;
      await user.save();
      await sendEmail({
        email: user.email,
        subject: 'SexAppeal Platform - Yearly Photo Update Required',
        message: `Hello ${user.professionalProfile?.alias || 'Professional'},\n\nIt has been over a year since you updated your photos on the platform. To maintain our standard of quality and ensure profiles are accurate, we require all professionals to update their pictures annually.\n\nYour profile has been temporarily hidden. Please log in to your dashboard and upload new photos to reactivate your profile.\n\nThank you for understanding!`
      });
      console.log(`[Yearly Photo Update] Suspended ${user.email} due to outdated photos.`);
    }
  } catch (err) {
    console.error('[Yearly Photo Update Error]', err.message);
  }
}, 24 * 60 * 60 * 1000);
