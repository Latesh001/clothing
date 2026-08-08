const crypto = require('crypto');

/** Common fake / placeholder UTRs to reject */
const BLOCKED_UTRS = new Set([
  '000000000000',
  '111111111111',
  '123456789012',
  '999999999999',
  '012345678901',
  'ABCDEFGHIJKL',
  'XXXXXXXXXXXX',
  'TESTTESTTEST',
  'PAYMENTSUCCESS',
]);

/**
 * Normalize UPI UTR / transaction reference.
 * Indian bank UTRs are typically 12-digit; some apps show alphanumeric refs.
 */
exports.normalizeUtr = (raw) => {
  if (raw == null) return '';
  return String(raw)
    .trim()
    .toUpperCase()
    .replace(/[\s\-_.]/g, '');
};

/**
 * Validate UTR / UPI transaction ID format and basic fraud heuristics.
 * @returns {{ ok: true, utr: string } | { ok: false, message: string }}
 */
exports.validateUtr = (raw) => {
  const utr = exports.normalizeUtr(raw);

  if (!utr) {
    return { ok: false, message: 'UPI transaction / UTR ID is required' };
  }

  if (utr.length < 12 || utr.length > 22) {
    return {
      ok: false,
      message: 'Enter a valid UTR / UPI reference (12–22 characters from your payment app)',
    };
  }

  // Digits only (classic UTR/RRN) OR alphanumeric (some UPI refs)
  if (!/^[0-9]{12}$/.test(utr) && !/^[A-Z0-9]{12,22}$/.test(utr)) {
    return {
      ok: false,
      message: 'UTR must be 12 digits, or 12–22 letters/numbers from your UPI app',
    };
  }

  if (BLOCKED_UTRS.has(utr)) {
    return { ok: false, message: 'This UTR looks invalid. Please enter the real transaction ID from your bank/UPI app.' };
  }

  // Reject all same character (000000000000 already blocked; catch others)
  if (/^(.)\1+$/.test(utr)) {
    return { ok: false, message: 'Invalid UTR pattern. Please copy the exact ID from your payment receipt.' };
  }

  // Reject simple ascending/descending digit runs
  if (/^(?:012345678901|123456789012|234567890123|987654321098|098765432109)$/.test(utr)) {
    return { ok: false, message: 'Invalid UTR pattern. Please use the real transaction reference.' };
  }

  // Mostly digits preferred for security (at least 8 digits in the string)
  const digitCount = (utr.match(/\d/g) || []).length;
  if (digitCount < 8) {
    return {
      ok: false,
      message: 'UTR must contain enough digits from your bank/UPI receipt',
    };
  }

  return { ok: true, utr };
};

/** SHA-256 hash for secure storage / uniqueness without exposing raw UTR in logs */
exports.hashUtr = (utr) =>
  crypto.createHash('sha256').update(`mkh-upi:${utr}`).digest('hex');

/**
 * Create a short HMAC token bound to order + amount (anti-tamper for QR flow).
 */
exports.createPaymentToken = (orderId, orderNumber, amount) => {
  const secret = process.env.JWT_SECRET || 'khadi-upi-secret';
  const payload = `${orderId}|${orderNumber}|${Number(amount).toFixed(2)}`;
  return crypto.createHmac('sha256', secret).update(payload).digest('hex').slice(0, 32);
};

exports.verifyPaymentToken = (token, orderId, orderNumber, amount) => {
  if (!token) return false;
  const expected = exports.createPaymentToken(orderId, orderNumber, amount);
  try {
    return crypto.timingSafeEqual(Buffer.from(String(token)), Buffer.from(expected));
  } catch {
    return false;
  }
};

/** Max customer UTR submit attempts per order before lock */
exports.MAX_UTR_ATTEMPTS = Number(process.env.UPI_MAX_UTR_ATTEMPTS) || 5;
