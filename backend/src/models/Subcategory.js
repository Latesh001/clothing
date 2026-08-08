const mongoose = require('mongoose');

const subcategorySchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  slug: { type: String, required: true, lowercase: true },
  category: { type: mongoose.Schema.Types.ObjectId, ref: 'Category', required: true },
  description: String,
  image: String,
  isActive: { type: Boolean, default: true },
  sortOrder: { type: Number, default: 0 },
}, { timestamps: true });

subcategorySchema.index({ category: 1, slug: 1 }, { unique: true });

module.exports = mongoose.model('Subcategory', subcategorySchema);
