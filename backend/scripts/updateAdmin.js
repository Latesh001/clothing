require('dotenv').config();
const mongoose = require('mongoose');
const Admin = require('../src/models/Admin');

(async () => {
  await mongoose.connect(process.env.MONGODB_URI);

  const email = (process.env.ADMIN_EMAIL || 'latesh169@gmail.com').toLowerCase().trim();
  const password = process.env.ADMIN_PASSWORD || 'Latesh@8074';

  let admin = await Admin.findOne({ email: 'admin@manikantakhadi.com' }).select('+password');
  if (!admin) {
    admin = await Admin.findOne().select('+password');
  }

  if (admin) {
    admin.email = email;
    admin.password = password;
    admin.isActive = true;
    if (!admin.role) admin.role = 'superadmin';
    await admin.save();
    console.log('Updated admin:', admin.email);
  } else {
    admin = await Admin.create({
      name: 'Super Admin',
      email,
      password,
      role: 'superadmin',
      permissions: ['products', 'orders', 'customers', 'analytics', 'coupons', 'settings'],
    });
    console.log('Created admin:', admin.email);
  }

  const removed = await Admin.deleteMany({ email: { $ne: email } });
  console.log('Removed other admins:', removed.deletedCount);

  await mongoose.disconnect();
})().catch((err) => {
  console.error(err);
  process.exit(1);
});
