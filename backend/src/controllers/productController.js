const Product = require('../models/Product');
const Category = require('../models/Category');
const Subcategory = require('../models/Subcategory');
const { deleteFile } = require('../services/cloudinaryService');
const { saveProductImages, saveProductVideos } = require('../services/uploadService');
const { parseProductBody } = require('../utils/parseProductBody');

const slugify = (text) =>
  String(text || '')
    .toLowerCase()
    .replace(/[^\w\s-]/g, '')
    .replace(/[\s_-]+/g, '-')
    .replace(/^-+|-+$/g, '') || 'product';

/** Generate a unique product slug (appends -2, -3, … if needed) */
const ensureUniqueSlug = async (baseName, excludeId = null) => {
  let base = slugify(baseName);
  if (!base) base = `product-${Date.now().toString(36)}`;

  let slug = base;
  let n = 2;
  while (true) {
    const query = { slug };
    if (excludeId) query._id = { $ne: excludeId };
    const exists = await Product.exists(query);
    if (!exists) return slug;
    slug = `${base}-${n}`;
    n += 1;
    if (n > 500) {
      return `${base}-${Date.now().toString(36)}`;
    }
  }
};

/** Ensure SKU is unique */
const ensureUniqueSku = async (sku, excludeId = null) => {
  let base = String(sku || '')
    .toUpperCase()
    .replace(/[^A-Z0-9-_]/g, '')
    .slice(0, 40);
  if (!base) base = `SKU-${Date.now().toString(36).toUpperCase()}`;

  let candidate = base;
  let n = 2;
  while (true) {
    const query = { sku: candidate };
    if (excludeId) query._id = { $ne: excludeId };
    const exists = await Product.exists(query);
    if (!exists) return candidate;
    candidate = `${base}-${n}`;
    n += 1;
    if (n > 500) {
      return `${base}-${Date.now().toString(36).toUpperCase()}`;
    }
  }
};

exports.getProducts = async (req, res, next) => {
  try {
    const {
      page = 1, limit = 12, category, subcategory, minPrice, maxPrice,
      sort = 'newest', fabric, color, material, borderType, palluType,
      availability, discount, search, featured, trending, bestSeller, newArrival,
    } = req.query;

    const query = { status: { $in: ['active', 'out_of_stock'] } };

    // Accept category/subcategory as MongoDB id OR slug (e.g. pallu-sarees)
    if (category) {
      if (/^[0-9a-fA-F]{24}$/.test(category)) {
        query.category = category;
      } else {
        const catDoc = await Category.findOne({ slug: category, isActive: true });
        if (catDoc) query.category = catDoc._id;
        else query.category = null; // force empty result for unknown slug
      }
    }
    if (subcategory) {
      if (/^[0-9a-fA-F]{24}$/.test(subcategory)) {
        query.subcategory = subcategory;
      } else {
        const subDoc = await Subcategory.findOne({ slug: subcategory, isActive: true });
        if (subDoc) query.subcategory = subDoc._id;
        else query.subcategory = null;
      }
    }
    if (minPrice || maxPrice) {
      query.offerPrice = {};
      if (minPrice) query.offerPrice.$gte = Number(minPrice);
      if (maxPrice) query.offerPrice.$lte = Number(maxPrice);
    }
    if (fabric) query.fabric = new RegExp(fabric, 'i');
    if (material) query.material = new RegExp(material, 'i');
    if (borderType) query.borderType = new RegExp(borderType, 'i');
    if (palluType) query.palluType = new RegExp(palluType, 'i');
    if (color) query['colors.name'] = new RegExp(color, 'i');
    if (availability === 'in_stock') query.stock = { $gt: 0 };
    if (discount) query.discount = { $gte: Number(discount) };
    if (featured === 'true') query.isFeatured = true;
    if (trending === 'true') query.isTrending = true;
    if (bestSeller === 'true') query.isBestSeller = true;
    if (newArrival === 'true') query.isNewArrival = true;
    if (search) query.$text = { $search: search };

    const sortOptions = {
      newest: { createdAt: -1 },
      oldest: { createdAt: 1 },
      'price-low': { offerPrice: 1 },
      'price-high': { offerPrice: -1 },
      popularity: { soldCount: -1 },
      discount: { discount: -1 },
      rating: { averageRating: -1 },
    };

    const skip = (parseInt(page) - 1) * parseInt(limit);
    const [products, total] = await Promise.all([
      Product.find(query)
        .populate('category', 'name slug')
        .populate('subcategory', 'name slug')
        .sort(sortOptions[sort] || sortOptions.newest)
        .skip(skip)
        .limit(parseInt(limit)),
      Product.countDocuments(query),
    ]);

    res.json({
      success: true,
      products,
      pagination: { page: parseInt(page), limit: parseInt(limit), total, pages: Math.ceil(total / limit) },
    });
  } catch (error) {
    next(error);
  }
};

