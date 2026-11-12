const path = require('path');
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const compression = require('compression');
const cookieParser = require('cookie-parser');
const mongoSanitize = require('express-mongo-sanitize');

const sanitizeRequest = require('./middleware/sanitize');
const errorHandler = require('./middleware/errorHandler');
const { apiLimiter, authLimiter } = require('./middleware/authLimiter');
const routes = require('./routes');

const app = express();

// Needed behind proxies (Railway/Render/Vercel) for correct IPs & rate limits
app.set('trust proxy', 1);

// Security headers (login → payment → delivery surface)
app.use(helmet({
  crossOriginResourcePolicy: { policy: 'cross-origin' },
  contentSecurityPolicy: false, // API-only; frontend hosts its own CSP
  referrerPolicy: { policy: 'no-referrer' },
  hsts: process.env.NODE_ENV === 'production' ? { maxAge: 15552000, includeSubDomains: true } : false,
}));

// Do not advertise Express
app.disable('x-powered-by');

// Compress responses for faster loads under load
app.use(compression());

// Generous API rate limit for browsing; auth routes get a dedicated limiter in routes
app.use('/api/', apiLimiter);

// Cache static uploads briefly to reduce disk pressure
app.use('/uploads', express.static(path.join(__dirname, '../uploads'), {
  maxAge: '7d',
  etag: true,
  lastModified: true,
}));

// Body parsing
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(cookieParser());

// Sanitize after body is parsed
app.use(mongoSanitize());
app.use(sanitizeRequest);

// CORS — CLIENT_URL plus optional comma-separated ALLOWED_ORIGINS
const allowedOrigins = [
  process.env.CLIENT_URL || 'http://localhost:5173',
  ...(process.env.ALLOWED_ORIGINS || '')
    .split(',')
    .map((o) => o.trim())
    .filter(Boolean),
];

app.use(cors({
  origin(origin, callback) {
    // Allow non-browser clients (no Origin) and configured frontends
    if (!origin || allowedOrigins.includes(origin)) {
      return callback(null, true);
    }
    return callback(new Error(`CORS blocked for origin: ${origin}`));
  },
  credentials: true,
  maxAge: 86400,
}));

// Health check (no heavy work) — reports DB state without failing the process
app.get('/api/health', (req, res) => {
  const mongoose = require('mongoose');
  const dbState = ['disconnected', 'connected', 'connecting', 'disconnecting'][mongoose.connection.readyState] || 'unknown';
  res.json({
    success: true,
    message: 'Manikanta Khadi API is running',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    database: dbState,
  });
});

// Expose auth limiter for route mounting
app.locals.authLimiter = authLimiter;

// API routes
app.use('/api', routes);

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({ success: false, message: 'Route not found' });
});

// Global error handler
app.use(errorHandler);

module.exports = app;
