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

// Security headers
app.use(helmet({
  crossOriginResourcePolicy: { policy: 'cross-origin' },
}));

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

// CORS
app.use(cors({
  origin: process.env.CLIENT_URL || 'http://localhost:5173',
  credentials: true,
  maxAge: 86400,
}));

// Health check (no heavy work)
app.get('/api/health', (req, res) => {
  res.json({
    success: true,
    message: 'Manikanta Khadi API is running',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
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
