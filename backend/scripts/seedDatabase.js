require('dotenv').config();
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const Admin = require('../src/models/Admin');
const Category = require('../src/models/Category');
const Subcategory = require('../src/models/Subcategory');
const Product = require('../src/models/Product');
const Coupon = require('../src/models/Coupon');

const categoriesData = [
  { name: 'Pallu Sarees', slug: 'pallu-sarees', sortOrder: 1, description: 'Elegant sarees with beautifully designed pallu patterns' },
  { name: 'Plain Sarees', slug: 'plain-sarees', sortOrder: 2, description: 'Classic plain sarees with subtle borders' },
  { name: 'Allover Sarees', slug: 'allover-sarees', sortOrder: 3, description: 'Sarees with all-over traditional motifs and designs' },
  { name: 'Dupattas', slug: 'dupattas', sortOrder: 4, description: 'Handwoven dupattas in various fabrics' },
  { name: 'Dress Materials', slug: 'dress-materials', sortOrder: 5, description: 'Premium dress materials for custom tailoring' },
  { name: 'Blouses', slug: 'blouses', sortOrder: 6, description: 'Readymade and running blouse materials' },
];

const subcategoriesData = {
  'pallu-sarees': [
    { name: 'Pallu with Plain', slug: 'pallu-with-plain' },
    { name: 'Pallu with Coin Buttis', slug: 'pallu-with-coin-buttis' },
    { name: 'Pallu with Blouse', slug: 'pallu-with-blouse' },
  ],
  'plain-sarees': [
    { name: 'Small Border', slug: 'small-border' },
    { name: 'Big Border', slug: 'big-border' },
    { name: 'Checks', slug: 'checks' },
  ],
  'allover-sarees': [
    { name: 'Full Jall', slug: 'full-jall' },
    { name: 'Skirt Borders', slug: 'skirt-borders' },
  ],
  'dress-materials': [
    { name: 'Cotton', slug: 'cotton' },
    { name: 'Khadi', slug: 'khadi' },
    { name: 'Silk Blend', slug: 'silk-blend' },
  ],
  'blouses': [
    { name: 'Readymade', slug: 'readymade' },
    { name: 'Running Blouse', slug: 'running-blouse' },
  ],
};

const sampleProducts = [
  {
    name: 'Royal Khadi Pallu Saree with Coin Buttis',
    fabric: 'Khadi Cotton',
    material: 'Pure Khadi',
    mrp: 4500,
    discount: 15,
    stock: 25,
    isFeatured: true,
    isTrending: true,
    tags: ['khadi', 'pallu', 'traditional'],
  },
  {
    name: 'Elegant Plain Saree with Small Border',
    fabric: 'Cotton',
    material: 'Handloom Cotton',
    mrp: 2800,
    discount: 10,
    stock: 40,
    isBestSeller: true,
    tags: ['plain', 'cotton', 'daily-wear'],
  },
  {
    name: 'Full Jall Allover Saree - Festive Collection',
    fabric: 'Silk Blend',
    material: 'Silk Cotton',
    mrp: 6500,
    discount: 20,
    stock: 15,
    isNewArrival: true,
    isFeatured: true,
    tags: ['festive', 'silk', 'allover'],
  },
  {
    name: 'Handwoven Khadi Dupatta - Natural Dye',
    fabric: 'Khadi',
    material: 'Organic Khadi',
    mrp: 1200,
    discount: 5,
    stock: 50,
    isTrending: true,
    tags: ['dupatta', 'natural', 'handwoven'],
  },
];

const seed = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/manikanta_khadi');
    console.log('Connected to MongoDB');

    await Promise.all([
      Admin.deleteMany(),
      Category.deleteMany(),
      Subcategory.deleteMany(),
      Product.deleteMany(),
      Coupon.deleteMany(),
    ]);

    const admin = await Admin.create({
      name: 'Super Admin',
      email: process.env.ADMIN_EMAIL || 'admin@manikantakhadi.com',
      password: process.env.ADMIN_PASSWORD || 'Admin@123456',
      role: 'superadmin',
      permissions: ['products', 'orders', 'customers', 'analytics', 'coupons', 'settings'],
    });
    console.log('✅ Admin created:', admin.email);

    const categories = {};
    for (const cat of categoriesData) {
      categories[cat.slug] = await Category.create(cat);
    }
    console.log('✅ Categories seeded');

    const subcategories = {};
    for (const [catSlug, subs] of Object.entries(subcategoriesData)) {
      for (const sub of subs) {
        const created = await Subcategory.create({ ...sub, category: categories[catSlug]._id });
        subcategories[`${catSlug}-${sub.slug}`] = created;
      }
    }
    console.log('✅ Subcategories seeded');

    const categoryKeys = Object.keys(categories);
    for (let i = 0; i < sampleProducts.length; i++) {
      const p = sampleProducts[i];
      const catSlug = categoryKeys[i % categoryKeys.length];
      const cat = categories[catSlug];
      const subKeys = Object.keys(subcategories).filter(k => k.startsWith(catSlug));
      const sub = subcategories[subKeys[0]];

      await Product.create({
        ...p,
        slug: p.name.toLowerCase().replace(/[^\w\s-]/g, '').replace(/[\s_-]+/g, '-'),
        sku: `MKH${String(i + 1).padStart(4, '0')}`,
        description: `Beautiful handcrafted ${p.name}. Made with premium ${p.material} fabric, perfect for traditional and festive occasions. Each piece is uniquely woven by skilled artisans preserving the rich heritage of Indian handlooms.`,
        shortDescription: `Premium ${p.fabric} - Handcrafted with love`,
        category: cat._id,
        subcategory: sub?._id,
        offerPrice: Math.round(p.mrp - (p.mrp * p.discount / 100)),
        images: [{
          url: [
            'https://images.unsplash.com/photo-1610030469983-98e550d6193c?w=600&q=80',
            'https://images.unsplash.com/photo-1594633312681-425c7b97ccd1?w=600&q=80',
            'https://images.unsplash.com/photo-1617627143750-d86bc21e42bb?w=600&q=80',
            'https://images.unsplash.com/photo-1583391733956-3750e0ff4e8b?w=600&q=80',
          ][i % 4],
          alt: p.name,
        }],
        sizes: ['Free Size'],
        colors: [{ name: 'Natural', hex: '#F5F0E8' }, { name: 'Maroon', hex: '#800020' }],
        status: 'active',
        shippingCharges: 0,
        specifications: [
          { label: 'Fabric', value: p.fabric },
          { label: 'Material', value: p.material },
          { label: 'Care', value: 'Dry clean recommended' },
        ],
      });
    }
    console.log('✅ Sample products seeded');

    await Coupon.create({
      code: 'WELCOME10',
      description: 'Welcome discount for new customers',
      discountType: 'percentage',
      discountValue: 10,
      minOrderAmount: 500,
      maxDiscount: 500,
      usageLimit: 1000,
      validUntil: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),
    });
    console.log('✅ Coupons seeded');

    console.log('\n🎉 Database seeded successfully!');
    console.log(`Admin Login: ${admin.email} / ${process.env.ADMIN_PASSWORD || 'Admin@123456'}`);
    process.exit(0);
  } catch (error) {
    console.error('Seed error:', error);
    process.exit(1);
  }
};

seed();
