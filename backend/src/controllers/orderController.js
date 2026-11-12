const Order = require('../models/Order');
const Cart = require('../models/Cart');
const Product = require('../models/Product');
const Payment = require('../models/Payment');
const Coupon = require('../models/Coupon');
const Notification = require('../models/Notification');
const { generateUpiQr } = require('../services/upiQrService');
const {
  validateUtr,
  hashUtr,
  createPaymentToken,
  verifyPaymentToken,
  MAX_UTR_ATTEMPTS,
} = require('../services/upiPaymentSecurity');
const { sendOrderConfirmationEmail, sendOrderStatusEmail } = require('../services/emailService');
const {
  sendOrderConfirmationWhatsApp,
  sendAdminOrderAlert,
} = require('../services/whatsappService');
const { canTransitionOrderStatus } = require('../middleware/securityGuards');
const User = require('../models/User');

const generateOrderNumber = () => {
  const timestamp = Date.now().toString().slice(-8);
  const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
  return `MKH${timestamp}${random}`;
};

/** Free shipping on all orders */
const calcShipping = () => 0;

const getClientMeta = (req) => ({
  ip: req.headers['x-forwarded-for']?.toString().split(',')[0]?.trim() || req.ip || req.socket?.remoteAddress || '',
  userAgent: (req.headers['user-agent'] || '').slice(0, 300),
});

/** Customer-facing QR payload — never expose raw UPI ID / deep link */
const toPublicUpiQr = (payload, order) => ({
  qrImage: payload?.qrImage,
  payeeName: payload?.payeeName || process.env.UPI_PAYEE_NAME || 'Manikanta Khadi Handlooms',
  amount: payload?.amount,
  expiresAt: payload?.expiresAt,
  paymentToken: payload?.paymentToken,
  orderId: order?._id,
  orderNumber: order?.orderNumber,
});

const sanitizeOrderForCustomer = (orderDoc) => {
  const order = orderDoc?.toObject ? orderDoc.toObject() : { ...orderDoc };
  if (order.upiQrPayload) {
    order.upiQrPayload = {
      payeeName: order.upiQrPayload.payeeName,
      amount: order.upiQrPayload.amount,
      qrImage: order.upiQrPayload.qrImage,
      expiresAt: order.upiQrPayload.expiresAt,
      paymentToken: order.upiQrPayload.paymentToken,
    };
  }
  return order;
};

