const Admin = require('../models/Admin');
const {
  checkLoginAllowed,
  recordLoginFailure,
  clearLoginFailures,
} = require('../middleware/securityGuards');

exports.adminLogin = async (req, res, next) => {
  try {
    const email = String(req.body.email || '').trim().toLowerCase();
    const password = String(req.body.password || '');
    const ip =
      req.headers['x-forwarded-for']?.toString().split(',')[0]?.trim() ||
      req.ip ||
      '';

    if (!email || !password) {
      return res.status(400).json({ success: false, message: 'Email and password are required.' });
    }

    const lockKey = `admin:${email}`;
    const lock = checkLoginAllowed(lockKey, ip);
    if (!lock.allowed) {
      return res.status(429).json({ success: false, message: lock.message });
    }

    const admin = await Admin.findOne({ email }).select('+password');

    if (!admin || !(await admin.comparePassword(password))) {
      recordLoginFailure(lockKey, ip);
      return res.status(401).json({ success: false, message: 'Invalid admin credentials.' });
    }

    if (!admin.isActive) {
      return res.status(403).json({ success: false, message: 'Admin account is deactivated.' });
    }

    admin.lastLogin = new Date();
    await admin.save({ validateBeforeSave: false });
    clearLoginFailures(lockKey, ip);

    const token = admin.generateAuthToken();
    res.json({
      success: true,
      message: 'Admin login successful',
      token,
      admin: {
        id: admin._id,
        name: admin.name,
        email: admin.email,
        role: admin.role,
        permissions: admin.permissions,
      },
    });
  } catch (error) {
    next(error);
  }
};

exports.getDashboardStats = async (req, res, next) => {
  try {
    const Product = require('../models/Product');
    const Order = require('../models/Order');
    const User = require('../models/User');

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const [
      totalProducts,
      totalOrders,
      totalCustomers,
      todayOrders,
      revenueData,
      lowStockProducts,
      latestOrders,
      recentCustomers,
    ] = await Promise.all([
      Product.countDocuments({ status: { $ne: 'hidden' } }),
      Order.countDocuments(),
      User.countDocuments({ role: 'customer' }),
      Order.countDocuments({ createdAt: { $gte: today } }),
      Order.aggregate([
        { $match: { paymentStatus: 'paid' } },
        {
          $group: {
            _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
            revenue: { $sum: '$totalAmount' },
            orders: { $sum: 1 },
          },
        },
        { $sort: { _id: -1 } },
        { $limit: 30 },
      ]),
      Product.find({ stock: { $lte: 5 }, status: 'active' }).select('name sku stock').limit(10),
      Order.find().populate('user', 'name email').sort('-createdAt').limit(10),
      User.find({ role: 'customer' }).sort('-createdAt').limit(10).select('name email phone createdAt'),
    ]);

    const totalRevenue = revenueData.reduce((sum, d) => sum + d.revenue, 0);
    const todayRevenue = revenueData.find(d => d._id === today.toISOString().split('T')[0])?.revenue || 0;

    const topProducts = await Order.aggregate([
      { $unwind: '$items' },
      { $group: { _id: '$items.product', totalSold: { $sum: '$items.quantity' }, revenue: { $sum: '$items.totalPrice' } } },
      { $sort: { totalSold: -1 } },
      { $limit: 10 },
      { $lookup: { from: 'products', localField: '_id', foreignField: '_id', as: 'product' } },
      { $unwind: '$product' },
    ]);

    const mostViewed = await Product.find({ status: 'active' }).sort('-viewCount').limit(10).select('name viewCount soldCount');

    res.json({
      success: true,
      stats: {
        totalProducts,
        totalOrders,
        totalCustomers,
        todayOrders,
        totalRevenue,
        todayRevenue,
        revenueChart: revenueData.reverse(),
        lowStockProducts,
        latestOrders,
        recentCustomers,
        topProducts,
        mostViewed,
      },
    });
  } catch (error) {
    next(error);
  }
};

exports.getAnalytics = async (req, res, next) => {
  try {
    const Order = require('../models/Order');
    const User = require('../models/User');
    const { period = '30' } = req.query;

    const startDate = new Date();
    startDate.setDate(startDate.getDate() - parseInt(period));

    const [salesData, customerGrowth, orderStatusBreakdown] = await Promise.all([
      Order.aggregate([
        { $match: { createdAt: { $gte: startDate }, paymentStatus: 'paid' } },
        {
          $group: {
            _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
            revenue: { $sum: '$totalAmount' },
            orders: { $sum: 1 },
          },
        },
        { $sort: { _id: 1 } },
      ]),
      User.aggregate([
        { $match: { role: 'customer', createdAt: { $gte: startDate } } },
        {
          $group: {
            _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
            count: { $sum: 1 },
          },
        },
        { $sort: { _id: 1 } },
      ]),
      Order.aggregate([
        { $match: { createdAt: { $gte: startDate } } },
        { $group: { _id: '$status', count: { $sum: 1 } } },
      ]),
    ]);

    res.json({
      success: true,
      analytics: { salesData, customerGrowth, orderStatusBreakdown },
    });
  } catch (error) {
    next(error);
  }
};
