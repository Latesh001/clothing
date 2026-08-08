const express = require('express');
const { body } = require('express-validator');
const authController = require('../controllers/authController');
const productController = require('../controllers/productController');
const cartController = require('../controllers/cartController');
const wishlistController = require('../controllers/wishlistController');
const orderController = require('../controllers/orderController');
const reviewController = require('../controllers/reviewController');
const adminController = require('../controllers/adminController');
const contactController = require('../controllers/contactController');
const { protect, optionalAuth, adminProtect } = require('../middleware/auth');
const { validate } = require('../middleware/validate');
const { upload } = require('../middleware/upload');
const upiPaymentLimiter = require('../middleware/upiPaymentLimiter');
const { authLimiter } = require('../middleware/authLimiter');

const router = express.Router();

// Auth routes (dedicated limiter — safe for many concurrent customers)
router.post('/auth/register', authLimiter, [
  body('name').trim().notEmpty().withMessage('Name is required'),
  body('email').isEmail().withMessage('Valid email required'),
  body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
], validate, authController.register);

router.post('/auth/login', authLimiter, [
  body('email').isEmail().withMessage('Valid email is required'),
  body('phone').trim().notEmpty().withMessage('Phone number is required'),
  body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
], validate, authController.login);

router.post('/auth/send-otp', authLimiter, authController.sendOTP);
router.post('/auth/verify-otp', authLimiter, authController.verifyOTP);
router.post('/auth/google', authLimiter, authController.googleLogin);
router.post('/auth/logout', protect, authController.logout);
router.get('/auth/profile', protect, authController.getProfile);
router.put('/auth/profile', protect, authController.updateProfile);
router.post('/auth/addresses', protect, authController.addAddress);
router.put('/auth/addresses/:addressId', protect, authController.updateAddress);
router.delete('/auth/addresses/:addressId', protect, authController.deleteAddress);

// Admin auth
router.post('/admin/login', authLimiter, [
  body('email').isEmail(),
  body('password').notEmpty(),
], validate, adminController.adminLogin);
router.get('/admin/dashboard', adminProtect, adminController.getDashboardStats);
router.get('/admin/analytics', adminProtect, adminController.getAnalytics);

// Products (public)
router.get('/products', productController.getProducts);
router.get('/products/search', productController.searchProducts);
router.get('/products/home', productController.getHomeData);
router.get('/products/:slug', optionalAuth, productController.getProduct);
router.get('/categories', productController.getCategories);

// Contact & newsletter
router.post('/contact', contactController.submitContact);
router.post('/newsletter/subscribe', contactController.subscribeNewsletter);

// Products (admin)
router.get('/admin/products', adminProtect, productController.getAdminProducts);
router.post('/admin/products', adminProtect, upload.fields([{ name: 'images', maxCount: 10 }, { name: 'videos', maxCount: 3 }]), productController.createProduct);
router.put('/admin/products/:id', adminProtect, upload.fields([{ name: 'images', maxCount: 10 }, { name: 'videos', maxCount: 3 }]), productController.updateProduct);
router.delete('/admin/products/:id', adminProtect, productController.deleteProduct);
router.patch('/admin/products/:id/status', adminProtect, productController.toggleProductStatus);
router.post('/admin/categories', adminProtect, productController.createCategory);
router.post('/admin/subcategories', adminProtect, productController.createSubcategory);

// Cart
router.get('/cart', protect, cartController.getCart);
router.post('/cart', protect, cartController.addToCart);
router.put('/cart/:itemId', protect, cartController.updateCartItem);
router.delete('/cart/:itemId', protect, cartController.removeFromCart);
router.post('/cart/:itemId/save-later', protect, cartController.saveForLater);
router.post('/cart/apply-coupon', protect, cartController.applyCoupon);
router.delete('/cart', protect, cartController.clearCart);

// Wishlist
router.get('/wishlist', protect, wishlistController.getWishlist);
router.post('/wishlist', protect, wishlistController.addToWishlist);
router.post('/wishlist/toggle', protect, wishlistController.toggleWishlist);
router.delete('/wishlist/:productId', protect, wishlistController.removeFromWishlist);

// Orders
router.post('/orders', protect, orderController.createOrder);
router.post('/orders/confirm-upi', protect, upiPaymentLimiter, orderController.confirmUpiPayment);
router.get('/orders', protect, orderController.getOrders);
router.get('/orders/track/:orderNumber', orderController.trackOrder);
router.get('/orders/:id/upi-qr', protect, orderController.getUpiQr);
router.get('/orders/:id', protect, orderController.getOrder);
router.put('/orders/:id/cancel', protect, orderController.cancelOrder);

// Admin orders
router.get('/admin/orders', adminProtect, orderController.getAdminOrders);
router.put('/admin/orders/:id/status', adminProtect, orderController.updateOrderStatus);
router.put('/admin/orders/:id/verify-upi', adminProtect, orderController.verifyUpiPayment);

// Reviews & Notifications
router.post('/reviews', protect, reviewController.createReview);
router.get('/reviews/:productId', reviewController.getProductReviews);
router.get('/notifications', protect, reviewController.getNotifications);
router.put('/notifications/:id/read', protect, reviewController.markNotificationRead);

module.exports = router;