exports.createOrder = async (req, res, next) => {
  try {
    const { shippingAddress, paymentMethod, couponCode, notes } = req.body;

    if (!['upi_qr', 'cod'].includes(paymentMethod)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid payment method. Choose UPI QR or Cash on Delivery.',
      });
    }

    const cart = await Cart.findOne({ user: req.user.id }).populate('items.product');
    if (!cart || cart.items.length === 0) {
      return res.status(400).json({ success: false, message: 'Cart is empty' });
    }

    for (const item of cart.items) {
      if (!item.product || item.product.status !== 'active') {
        return res.status(400).json({
          success: false,
          message: `Product unavailable: ${item.product?.name || 'Unknown'}`,
        });
      }
      if (item.product.stock < item.quantity) {
        return res.status(400).json({
          success: false,
          message: `Insufficient stock for ${item.product.name}`,
        });
      }
    }

    let subtotal = 0;
    const orderItems = cart.items.map((item) => {
      const offerPrice = item.price || item.product.offerPrice;
      const lineTotal = offerPrice * item.quantity;
      subtotal += lineTotal;
      return {
        product: item.product._id,
        name: item.product.name,
        image: item.product.images?.[0]?.url,
        sku: item.product.sku,
        quantity: item.quantity,
        size: item.size,
        color: item.color,
        mrp: item.product.mrp,
        offerPrice,
        totalPrice: lineTotal,
      };
    });

    let discount = cart.couponDiscount || 0;
    let appliedCouponCode = couponCode || null;

    if (couponCode) {
      const coupon = await Coupon.findOne({ code: couponCode.toUpperCase(), isActive: true });
      if (
        coupon &&
        (!coupon.usageLimit || coupon.usedCount < coupon.usageLimit) &&
        subtotal >= coupon.minOrderAmount
      ) {
        discount = coupon.discountType === 'percentage'
          ? Math.min((subtotal * coupon.discountValue) / 100, coupon.maxDiscount || Infinity)
          : coupon.discountValue;
        appliedCouponCode = coupon.code;
        coupon.usedCount += 1;
        await coupon.save();
      }
    }

    const shippingCharges = calcShipping();
    const totalAmount = Math.max(0, subtotal - discount + shippingCharges);
    const orderNumber = generateOrderNumber();

    const order = await Order.create({
      orderNumber,
      user: req.user.id,
      items: orderItems,
      shippingAddress,
      subtotal,
      shippingCharges,
      discount,
      couponCode: appliedCouponCode,
      totalAmount,
      paymentMethod,
      notes,
      estimatedDelivery: '5-7 business days',
      tracking: [{ status: 'pending', message: 'Order placed successfully' }],
    });

    for (const item of cart.items) {
      await Product.findByIdAndUpdate(item.product._id, {
        $inc: { stock: -item.quantity, soldCount: item.quantity },
      });
    }

    cart.items = [];
    cart.coupon = undefined;
    cart.couponDiscount = 0;
    await cart.save();

    let upiQr = null;

    if (paymentMethod === 'upi_qr') {
      const qrData = await generateUpiQr({
        amount: totalAmount,
        orderNumber: order.orderNumber,
      });

      const expiresAt = new Date(Date.now() + qrData.expiresInMinutes * 60 * 1000);
      const paymentToken = createPaymentToken(order._id.toString(), order.orderNumber, totalAmount);

      order.upiQrPayload = {
        upiId: qrData.upiId,
        payeeName: qrData.payeeName,
        amount: qrData.amount,
        upiString: qrData.upiString,
        qrImage: qrData.qrImage,
        expiresAt,
        paymentToken,
      };
      order.paymentSecurity = {
        ...(order.paymentSecurity?.toObject?.() || order.paymentSecurity || {}),
        paymentToken,
        utrAttempts: 0,
      };
      await order.save();

      await Payment.create({
        user: req.user.id,
        order: order._id,
        amount: totalAmount,
        method: 'upi_qr',
        status: 'created',
        security: { paymentToken, attemptCount: 0 },
        metadata: {
          upiId: qrData.upiId,
          upiString: qrData.upiString,
          expiresAt,
        },
      });

      upiQr = toPublicUpiQr(order.upiQrPayload, order);
    } else {
      await Payment.create({
        user: req.user.id,
        order: order._id,
        amount: totalAmount,
        method: 'cod',
        status: 'created',
      });
      order.status = 'confirmed';
      order.tracking.push({
        status: 'confirmed',
        message: 'Order confirmed — pay cash on delivery',
      });
      await order.save();
    }

    await Notification.create({
      user: req.user.id,
      title: 'Order Placed',
      message: `Your order #${order.orderNumber} has been placed successfully`,
      type: 'order',
      link: `/orders/${order._id}`,
    });

    sendOrderConfirmationEmail(req.user, order).catch(() => {});
    sendOrderConfirmationWhatsApp(req.user, order).catch(() => {});

    let adminWhatsApp = null;
    try {
      adminWhatsApp = await sendAdminOrderAlert(req.user, order);
    } catch (err) {
      console.error('Admin order WhatsApp failed:', err.message);
    }

    res.status(201).json({
      success: true,
      message: 'Order created successfully',
      order: sanitizeOrderForCustomer(order),
      upiQr,
      adminWhatsAppUrl: adminWhatsApp?.waMeUrl || null,
      openAdminWhatsApp: Boolean(adminWhatsApp?.waMeUrl && !adminWhatsApp?.sentViaTwilio),
    });
  } catch (error) {
    next(error);
  }
};

