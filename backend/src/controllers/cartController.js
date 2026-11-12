const Cart = require('../models/Cart');
const Product = require('../models/Product');
const { sendCartUpdateWhatsApp, sendAdminCartAlert } = require('../services/whatsappService');

const getOrCreateCart = async (userId) => {
  let cart = await Cart.findOne({ user: userId }).populate('items.product', 'name images offerPrice stock status');
  if (!cart) cart = await Cart.create({ user: userId, items: [] });
  return cart;
};

exports.getCart = async (req, res, next) => {
  try {
    const cart = await getOrCreateCart(req.user.id);
    res.json({ success: true, cart });
  } catch (error) {
    next(error);
  }
};

exports.addToCart = async (req, res, next) => {
  try {
    const { productId, quantity = 1, size, color } = req.body;
    const product = await Product.findById(productId);
    if (!product || product.status !== 'active') {
      return res.status(404).json({ success: false, message: 'Product not available' });
    }
    if (product.stock < quantity) {
      return res.status(400).json({ success: false, message: 'Insufficient stock' });
    }

    const cart = await getOrCreateCart(req.user.id);
    const existingIndex = cart.items.findIndex((item) => {
      const id = item.product?._id?.toString?.() || item.product?.toString?.() || '';
      return id === productId.toString() && item.size === size && item.color === color;
    });

    if (existingIndex > -1) {
      cart.items[existingIndex].quantity += quantity;
    } else {
      cart.items.push({ product: productId, quantity, size, color, price: product.offerPrice });
    }

    await cart.save();
    await cart.populate('items.product', 'name images offerPrice stock status');

    const User = require('../models/User');
    const user = await User.findById(req.user.id);

    // Always notify admin (8074181510) with full cart item list
    let adminWhatsApp = null;
    try {
      adminWhatsApp = await sendAdminCartAlert(user, cart, product.name);
    } catch (err) {
      console.error('Admin cart WhatsApp failed:', err.message);
    }

    // Optional customer confirmation if they have a phone on file
    if (user?.phone) {
      sendCartUpdateWhatsApp(user, cart).catch(console.error);
    }

    res.json({
      success: true,
      message: 'Added to cart',
      cart,
      // If Twilio is not set, frontend can open this so admin still gets the list
      adminWhatsAppUrl: adminWhatsApp?.waMeUrl || null,
      openAdminWhatsApp: Boolean(adminWhatsApp?.waMeUrl && !adminWhatsApp?.sentViaTwilio),
    });
  } catch (error) {
    next(error);
  }
};

exports.updateCartItem = async (req, res, next) => {
  try {
    const { quantity } = req.body;
    const cart = await getOrCreateCart(req.user.id);
    const item = cart.items.id(req.params.itemId);
    if (!item) return res.status(404).json({ success: false, message: 'Cart item not found' });

    if (quantity <= 0) {
      cart.items.pull(req.params.itemId);
    } else {
      const product = await Product.findById(item.product?._id || item.product);
      if (!product || product.status !== 'active') {
        cart.items.pull(req.params.itemId);
      } else if (quantity > product.stock) {
        return res.status(400).json({
          success: false,
          message: `Only ${product.stock} item${product.stock === 1 ? '' : 's'} available.`,
        });
      } else {
        item.quantity = quantity;
      }
    }

    await cart.save();
    await cart.populate('items.product', 'name images offerPrice stock status');
    res.json({ success: true, message: 'Cart updated', cart });
  } catch (error) {
    next(error);
  }
};

exports.removeFromCart = async (req, res, next) => {
  try {
    const cart = await getOrCreateCart(req.user.id);
    cart.items.pull(req.params.itemId);
    await cart.save();
    await cart.populate('items.product', 'name images offerPrice stock status');
    res.json({ success: true, message: 'Item removed', cart });
  } catch (error) {
    next(error);
  }
};

exports.saveForLater = async (req, res, next) => {
  try {
    const cart = await getOrCreateCart(req.user.id);
    const item = cart.items.id(req.params.itemId);
    if (!item) return res.status(404).json({ success: false, message: 'Item not found' });

    cart.savedForLater.push(item.toObject());
    cart.items.pull(req.params.itemId);
    await cart.save();
    res.json({ success: true, message: 'Saved for later', cart });
  } catch (error) {
    next(error);
  }
};

exports.applyCoupon = async (req, res, next) => {
  try {
    const Coupon = require('../models/Coupon');
    const { code } = req.body;
    const coupon = await Coupon.findOne({ code: code.toUpperCase(), isActive: true });

    if (!coupon) return res.status(404).json({ success: false, message: 'Invalid coupon code' });
    if (coupon.validUntil && coupon.validUntil < new Date()) {
      return res.status(400).json({ success: false, message: 'Coupon has expired' });
    }
    if (coupon.usageLimit && coupon.usedCount >= coupon.usageLimit) {
      return res.status(400).json({ success: false, message: 'Coupon usage limit reached' });
    }

    const cart = await getOrCreateCart(req.user.id);
    const subtotal = cart.items.reduce((sum, item) => sum + item.price * item.quantity, 0);

    if (subtotal < coupon.minOrderAmount) {
      return res.status(400).json({ success: false, message: `Minimum order amount is ₹${coupon.minOrderAmount}` });
    }

    let discount = coupon.discountType === 'percentage'
      ? (subtotal * coupon.discountValue / 100)
      : coupon.discountValue;
    if (coupon.maxDiscount) discount = Math.min(discount, coupon.maxDiscount);

    cart.coupon = coupon._id;
    cart.couponDiscount = discount;
    await cart.save();

    res.json({ success: true, message: 'Coupon applied', discount, cart });
  } catch (error) {
    next(error);
  }
};

exports.clearCart = async (req, res, next) => {
  try {
    const cart = await getOrCreateCart(req.user.id);
    cart.items = [];
    cart.coupon = undefined;
    cart.couponDiscount = 0;
    await cart.save();
    res.json({ success: true, message: 'Cart cleared' });
  } catch (error) {
    next(error);
  }
};