exports.getProduct = async (req, res, next) => {
  try {
    const key = decodeURIComponent(String(req.params.slug || '').trim());
    if (!key) {
      return res.status(404).json({ success: false, message: 'Product not found' });
    }

    // Accept product slug or MongoDB ObjectId
    let product = await Product.findOne({ slug: key })
      .populate('category', 'name slug')
      .populate('subcategory', 'name slug')
      .populate('reviews.user', 'name avatar');

    if (!product && /^[0-9a-fA-F]{24}$/.test(key)) {
      product = await Product.findById(key)
        .populate('category', 'name slug')
        .populate('subcategory', 'name slug')
        .populate('reviews.user', 'name avatar');
    }

    if (!product) {
      return res.status(404).json({ success: false, message: 'Product not found' });
    }

    // Avoid save() after populate (can fail on ref models); increment separately
    Product.findByIdAndUpdate(product._id, { $inc: { viewCount: 1 } }).catch(() => {});

    if (req.user) {
      const User = require('../models/User');
      User.findByIdAndUpdate(req.user.id, {
        $pull: { recentlyViewed: product._id },
        $push: { recentlyViewed: { $each: [product._id], $slice: -20 } },
      }).catch(() => {});
    }

    const categoryId = product.category?._id || product.category;
    const related = categoryId
      ? await Product.find({
          category: categoryId,
          _id: { $ne: product._id },
          status: 'active',
        })
          .select('name slug images offerPrice mrp discount averageRating')
          .limit(8)
      : [];

    res.json({ success: true, product, related });
  } catch (error) {
    next(error);
  }
};

exports.createProduct = async (req, res, next) => {
  try {
    const data = parseProductBody(req.body);

    if (!data.name || !data.description || !data.category || !data.sku || !data.mrp) {
      return res.status(400).json({
        success: false,
        message: 'Name, description, category, SKU, and MRP are required.',
      });
    }

    const categoryExists = await Category.findById(data.category);
    if (!categoryExists) {
      return res.status(400).json({ success: false, message: 'Selected category is invalid. Please choose again.' });
    }

    if (data.subcategory) {
      const subExists = await Subcategory.findOne({ _id: data.subcategory, category: data.category });
      if (!subExists) {
        return res.status(400).json({ success: false, message: 'Selected subcategory does not belong to this category.' });
      }
    } else {
      delete data.subcategory;
    }

    data.slug = await ensureUniqueSlug(data.name);
    data.sku = await ensureUniqueSku(data.sku);

    const imageFiles = req.files?.images || [];
    const videoFiles = req.files?.videos || [];

    if (imageFiles.length) {
      const uploads = await saveProductImages(imageFiles);
      data.images = uploads.map((u) => ({ url: u.url, publicId: u.publicId, alt: data.name }));
    } else if (req.body.imageUrl) {
      data.images = [{ url: req.body.imageUrl, alt: data.name }];
    } else {
      data.images = [];
    }

    if (videoFiles.length) {
      data.videos = await saveProductVideos(videoFiles);
    }

    const product = await Product.create(data);
    const populated = await Product.findById(product._id).populate('category subcategory');
    res.status(201).json({ success: true, message: 'Product created', product: populated });
  } catch (error) {
    next(error);
  }
};

