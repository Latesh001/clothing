const mongoose = require('mongoose');

const orderItemSchema = new mongoose.Schema({
  product: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true },
  name: String,
  image: String,
  sku: String,
  quantity: { type: Number, required: true, min: 1 },
  size: String,
  color: String,
  mrp: Number,
  offerPrice: Number,
  totalPrice: Number,
});

const trackingSchema = new mongoose.Schema({
  status: {
    type: String,
    enum: ['pending', 'confirmed', 'processing', 'shipped', 'out_for_delivery', 'delivered', 'cancelled', 'returned'],
    default: 'pending',
  },
  message: String,
  location: String,
  timestamp: { type: Date, default: Date.now },
});

const orderSchema = new mongoose.Schema({
  orderNumber: { type: String, required: true, unique: true },
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  items: [orderItemSchema],
  shippingAddress: {
    fullName: String,
    phone: String,
    addressLine1: String,
    addressLine2: String,
    city: String,
    state: String,
    pincode: String,
    country: { type: String, default: 'India' },
  },
  paymentMethod: {
    type: String,
    enum: ['upi_qr', 'cod'],
    required: true,
  },
  paymentStatus: {
    type: String,
    enum: ['pending', 'awaiting_verification', 'paid', 'failed', 'refunded'],
    default: 'pending',
  },
  paymentId: String,
  upiTransactionId: { type: String, uppercase: true, trim: true },
  upiTransactionHash: { type: String },
  paymentSecurity: {
    paymentToken: String,
    utrAttempts: { type: Number, default: 0 },
    lastUtrAttemptAt: Date,
    lockedUntil: Date,
    submittedIp: String,
    submittedUserAgent: String,
    submittedAt: Date,
    verifiedAt: Date,
    verifiedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'Admin' },
  },
  upiQrPayload: {
    upiId: String,
    payeeName: String,
    amount: String,
    upiString: String,
    qrImage: String,
    expiresAt: Date,
    paymentToken: String,
  },
  subtotal: { type: Number, required: true },
  shippingCharges: { type: Number, default: 0, min: 0 },
  discount: { type: Number, default: 0 },
  couponCode: String,
  totalAmount: { type: Number, required: true },
  status: {
    type: String,
    enum: ['pending', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled', 'returned'],
    default: 'pending',
  },
  tracking: [trackingSchema],
  estimatedDelivery: String,
  invoiceUrl: String,
  notes: String,
  cancelledAt: Date,
  cancelReason: String,
  deliveredAt: Date,
}, { timestamps: true });

orderSchema.index({ user: 1, createdAt: -1 });
orderSchema.index({ orderNumber: 1 });
orderSchema.index({ status: 1, createdAt: -1 });
orderSchema.index({ upiTransactionId: 1 }, { unique: true, sparse: true });
orderSchema.index({ upiTransactionHash: 1 }, { unique: true, sparse: true });

module.exports = mongoose.model('Order', orderSchema);
