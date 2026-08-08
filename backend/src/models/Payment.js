const mongoose = require('mongoose');

const paymentSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  order: { type: mongoose.Schema.Types.ObjectId, ref: 'Order', required: true },
  upiTransactionId: { type: String, uppercase: true, trim: true },
  upiTransactionHash: { type: String },
  amount: { type: Number, required: true },
  currency: { type: String, default: 'INR' },
  method: { type: String, enum: ['upi_qr', 'cod'], required: true },
  status: {
    type: String,
    enum: ['created', 'awaiting_verification', 'paid', 'failed', 'refunded'],
    default: 'created',
  },
  refundAmount: Number,
  refundReason: String,
  security: {
    paymentToken: String,
    submittedIp: String,
    submittedUserAgent: String,
    attemptCount: { type: Number, default: 0 },
    lastAttemptAt: Date,
  },
  metadata: mongoose.Schema.Types.Mixed,
}, { timestamps: true });

paymentSchema.index({ upiTransactionId: 1 }, { unique: true, sparse: true, partialFilterExpression: { upiTransactionId: { $type: 'string' } } });
paymentSchema.index({ upiTransactionHash: 1 }, { unique: true, sparse: true, partialFilterExpression: { upiTransactionHash: { $type: 'string' } } });
paymentSchema.index({ order: 1 });

module.exports = mongoose.model('Payment', paymentSchema);
