const jwt = require('jsonwebtoken');
const { v4: uuidv4 } = require('uuid');
const User = require('../models/User');
const { sendWelcomeEmail, sendOTPEmail } = require('../services/emailService');

const generateOTP = () => Math.floor(100000 + Math.random() * 900000).toString();

const sendTokenResponse = (user, statusCode, res, message) => {
  const token = user.generateAuthToken();
  res.status(statusCode).json({
    success: true,
    message,
    token,
    user: {
      id: user._id,
      name: user.name,
      email: user.email,
      phone: user.phone,
      role: user.role,
      avatar: user.avatar,
      isVerified: user.isVerified,
    },
  });
};

exports.register = async (req, res, next) => {
  try {
    const { name, email, phone, password } = req.body;
    const existing = await User.findOne({ $or: [{ email }, ...(phone ? [{ phone }] : [])] });
    if (existing) {
      return res.status(400).json({ success: false, message: 'User already exists with this email or phone.' });
    }

    const user = await User.create({
      name,
      email,
      phone,
      password,
      referralCode: uuidv4().slice(0, 8).toUpperCase(),
    });

    sendTokenResponse(user, 201, res, 'Registration successful');
  } catch (error) {
    next(error);
  }
};

const normalizePhone = (phone = '') => String(phone).replace(/\D/g, '');

exports.login = async (req, res, next) => {
  try {
    const email = (req.body.email || '').toLowerCase().trim();
    const phoneRaw = (req.body.phone || '').trim();
    const phone = normalizePhone(phoneRaw);
    const password = req.body.password;

    if (!email || !phone || !password) {
      return res.status(400).json({
        success: false,
        message: 'Please enter phone number, email, and password.',
      });
    }

    // Accept any phone number (8–15 digits), not a fixed number
    if (phone.length < 8 || phone.length > 15) {
      return res.status(400).json({
        success: false,
        message: 'Please enter a valid phone number.',
      });
    }

    if (password.length < 6) {
      return res.status(400).json({
        success: false,
        message: 'Password must be at least 6 characters.',
      });
    }

    // Find by email and phone separately to avoid wrong-user match
    const [byEmail, byPhone] = await Promise.all([
      User.findOne({ email }).select('+password'),
      User.findOne({
        $or: [
          { phone: phoneRaw },
          { phone },
          { phone: `+91${phone}` },
          ...(phone.length === 10 ? [{ phone: `91${phone}` }] : []),
        ],
      }).select('+password'),
    ]);

    if (byEmail && byPhone && String(byEmail._id) !== String(byPhone._id)) {
      return res.status(400).json({
        success: false,
        message: 'This email and phone belong to different accounts. Use the matching pair.',
      });
    }

    let user = byEmail || byPhone;

    // New customer — create account
    if (!user) {
      user = await User.create({
        name: email.split('@')[0],
        email,
        phone,
        password,
        isVerified: true,
        referralCode: uuidv4().slice(0, 8).toUpperCase(),
      });
      user.lastLogin = new Date();
      await user.save();
      sendWelcomeEmail(user).catch(() => {});
      return sendTokenResponse(user, 201, res, 'Welcome! Your account is ready.');
    }

    // Existing Google/OTP account without password — set password on first form login
    if (!user.password) {
      user.password = password;
      user.email = user.email || email;
      user.phone = user.phone || phone;
      user.isVerified = true;
      user.lastLogin = new Date();
      await user.save();
      sendWelcomeEmail(user).catch(() => {});
      return sendTokenResponse(user, 200, res, 'Login successful');
    }

    const passwordOk = await user.comparePassword(password);
    if (!passwordOk) {
      return res.status(401).json({
        success: false,
        message: 'Incorrect password. Please try again.',
      });
    }

    // Sync missing fields
    if (!user.email) user.email = email;
    if (!user.phone) user.phone = phone;
    user.lastLogin = new Date();
    await user.save();
    sendWelcomeEmail(user).catch(() => {});
    return sendTokenResponse(user, 200, res, 'Login successful');
  } catch (error) {
    // Duplicate key (email/phone already taken with race condition)
    if (error.code === 11000) {
      return res.status(400).json({
        success: false,
        message: 'An account with this email or phone already exists. Check your password.',
      });
    }
    next(error);
  }
};

