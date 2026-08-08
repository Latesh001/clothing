const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const adminSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true,
  },
  password: { type: String, required: true, minlength: 6, select: false },
  role: { type: String, enum: ['superadmin', 'admin', 'manager'], default: 'admin' },
  permissions: [{
    type: String,
    enum: ['products', 'orders', 'customers', 'analytics', 'coupons', 'settings'],
  }],
  avatar: String,
  isActive: { type: Boolean, default: true },
  lastLogin: Date,
}, { timestamps: true });

adminSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next();
  this.password = await bcrypt.hash(this.password, 12);
  next();
});

adminSchema.methods.comparePassword = async function (candidatePassword) {
  return bcrypt.compare(candidatePassword, this.password);
};

adminSchema.methods.generateAuthToken = function () {
  return jwt.sign(
    { id: this._id, role: 'admin', adminRole: this.role },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRE || '7d' }
  );
};

module.exports = mongoose.model('Admin', adminSchema);
