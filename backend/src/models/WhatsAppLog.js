const mongoose = require('mongoose');

const whatsappLogSchema = new mongoose.Schema({
  to: { type: String, required: true },
  message: { type: String, required: true },
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  type: { type: String, enum: ['cart_update', 'order_confirmation', 'otp', 'promotional'], default: 'cart_update' },
  status: { type: String, enum: ['sent', 'failed', 'pending'], default: 'pending' },
  twilioSid: String,
  error: String,
  metadata: mongoose.Schema.Types.Mixed,
}, { timestamps: true });

module.exports = mongoose.model('WhatsAppLog', whatsappLogSchema);
