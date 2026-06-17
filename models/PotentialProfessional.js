const mongoose = require('mongoose');

const PotentialProfessionalSchema = new mongoose.Schema({
  phone: {
    type: String,
    required: true,
    unique: true,
    trim: true
  },
  alias: {
    type: String,
    trim: true
  },
  sourceUrl: {
    type: String,
    trim: true
  },
  status: {
    type: String,
    enum: ['pending', 'contacted', 'joined', 'rejected'],
    default: 'pending'
  },
  // SMS outreach tracking, kept independent from the WhatsApp `status` above so
  // the two channels never clobber each other. Bulk SMS targets smsStatus 'pending'.
  smsStatus: {
    type: String,
    enum: ['pending', 'sent', 'failed'],
    default: 'pending'
  },
  smsSentAt: {
    type: Date
  },
  smsError: {
    type: String,
    trim: true
  },
  smsSid: {
    type: String,
    trim: true
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('PotentialProfessional', PotentialProfessionalSchema, 'potential_professionals');