/** Refresh / re-fetch dynamic QR for an unpaid UPI order */
exports.getUpiQr = async (req, res, next) => {
  try {
    const order = await Order.findOne({ _id: req.params.id, user: req.user.id });
    if (!order) return res.status(404).json({ success: false, message: 'Order not found' });
    if (order.paymentMethod !== 'upi_qr') {
      return res.status(400).json({ success: false, message: 'This order is not a UPI QR payment' });
    }
    if (order.paymentStatus === 'paid') {
      return res.status(400).json({ success: false, message: 'Order already paid' });
    }

    const expired =
      !order.upiQrPayload?.expiresAt || new Date(order.upiQrPayload.expiresAt) < new Date();

    if (expired || !order.upiQrPayload?.qrImage || !order.upiQrPayload?.paymentToken) {
      const qrData = await generateUpiQr({
        amount: order.totalAmount,
        orderNumber: order.orderNumber,
      });
      const expiresAt = new Date(Date.now() + qrData.expiresInMinutes * 60 * 1000);
      const paymentToken = createPaymentToken(
        order._id.toString(),
        order.orderNumber,
        order.totalAmount
      );
      order.upiQrPayload = {
        upiId: qrData.upiId,
        payeeName: qrData.payeeName,
        amount: qrData.amount,
        upiString: qrData.upiString,
        qrImage: qrData.qrImage,
        expiresAt,
        paymentToken,
      };
      order.paymentSecurity = {
        ...(order.paymentSecurity?.toObject?.() || order.paymentSecurity || {}),
        paymentToken,
      };
      await order.save();
    }

    res.json({
      success: true,
      upiQr: toPublicUpiQr(order.upiQrPayload, order),
    });
  } catch (error) {
    next(error);
  }
};

