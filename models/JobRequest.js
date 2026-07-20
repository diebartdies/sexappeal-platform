const mongoose = require('mongoose');

const JobRequestSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  phone: { type: String, required: true, trim: true },
  email: { type: String, trim: true },
  description: { type: String, required: true, trim: true },
  category: { type: String },
  location: {
    province: String,
    city: String,
    neighborhood: String,
    street: String
  },
  photos: [String],
  contactMethods: {
    whatsapp: { type: Boolean, default: false },
    telegram: { type: Boolean, default: false }
  },
  status: {
    type: String,
    enum: ['pending', 'matched', 'in_progress', 'completed', 'cancelled'],
    default: 'pending'
  },
  assignedProfessional: {
    type: mongoose.Schema.ObjectId,
    ref: 'User'
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('JobRequest', JobRequestSchema);
