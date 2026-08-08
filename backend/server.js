require('dotenv').config();
const app = require('./src/app');
const connectDB = require('./src/config/database');

const PORT = process.env.PORT || 5000;

connectDB();

const server = app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT} in ${process.env.NODE_ENV || 'development'} mode`);
});

// Keep connections healthy under concurrent load (~100 users)
server.keepAliveTimeout = 65000;
server.headersTimeout = 66000;
server.requestTimeout = 120000;
server.maxHeadersCount = 100;

process.on('unhandledRejection', (err) => {
  console.error('Unhandled Rejection:', err.message);
  server.close(() => process.exit(1));
});

process.on('SIGTERM', () => {
  console.log('SIGTERM received — shutting down gracefully');
  server.close(() => console.log('Process terminated'));
});

process.on('SIGINT', () => {
  server.close(() => process.exit(0));
});