/** Customer submits UTR — held for admin verification (not instantly paid) */
exports.confirmUpiPayment = async (req, res, next) => {
  try {
    const { orderId, upiTransactionId, paymentToken } = req.body;
    const { ip, userAgent } = getClientMeta(req);

    const order = await Order.findOne({ _id: orderId, user: req.user.id });
    if (!order) return res.status(404).json({ success: false, message: 'Order not found' });
    if (order.paymentMethod !== 'upi_qr') {
      return res.status(400).json({ success: false, message: 'Invalid payment method for this order' });
    }
    if (order.paymentStatus === 'paid') {
      return res.json({
        success: true,
        message: 'Payment already verified',
        order: sanitizeOrderForCustomer(order),
      });
    }
    if (order.paymentStatus === 'awaiting_verification' && order.upiTransactionId) {
      return res.json({
        success: true,
        message: 'UTR already submitted. Waiting for admin verification.',
        order: sanitizeOrderForCustomer(order),
        awaitingVerification: true,
      });
    }

    // Lockout after too many invalid attempts
    if (order.paymentSecurity?.lockedUntil && new Date(order.paymentSecurity.lockedUntil) > new Date()) {
      return res.status(429).json({
        success: false,
        message: 'Too many invalid UTR attempts. Please try again later or contact support.',
      });
    }

    // QR / payment window expiry
    if (order.upiQrPayload?.expiresAt && new Date(order.upiQrPayload.expiresAt) < new Date()) {
      return res.status(400).json({
        success: false,
        message: 'Payment QR has expired. Refresh the QR and pay again, then submit the new UTR.',
      });
    }

    // Anti-tamper: payment token must match order + amount
    const expectedToken = order.paymentSecurity?.paymentToken || order.upiQrPayload?.paymentToken;
    const tokenOk =
      expectedToken &&
      (paymentToken === expectedToken ||
        verifyPaymentToken(paymentToken, order._id.toString(), order.orderNumber, order.totalAmount));

    if (!tokenOk) {
      return res.status(403).json({
        success: false,
        message: 'Invalid payment session. Please refresh the QR and try again.',
      });
    }

    const validation = validateUtr(upiTransactionId);
    const attempts = (order.paymentSecurity?.utrAttempts || 0) + 1;

    order.paymentSecurity = {
      ...(order.paymentSecurity?.toObject?.() || order.paymentSecurity || {}),
      utrAttempts: attempts,
      lastUtrAttemptAt: new Date(),
      submittedIp: ip,
      submittedUserAgent: userAgent,
    };

    if (!validation.ok) {
      if (attempts >= MAX_UTR_ATTEMPTS) {
        order.paymentSecurity.lockedUntil = new Date(Date.now() + 30 * 60 * 1000);
        order.paymentStatus = 'failed';
        order.tracking.push({
          status: 'pending',
          message: 'Payment locked after multiple invalid UTR attempts',
        });
      }
      await order.save();
      await Payment.findOneAndUpdate(
        { order: order._id },
        {
          $inc: { 'security.attemptCount': 1 },
          $set: { 'security.lastAttemptAt': new Date() },
        }
      );
      return res.status(400).json({
        success: false,
        message: validation.message,
        attemptsRemaining: Math.max(0, MAX_UTR_ATTEMPTS - attempts),
      });
    }

    const txnId = validation.utr;
    const txnHash = hashUtr(txnId);

    // Prevent UTR reuse across orders (fraud)
    const [dupOrder, dupPayment] = await Promise.all([
      Order.findOne({
        upiTransactionHash: txnHash,
        _id: { $ne: order._id },
      }).select('_id orderNumber'),
      Payment.findOne({
        upiTransactionHash: txnHash,
        order: { $ne: order._id },
      }).select('_id'),
    ]);

    if (dupOrder || dupPayment) {
      order.paymentSecurity.utrAttempts = attempts;
      if (attempts >= MAX_UTR_ATTEMPTS) {
        order.paymentSecurity.lockedUntil = new Date(Date.now() + 30 * 60 * 1000);
      }
      await order.save();
      return res.status(409).json({
        success: false,
        message: 'This UTR / transaction ID is already used on another order. Enter the UTR from THIS payment only.',
      });
    }

    order.paymentStatus = 'awaiting_verification';
    order.paymentId = txnId;
    order.upiTransactionId = txnId;
    order.upiTransactionHash = txnHash;
    order.paymentSecurity.submittedAt = new Date();
    order.tracking.push({
      status: 'pending',
      message: `UTR submitted for verification (${txnId.slice(0, 4)}****${txnId.slice(-4)})`,
    });
    await order.save();

    await Payment.findOneAndUpdate(
      { order: order._id },
      {
        $set: {
          status: 'awaiting_verification',
          upiTransactionId: txnId,
          upiTransactionHash: txnHash,
          'security.submittedIp': ip,
          'security.submittedUserAgent': userAgent,
          'security.lastAttemptAt': new Date(),
          metadata: {
            confirmedBy: 'customer',
            submittedAt: new Date(),
            maskedUtr: `${txnId.slice(0, 4)}****${txnId.slice(-4)}`,
          },
        },
        $inc: { 'security.attemptCount': 1 },
      }
    );

    await Notification.create({
      user: req.user.id,
      title: 'Payment Under Review',
      message: `UTR for order #${order.orderNumber} received. We will verify and confirm shortly.`,
      type: 'order',
      link: `/orders/${order._id}`,
    });

    res.json({
      success: true,
      message: 'UTR submitted securely. Your payment is awaiting admin verification.',
      order: sanitizeOrderForCustomer(order),
      awaitingVerification: true,
    });
  } catch (error) {
    if (error?.code === 11000) {
      return res.status(409).json({
        success: false,
        message: 'This UTR is already registered. Please use the transaction ID from your payment for this order.',
      });
    }
    next(error);
  }
};

