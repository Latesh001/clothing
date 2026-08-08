const Wishlist = require('../models/Wishlist');

const getOrCreateWishlist = async (userId) => {
  let wishlist = await Wishlist.findOne({ user: userId }).populate('products', 'name slug images offerPrice mrp discount stock status');
  if (!wishlist) wishlist = await Wishlist.create({ user: userId, products: [] });
  return wishlist;
};

exports.getWishlist = async (req, res, next) => {
  try {
    const wishlist = await getOrCreateWishlist(req.user.id);
    res.json({ success: true, wishlist });
  } catch (error) {
    next(error);
  }
};

exports.addToWishlist = async (req, res, next) => {
  try {
    const { productId } = req.body;
    const wishlist = await getOrCreateWishlist(req.user.id);

    if (wishlist.products.includes(productId)) {
      return res.status(400).json({ success: false, message: 'Product already in wishlist' });
    }

    wishlist.products.push(productId);
    await wishlist.save();
    await wishlist.populate('products', 'name slug images offerPrice mrp discount stock status');
    res.json({ success: true, message: 'Added to wishlist', wishlist });
  } catch (error) {
    next(error);
  }
};

exports.removeFromWishlist = async (req, res, next) => {
  try {
    const wishlist = await getOrCreateWishlist(req.user.id);
    wishlist.products = wishlist.products.filter(p => p.toString() !== req.params.productId);
    await wishlist.save();
    await wishlist.populate('products', 'name slug images offerPrice mrp discount stock status');
    res.json({ success: true, message: 'Removed from wishlist', wishlist });
  } catch (error) {
    next(error);
  }
};

exports.toggleWishlist = async (req, res, next) => {
  try {
    const { productId } = req.body;
    const wishlist = await getOrCreateWishlist(req.user.id);
    const index = wishlist.products.findIndex(p => p.toString() === productId);

    if (index > -1) {
      wishlist.products.splice(index, 1);
    } else {
      wishlist.products.push(productId);
    }

    await wishlist.save();
    await wishlist.populate('products', 'name slug images offerPrice mrp discount stock status');
    res.json({ success: true, message: index > -1 ? 'Removed from wishlist' : 'Added to wishlist', wishlist });
  } catch (error) {
    next(error);
  }
};
