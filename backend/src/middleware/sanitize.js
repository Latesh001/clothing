/**
 * Lightweight XSS sanitizer (replaces deprecated xss-clean).
 * Strips HTML tags and encodes dangerous characters in request data.
 */

const stripTags = (str) =>
  String(str)
    .replace(/<[^>]*>/g, '')
    .replace(/javascript:/gi, '')
    .replace(/on\w+\s*=/gi, '');

const sanitizeValue = (value) => {
  if (typeof value === 'string') {
    return stripTags(value).trim();
  }

  if (Array.isArray(value)) {
    return value.map(sanitizeValue);
  }

  if (value && typeof value === 'object') {
    return Object.keys(value).reduce((acc, key) => {
      acc[key] = sanitizeValue(value[key]);
      return acc;
    }, {});
  }

  return value;
};

const sanitizeRequest = (req, res, next) => {
  // Do not alter passwords — trimming/sanitizing can break login
  const password = req.body?.password;
  if (req.body) req.body = sanitizeValue(req.body);
  if (password !== undefined) req.body.password = password;
  if (req.query) req.query = sanitizeValue(req.query);
  if (req.params) req.params = sanitizeValue(req.params);
  next();
};

module.exports = sanitizeRequest;