/** Admin verifies UPI UTR and marks order paid */
exports.verifyUpiPayment = async (req, res, next) => {
  try {
    const { upiTransactionId, notes, approve = true } = req.body;
    const order = await Order.findById(req.params.id);
    if (!order) return res.status(404).json({ success: false, message: 'Order not found' });
    if (order.paymentMethod !== 'upi_qr') {
      return res.status(400).json({ success: false, message: 'Not a UPI QR order' });
    }

    if (approve === false || approve === 'false') {
      order.paymentStatus = 'failed';
      order.upiTransactionId = undefined;
      order.upiTransactionHash = undefined;
      order.paymentId = undefined;
      order.paymentSecurity = {
        ...(order.paymentSecurity?.toObject?.() || order.paymentSecurity || {}),
        utrAttempts: 0,
        lockedUntil: undefined,
      };
      order.tracking.push({
        status: 'pending',
        message: notes || 'UPI payment rejected by admin — customer may resubmit UTR',
      });
      await order.save();
      await Payment.findOneAndUpdate(
        { order: order._id },
        {
          status: 'failed',
          upiTransactionId: undefined,
          upiTransactionHash: undefined,
          metadata: { rejectedBy: req.admin?.id, rejectedAt: new Date(), notes },
        }
      );
      return res.json({ success: true, message: 'Payment rejected. Customer can submit a new UTR.', order });
    }

    const rawTxn = upiTransactionId || order.upiTransactionId;
    const validation = validateUtr(rawTxn);
    if (!validation.ok) {
      return res.status(400).json({ success: false, message: validation.message });
    }

    const txnId = validation.utr;
    const txnHash = hashUtr(txnId);

    const dup = await Order.findOne({
      upiTransactionHash: txnHash,
      _id: { $ne: order._id },
      paymentStatus: { $in: ['awaiting_verification', 'paid'] },
    });
    if (dup) {
      return res.status(409).json({
        success: false,
        message: `UTR already used on order #${dup.orderNumber}`,
      });
    }

    order.paymentStatus = 'paid';
    order.paymentId = txnId;
    order.upiTransactionId = txnId;
    order.upiTransactionHash = txnHash;
    order.status = 'confirmed';
    order.paymentSecurity = {
      ...(order.paymentSecurity?.toObject?.() || order.paymentSecurity || {}),
      verifiedAt: new Date(),
      verifiedBy: req.admin?.id,
      lockedUntil: undefined,
    };
    order.tracking.push({
      status: 'confirmed',
      message: notes || `UPI payment verified by admin (UTR: ${txnId})`,
    });
    await order.save();

    await Payment.findOneAndUpdate(
      { order: order._id },
      {
        status: 'paid',
        upiTransactionId: txnId,
        upiTransactionHash: txnHash,
        metadata: {
          verifiedBy: req.admin?.id,
          verifiedAt: new Date(),
          notes,
        },
      }
    );

    await Notification.create({
      user: order.user,
      title: 'Payment Verified',
      message: `Payment for order #${order.orderNumber} has been verified`,
      type: 'order',
      link: `/orders/${order._id}`,
    });

    res.json({ success: true, message: 'UPI payment verified and order confirmed', order });
  } catch (error) {
    if (error?.code === 11000) {
      return res.status(409).json({ success: false, message: 'This UTR is already linked to another order' });
    }
    next(error);
  }
};

exports.getOrders = async (req, res, next) => {
  try {
    const { page = 1, limit = 10 } = req.query;
    const skip = (parseInt(page, 10) - 1) * parseInt(limit, 10);

    const [orders, total] = await Promise.all([
      Order.find({ user: req.user.id }).sort('-createdAt').skip(skip).limit(parseInt(limit, 10)),
      Order.countDocuments({ user: req.user.id }),
    ]);

    res.json({
      success: true,
      orders: orders.map((o) => sanitizeOrderForCustomer(o)),
      pagination: { page: parseInt(page, 10), total, pages: Math.ceil(total / limit) },
    });
  } catch (error) {
    next(error);
  }
};

