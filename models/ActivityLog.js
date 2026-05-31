const mongoose = require('mongoose');

const ActivityLogSchema = new mongoose.Schema({
  professional: {
    type: mongoose.Schema.ObjectId,
    ref: 'User',
    required: false
  },
  isGuest: {
    type: Boolean,
    default: false
  },
  action: {
    type: String,
    required: true
  },
  details: {
    type: mongoose.Schema.Types.Mixed
  },
  ipAddress: {
    type: String
  },
  userAgent: {
    type: String
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('ActivityLog', ActivityLogSchema);