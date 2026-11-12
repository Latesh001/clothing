const { v4: uuidv4 } = require('uuid');
const User = require('../models/User');
const { sendWelcomeEmail, sendOTPEmail } = require('../services/emailService');
const {
  checkLoginAllowed,
  recordLoginFailure,
  clearLoginFailures,
} = require('../middleware/securityGuards');

const generateOTP = () => Math.floor(100000 + Math.random() * 900000).toString();

const clientIp = (req) =>
  req.headers['x-forwarded-for']?.toString().split(',')[0]?.trim() ||
  req.ip ||
  req.socket?.remoteAddress ||
  '';

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

const queueWelcome = (user) => {
  setImmediate(() => sendWelcomeEmail(user).catch((err) => console.error('Welcome email:', err.message)));
};

/** Public registration disabled — first login creates the account */
exports.register = async (req, res) => {
  return res.status(410).json({
    success: false,
    message: 'Registration page is closed. Please use Login with email and password.',
  });
};

const normalizePhone = (phone = '') => String(phone).replace(/\D/g, '');

exports.login = async (req, res, next) => {
  try {
    const email = (req.body.email || '').toLowerCase().trim();
    const phoneRaw = (req.body.phone || '').trim();
    const phone = normalizePhone(phoneRaw);
    const password = req.body.password;
    const ip = clientIp(req);

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Please enter email and password.',
      });
    }

    if (password.length < 6) {
      return res.status(400).json({
        success: false,
        message: 'Password must be at least 6 characters.',
      });
    }

    if (phone && (phone.length < 8 || phone.length > 15)) {
      return res.status(400).json({
        success: false,
        message: 'Please enter a valid phone number (8–15 digits).',
      });
    }

    const lock = checkLoginAllowed(email, ip);
    if (!lock.allowed) {
      return res.status(429).json({ success: false, message: lock.message });
    }

    // Prefer email match. Phone is optional.
    let user = await User.findOne({ email }).select('+password');

    if (!user && phone) {
      user = await User.findOne({
        $or: [
          { phone: phoneRaw },
          { phone },
          { phone: `+91${phone}` },
          ...(phone.length === 10 ? [{ phone: `91${phone}` }] : []),
        ],
      }).select('+password');
    }

    // New customer — create account on first login (no separate register page)
    if (!user) {
      user = await User.create({
        name: email.split('@')[0],
        email,
        ...(phone ? { phone } : {}),
        password,
        isVerified: true,
        referralCode: uuidv4().slice(0, 8).toUpperCase(),
        lastLogin: new Date(),
      });
      clearLoginFailures(email, ip);
      sendTokenResponse(user, 201, res, 'Welcome to Manikanta Khadi & Handlooms!');
      queueWelcome(user);
      return;
    }

    if (user.isActive === false) {
      return res.status(403).json({
        success: false,
        message: 'This account has been deactivated. Please contact support.',
      });
    }

    // Google/OTP account without password — set password on first form login
    if (!user.password) {
      user.password = password;
      if (!user.email) user.email = email;
      if (phone && !user.phone) user.phone = phone;
      user.isVerified = true;
      user.lastLogin = new Date();
      await user.save();
      clearLoginFailures(email, ip);
      sendTokenResponse(user, 200, res, 'Welcome to Manikanta Khadi & Handlooms!');
      queueWelcome(user);
      return;
    }

    const passwordOk = await user.comparePassword(password);
    if (!passwordOk) {
      recordLoginFailure(email, ip);
      return res.status(401).json({
        success: false,
        message: 'Incorrect password. Please try again.',
      });
    }

    if (phone && !user.phone) user.phone = phone;
    user.lastLogin = new Date();
    await user.save();
    clearLoginFailures(email, ip);
    sendTokenResponse(user, 200, res, 'Welcome back! Happy shopping.');
    queueWelcome(user);
    return;
  } catch (error) {
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
    const email = String(req.body.email || '').toLowerCase().trim();
    const phone = String(req.body.phone || '').trim();
    const { type = 'login' } = req.body;
    if (!email && !phone) {
      return res.status(400).json({ success: false, message: 'Email is required to request a verification code.' });
    }
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
    const email = String(req.body.email || '').toLowerCase().trim();
    const phone = String(req.body.phone || '').trim();
    const otp = String(req.body.otp || '').trim();
    if (!email && !phone) {
      return res.status(400).json({ success: false, message: 'Email is required to verify the code.' });
    }
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

    sendTokenResponse(user, 200, res, 'Welcome to Manikanta Khadi & Handlooms!');
    if (user.email) queueWelcome(user);
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

    sendTokenResponse(user, 200, res, 'Welcome to Manikanta Khadi & Handlooms!');
    queueWelcome(user);
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
