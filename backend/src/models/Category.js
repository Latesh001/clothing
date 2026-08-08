const mongoose = require('mongoose');

const categorySchema = new mongoose.Schema({
  name: { type: String, required: true, unique: true, trim: true },
  slug: { type: String, required: true, unique: true, lowercase: true },
  description: String,
  image: String,
  icon: String,
  isActive: { type: Boolean, default: true },
  sortOrder: { type: Number, default: 0 },
  seoTitle: String,
  seoDescription: String,
  seoKeywords: [String],
}, { timestamps: true });

module.exports = mongoose.model('Category', categorySchema);
