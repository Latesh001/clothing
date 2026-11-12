/**
 * Lightweight in-memory lockout for brute-force protection.
 * Survives within a single Node process; complements auth rate limiter.
 */

const FAIL_LIMIT = parseInt(process.env.LOGIN_FAIL_LIMIT || '8', 10);
const LOCK_MS = parseInt(process.env.LOGIN_LOCK_MINUTES || '15', 10) * 60 * 1000;

const store = new Map();

const keyFor = (email = '', ip = '') =>
  `${String(email).toLowerCase().trim()}|${ip || 'unknown'}`;

exports.checkLoginAllowed = (email, ip) => {
  const key = keyFor(email, ip);
  const entry = store.get(key);
  if (!entry) return { allowed: true };
  if (entry.lockedUntil && entry.lockedUntil > Date.now()) {
    const mins = Math.ceil((entry.lockedUntil - Date.now()) / 60000);
    return {
      allowed: false,
      message: `Too many failed login attempts. Try again in ${mins} minute${mins === 1 ? '' : 's'}.`,
    };
  }
  if (entry.lockedUntil && entry.lockedUntil <= Date.now()) {
    store.delete(key);
  }
  return { allowed: true };
};

exports.recordLoginFailure = (email, ip) => {
  const key = keyFor(email, ip);
  const entry = store.get(key) || { fails: 0 };
  entry.fails += 1;
  if (entry.fails >= FAIL_LIMIT) {
    entry.lockedUntil = Date.now() + LOCK_MS;
    entry.fails = 0;
  }
  store.set(key, entry);
};

exports.clearLoginFailures = (email, ip) => {
  store.delete(keyFor(email, ip));
};

/**
 * Status guards that keep existing admin dropdowns working,
 * while blocking unsafe reverse moves after delivery / cancel.
 */
exports.canTransitionOrderStatus = (from, to) => {
  if (!from || !to) return false;
  if (from === to) return true;
  // Delivered orders can only move to returned
  if (from === 'delivered' && to !== 'returned') return false;
  // Cancelled / returned stay closed
  if (from === 'cancelled' || from === 'returned') return false;
  return true;
};