exports.updateProduct = async (req, res, next) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product) return res.status(404).json({ success: false, message: 'Product not found' });

    const data = parseProductBody(req.body);

    // Only regenerate slug when the product name actually changes
    if (data.name && data.name.trim() !== product.name) {
      data.slug = await ensureUniqueSlug(data.name, product._id);
    } else {
      delete data.slug;
    }

    if (data.sku && data.sku !== product.sku) {
      data.sku = await ensureUniqueSku(data.sku, product._id);
    } else if (data.sku === product.sku) {
      delete data.sku;
    }

    if (data.category) {
      const categoryExists = await Category.findById(data.category);
      if (!categoryExists) {
        return res.status(400).json({ success: false, message: 'Selected category is invalid.' });
      }
    }

    if (data.subcategory) {
      const subExists = await Subcategory.findOne({
        _id: data.subcategory,
        category: data.category || product.category,
      });
      if (!subExists) {
        return res.status(400).json({ success: false, message: 'Selected subcategory does not belong to this category.' });
      }
    }

    const imageFiles = req.files?.images || [];
    if (imageFiles.length) {
      const uploads = await saveProductImages(imageFiles);
      data.images = [
        ...(product.images || []),
        ...uploads.map((u) => ({ url: u.url, publicId: u.publicId, alt: data.name || product.name })),
      ];
    }

    Object.assign(product, data);
    await product.save();
    const populated = await Product.findById(product._id).populate('category subcategory');
    res.json({ success: true, message: 'Product updated', product: populated });
  } catch (error) {
    next(error);
  }
};

exports.deleteProduct = async (req, res, next) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product) return res.status(404).json({ success: false, message: 'Product not found' });

    for (const img of product.images || []) {
      if (img.publicId) await deleteFile(img.publicId).catch(() => {});
    }

    await product.deleteOne();
    res.json({ success: true, message: 'Product deleted' });
  } catch (error) {
    next(error);
  }
};

exports.toggleProductStatus = async (req, res, next) => {
  try {
    const { status } = req.body;
    const product = await Product.findByIdAndUpdate(req.params.id, { status }, { new: true });
    if (!product) return res.status(404).json({ success: false, message: 'Product not found' });
    res.json({ success: true, message: `Product status updated to ${status}`, product });
  } catch (error) {
    next(error);
  }
};

exports.getAdminProducts = async (req, res, next) => {
  try {
    const { page = 1, limit = 20, status, search } = req.query;
    const query = {};
    if (status) query.status = status;
    if (search) query.$text = { $search: search };

    const skip = (parseInt(page) - 1) * parseInt(limit);
    const [products, total] = await Promise.all([
      Product.find(query).populate('category subcategory').sort('-createdAt').skip(skip).limit(parseInt(limit)),
      Product.countDocuments(query),
    ]);

    res.json({ success: true, products, pagination: { page: parseInt(page), total, pages: Math.ceil(total / limit) } });
  } catch (error) {
    next(error);
  }
};

exports.searchProducts = async (req, res, next) => {
  try {
    const { q, limit = 10 } = req.query;
    if (!q || q.length < 2) return res.json({ success: true, suggestions: [], products: [] });

    const products = await Product.find({
      $text: { $search: q },
      status: 'active',
    }).select('name slug images offerPrice mrp discount').limit(parseInt(limit));

    const suggestions = products.map(p => p.name);

    if (req.user) {
      const User = require('../models/User');
      await User.findByIdAndUpdate(req.user.id, {
        $push: { searchHistory: { $each: [{ query: q }], $slice: -20 } },
      });
    }

    res.json({ success: true, suggestions, products });
  } catch (error) {
    next(error);
  }
};

exports.getHomeData = async (req, res, next) => {
  try {
    const [featured, trending, bestSellers, newArrivals, categories] = await Promise.all([
      Product.find({ isFeatured: true, status: 'active' }).limit(8),
      Product.find({ isTrending: true, status: 'active' }).limit(8),
      Product.find({ isBestSeller: true, status: 'active' }).limit(8),
      Product.find({ isNewArrival: true, status: 'active' }).limit(8),
      Category.find({ isActive: true }).sort('sortOrder'),
    ]);

    res.json({ success: true, featured, trending, bestSellers, newArrivals, categories });
  } catch (error) {
    next(error);
  }
};

exports.getCategories = async (req, res, next) => {
  try {
    const categories = await Category.find({ isActive: true }).sort('sortOrder');
    const subcategories = await Subcategory.find({ isActive: true }).populate('category', 'name slug');
    res.json({ success: true, categories, subcategories });
  } catch (error) {
    next(error);
  }
};

exports.createCategory = async (req, res, next) => {
  try {
    const data = { ...req.body, slug: slugify(req.body.name) };
    const category = await Category.create(data);
    res.status(201).json({ success: true, category });
  } catch (error) {
    next(error);
  }
};

exports.createSubcategory = async (req, res, next) => {
  try {
    const data = { ...req.body, slug: slugify(req.body.name) };
    const subcategory = await Subcategory.create(data);
    res.status(201).json({ success: true, subcategory });
  } catch (error) {
    next(error);
  }
};
