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
  createdAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('PotentialProfessional', PotentialProfessionalSchema, 'potential_professionals');