exports.sendOTP = async (req, res, next) => {
  try {
    const { email, phone, type = 'login' } = req.body;
    const query = email ? { email } : { phone };
    let user = await User.findOne(query);

    if (!user && phone) {
      user = await User.create({
        name: 'Customer',
        phone,
        referralCode: uuidv4().slice(0, 8).toUpperCase(),
      });
    }

    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found. Please register first.' });
    }

    const otp = generateOTP();
    user.otp = {
      code: otp,
      expiresAt: new Date(Date.now() + (parseInt(process.env.OTP_EXPIRE_MINUTES) || 10) * 60000),
      type,
    };
    await user.save();

    if (email) await sendOTPEmail(user, otp);

    res.json({
      success: true,
      message: `OTP sent to your ${email ? 'email' : 'phone'}`,
      ...(process.env.NODE_ENV === 'development' && { otp }),
    });
  } catch (error) {
    next(error);
  }
};

exports.verifyOTP = async (req, res, next) => {
  try {
    const { email, phone, otp } = req.body;
    const query = email ? { email } : { phone };
    const user = await User.findOne(query);

    if (!user || !user.otp?.code) {
      return res.status(400).json({ success: false, message: 'Invalid OTP request.' });
    }

    if (user.otp.expiresAt < new Date()) {
      return res.status(400).json({ success: false, message: 'OTP has expired.' });
    }

    if (user.otp.code !== otp) {
      return res.status(400).json({ success: false, message: 'Invalid OTP.' });
    }

    user.isVerified = true;
    user.otp = undefined;
    user.lastLogin = new Date();
    await user.save();

    if (user.email) await sendWelcomeEmail(user);
    sendTokenResponse(user, 200, res, 'OTP verified successfully');
  } catch (error) {
    next(error);
  }
};

exports.googleLogin = async (req, res, next) => {
  try {
    const { googleId, email, name, avatar } = req.body;
    let user = await User.findOne({ $or: [{ googleId }, { email }] });

    if (!user) {
      user = await User.create({
        googleId,
        email,
        name,
        avatar,
        isVerified: true,
        referralCode: uuidv4().slice(0, 8).toUpperCase(),
      });
    } else {
      user.googleId = googleId;
      user.lastLogin = new Date();
      await user.save();
    }

    await sendWelcomeEmail(user);
    sendTokenResponse(user, 200, res, 'Google login successful');
  } catch (error) {
    next(error);
  }
};

exports.getProfile = async (req, res, next) => {
  try {
    const user = await User.findById(req.user.id);
    res.json({ success: true, user });
  } catch (error) {
    next(error);
  }
};

exports.updateProfile = async (req, res, next) => {
  try {
    const allowed = ['name', 'email', 'phone', 'avatar', 'preferences'];
    const updates = {};
    allowed.forEach(field => { if (req.body[field] !== undefined) updates[field] = req.body[field]; });

    const user = await User.findByIdAndUpdate(req.user.id, updates, { new: true, runValidators: true });
    res.json({ success: true, message: 'Profile updated', user });
  } catch (error) {
    next(error);
  }
};

exports.addAddress = async (req, res, next) => {
  try {
    const user = await User.findById(req.user.id);
    if (req.body.isDefault) {
      user.addresses.forEach(addr => { addr.isDefault = false; });
    }
    user.addresses.push(req.body);
    await user.save();
    res.json({ success: true, message: 'Address added', addresses: user.addresses });
  } catch (error) {
    next(error);
  }
};

exports.updateAddress = async (req, res, next) => {
  try {
    const user = await User.findById(req.user.id);
    const address = user.addresses.id(req.params.addressId);
    if (!address) return res.status(404).json({ success: false, message: 'Address not found' });

    Object.assign(address, req.body);
    await user.save();
    res.json({ success: true, message: 'Address updated', addresses: user.addresses });
  } catch (error) {
    next(error);
  }
};

exports.deleteAddress = async (req, res, next) => {
  try {
    const user = await User.findById(req.user.id);
    user.addresses.pull(req.params.addressId);
    await user.save();
    res.json({ success: true, message: 'Address deleted', addresses: user.addresses });
  } catch (error) {
    next(error);
  }
};

exports.logout = (req, res) => {
  res.json({ success: true, message: 'Logged out successfully' });
};
