const mongoose = require('mongoose');

const reviewSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  rating: { type: Number, required: true, min: 1, max: 5 },
  title: String,
  comment: { type: String, required: true },
  images: [String],
  video: String,
  isVerifiedPurchase: { type: Boolean, default: false },
  helpful: { type: Number, default: 0 },
  isApproved: { type: Boolean, default: true },
}, { timestamps: true });

const productSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  slug: { type: String, required: true, unique: true, lowercase: true },
  description: { type: String, required: true },
  shortDescription: String,
  category: { type: mongoose.Schema.Types.ObjectId, ref: 'Category', required: true },
  subcategory: { type: mongoose.Schema.Types.ObjectId, ref: 'Subcategory' },
  images: [{ url: String, publicId: String, alt: String }],
  videos: [{ url: String, publicId: String, thumbnail: String }],
  image360: String,
  fabric: String,
  material: String,
  borderType: String,
  palluType: String,
  sizes: [{ type: String }],
  colors: [{
    name: String,
    hex: String,
    images: [String],
  }],
  stock: { type: Number, required: true, default: 0, min: 0 },
  mrp: { type: Number, required: true, min: 0 },
  discount: { type: Number, default: 0, min: 0, max: 100 },
  offerPrice: { type: Number, required: true, min: 0 },
  sku: { type: String, required: true, unique: true, uppercase: true },
  tags: [String],
  weight: { type: Number, default: 0 },
  shippingCharges: { type: Number, default: 0 },
  estimatedDelivery: { type: String, default: '5-7 business days' },
  status: { type: String, enum: ['active', 'inactive', 'hidden', 'out_of_stock'], default: 'active' },
  isFeatured: { type: Boolean, default: false },
  isNewArrival: { type: Boolean, default: false },
  isBestSeller: { type: Boolean, default: false },
  isTrending: { type: Boolean, default: false },
  specifications: [{
    label: String,
    value: String,
  }],
  reviews: [reviewSchema],
  averageRating: { type: Number, default: 0, min: 0, max: 5 },
  totalReviews: { type: Number, default: 0 },
  viewCount: { type: Number, default: 0 },
  soldCount: { type: Number, default: 0 },
  seoTitle: String,
  seoDescription: String,
  seoKeywords: [String],
}, { timestamps: true });

productSchema.index({ name: 'text', description: 'text', tags: 'text' });
productSchema.index({ category: 1, status: 1 });
productSchema.index({ offerPrice: 1 });
productSchema.index({ isFeatured: 1, isTrending: 1, isBestSeller: 1, isNewArrival: 1 });

productSchema.pre('save', function (next) {
  if (this.mrp && this.discount >= 0) {
    this.offerPrice = Math.round(this.mrp - (this.mrp * this.discount / 100));
  }
  next();
});

module.exports = mongoose.model('Product', productSchema);
