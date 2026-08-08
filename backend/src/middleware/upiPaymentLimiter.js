const rateLimit = require('express-rate-limit');

/** Stricter rate limit for UTR / UPI payment confirmation */
const upiPaymentLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: 'Too many payment confirmation attempts. Please wait and try again.',
  },
});

module.exports = upiPaymentLimiter;
