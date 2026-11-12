const mongoose = require('mongoose');
const Review = require('../models/Review');
const Product = require('../models/Product');
const Order = require('../models/Order');

exports.createReview = async (req, res, next) => {
  try {
    const { productId, rating, title, comment, orderId } = req.body;

    if (!productId || !mongoose.Types.ObjectId.isValid(productId)) {
      return res.status(400).json({ success: false, message: 'Valid product is required' });
    }

    const numericRating = Number(rating);
    if (!numericRating || numericRating < 1 || numericRating > 5) {
      return res.status(400).json({ success: false, message: 'Please select a rating from 1 to 5' });
    }

    if (!comment || !String(comment).trim()) {
      return res.status(400).json({ success: false, message: 'Please write a review comment' });
    }

    const product = await Product.findById(productId);
    if (!product || product.status !== 'active') {
      return res.status(404).json({ success: false, message: 'Product not found' });
    }

    const existing = await Review.findOne({ product: productId, user: req.user.id });
    if (existing) return res.status(400).json({ success: false, message: 'You have already reviewed this product' });

    let isVerifiedPurchase = false;
    if (orderId) {
      const order = await Order.findOne({ _id: orderId, user: req.user.id, 'items.product': productId });
      isVerifiedPurchase = !!order;
    }

    const review = await Review.create({
      product: productId,
      user: req.user.id,
      order: orderId,
      rating: numericRating,
      title: title?.trim() || undefined,
      comment: String(comment).trim(),
      isVerifiedPurchase,
      images: req.body.images || [],
      isApproved: true,
    });

    await updateProductRatings(productId);
    await review.populate('user', 'name avatar');

    res.status(201).json({ success: true, message: 'Review submitted', review });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(400).json({ success: false, message: 'You have already reviewed this product' });
    }
    next(error);
  }
};

exports.getProductReviews = async (req, res, next) => {
  try {
    const { page = 1, limit = 10 } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);

    const [reviews, total] = await Promise.all([
      Review.find({ product: req.params.productId, isApproved: true })
        .populate('user', 'name avatar')
        .sort('-createdAt')
        .skip(skip)
        .limit(parseInt(limit)),
      Review.countDocuments({ product: req.params.productId, isApproved: true }),
    ]);

    res.json({ success: true, reviews, pagination: { page: parseInt(page), total, pages: Math.ceil(total / limit) } });
  } catch (error) {
    next(error);
  }
};

const updateProductRatings = async (productId) => {
  const productObjectId = new mongoose.Types.ObjectId(productId);
  const stats = await Review.aggregate([
    { $match: { product: productObjectId, isApproved: true } },
    { $group: { _id: null, avgRating: { $avg: '$rating' }, count: { $sum: 1 } } },
  ]);

  await Product.findByIdAndUpdate(productId, {
    averageRating: stats[0]?.avgRating ? Math.round(stats[0].avgRating * 10) / 10 : 0,
    totalReviews: stats[0]?.count || 0,
  });
};

exports.getNotifications = async (req, res, next) => {
  try {
    const Notification = require('../models/Notification');
    const notifications = await Notification.find({ user: req.user.id }).sort('-createdAt').limit(50);
    const unreadCount = await Notification.countDocuments({ user: req.user.id, isRead: false });
    res.json({ success: true, notifications, unreadCount });
  } catch (error) {
    next(error);
  }
};

exports.markNotificationRead = async (req, res, next) => {
  try {
    const Notification = require('../models/Notification');
    await Notification.findByIdAndUpdate(req.params.id, { isRead: true });
    res.json({ success: true, message: 'Notification marked as read' });
  } catch (error) {
    next(error);
  }
};
