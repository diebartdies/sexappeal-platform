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
    // `status` is the WhatsApp lead lifecycle field (the channel's "status field").
    // 'contacted' = a WhatsApp message was sent; 'rejected' = unregistered/invalid
    // number; 'failed' = a (transient) WhatsApp send error (kept distinct from
    // 'rejected' so failed leads can be retried). 'pending'/missing/null = not yet
    // contacted (what the drip scheduler selects).
    enum: ['pending', 'contacted', 'joined', 'rejected', 'failed'],
    default: 'pending'
  },
  // WhatsApp send-outcome tracking. Mirrors the SMS fields below but on the
  // WhatsApp channel: when the drip scheduler sends (or fails), it records the
  // timestamp, the whatsapp-web.js message id, and any error string. These are
  // additive/optional and never gate selection (the `status` field does that).
  whatsappSentAt: {
    type: Date
  },
  whatsappError: {
    type: String,
    trim: true
  },
  whatsappMessageId: {
    type: String,
    trim: true
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
  doNotContact: {
    type: Boolean,
    default: false
  },
  doNotContactReason: {
    type: String,
    trim: true
  },
  doNotContactAt: {
    type: Date
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('PotentialProfessional', PotentialProfessionalSchema, 'potential_professionals');