exports.getOrder = async (req, res, next) => {
  try {
    const order = await Order.findOne({ _id: req.params.id, user: req.user.id }).populate(
      'items.product',
      'name images slug'
    );
    if (!order) return res.status(404).json({ success: false, message: 'Order not found' });
    res.json({ success: true, order: sanitizeOrderForCustomer(order) });
  } catch (error) {
    next(error);
  }
};

exports.trackOrder = async (req, res, next) => {
  try {
    const { orderNumber } = req.params;
    const order = await Order.findOne({ orderNumber }).select(
      'orderNumber status tracking estimatedDelivery createdAt items totalAmount'
    );
    if (!order) return res.status(404).json({ success: false, message: 'Order not found' });
    res.json({ success: true, order });
  } catch (error) {
    next(error);
  }
};

exports.getAdminOrders = async (req, res, next) => {
  try {
    const { page = 1, limit = 20, status } = req.query;
    const query = status ? { status } : {};
    const skip = (parseInt(page, 10) - 1) * parseInt(limit, 10);

    const [orders, total] = await Promise.all([
      Order.find(query)
        .populate('user', 'name email phone')
        .sort('-createdAt')
        .skip(skip)
        .limit(parseInt(limit, 10)),
      Order.countDocuments(query),
    ]);

    res.json({
      success: true,
      orders,
      pagination: { page: parseInt(page, 10), total, pages: Math.ceil(total / limit) },
    });
  } catch (error) {
    next(error);
  }
};

exports.updateOrderStatus = async (req, res, next) => {
  try {
    const { status, message, location } = req.body;
    const allowedStatuses = [
      'pending',
      'confirmed',
      'processing',
      'shipped',
      'out_for_delivery',
      'delivered',
      'cancelled',
    ];
    if (!allowedStatuses.includes(status)) {
      return res.status(400).json({ success: false, message: 'Invalid order status.' });
    }

    const order = await Order.findById(req.params.id);
    if (!order) return res.status(404).json({ success: false, message: 'Order not found' });

    if (!canTransitionOrderStatus(order.status, status)) {
      return res.status(400).json({
        success: false,
        message: `Cannot change status from "${order.status}" to "${status}".`,
      });
    }

    order.status = status;
    order.tracking.push({
      status,
      message: message || `Order is now ${status}`,
      location,
      updatedBy: req.admin?._id,
    });
    if (status === 'delivered') order.deliveredAt = new Date();
    if (status === 'cancelled') order.cancelledAt = new Date();
    await order.save();

    await Notification.create({
      user: order.user,
      title: 'Order Update',
      message: message || `Your order #${order.orderNumber} is now ${status}`,
      type: 'order',
      link: `/track-order/${order.orderNumber}`,
    });

    // Email customer with tracking / delivery details (non-blocking)
    setImmediate(async () => {
      try {
        const customer = await User.findById(order.user);
        if (customer?.email) {
          await sendOrderStatusEmail(customer, order, status);
        }
      } catch (err) {
        console.error('Order status email failed:', err.message);
      }
    });

    res.json({ success: true, message: 'Order status updated', order });
  } catch (error) {
    next(error);
  }
};

exports.cancelOrder = async (req, res, next) => {
  try {
    const order = await Order.findOne({ _id: req.params.id, user: req.user.id });
    if (!order) return res.status(404).json({ success: false, message: 'Order not found' });
    if (!['pending', 'confirmed'].includes(order.status)) {
      return res.status(400).json({ success: false, message: 'Order cannot be cancelled at this stage' });
    }

    order.status = 'cancelled';
    order.cancelledAt = new Date();
    order.cancelReason = req.body.reason;
    order.tracking.push({ status: 'cancelled', message: req.body.reason || 'Cancelled by customer' });
    await order.save();

    for (const item of order.items) {
      await Product.findByIdAndUpdate(item.product, {
        $inc: { stock: item.quantity, soldCount: -item.quantity },
      });
    }

    res.json({ success: true, message: 'Order cancelled', order });
  } catch (error) {
    next(error);
  }
};
