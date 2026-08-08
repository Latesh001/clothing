/**
 * Set shipping charges to 0 on all products and existing orders.
 * Run: node scripts/setFreeShipping.js
 */
require('dotenv').config();
const mongoose = require('mongoose');
const Product = require('../src/models/Product');
const Order = require('../src/models/Order');

(async () => {
  await mongoose.connect(process.env.MONGODB_URI);
  const products = await Product.updateMany({}, { $set: { shippingCharges: 0 } });
  const orders = await Order.updateMany({}, { $set: { shippingCharges: 0 } });
  console.log(`Products updated: ${products.modifiedCount}`);
  console.log(`Orders updated: ${orders.modifiedCount}`);
  await mongoose.disconnect();
})().catch((err) => {
  console.error(err);
  process.exit(1);
});
