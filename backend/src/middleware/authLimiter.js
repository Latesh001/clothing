const rateLimit = require('express-rate-limit');

/** Auth endpoints: enough for many users, protects against brute force */
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 40,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: 'Too many login attempts. Please wait a few minutes and try again.',
  },
});

/** Stricter limit for admin login */
const adminAuthLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: 'Too many admin login attempts. Please wait and try again.',
  },
});

/** General API: supports ~100 concurrent shoppers browsing/buying */
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 2000,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: 'High traffic right now. Please try again in a moment.',
  },
});

module.exports = { authLimiter, adminAuthLimiter, apiLimiter };
