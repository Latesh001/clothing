require('dotenv').config();
const app = require('./src/app');
const connectDB = require('./src/config/database');

const PORT = process.env.PORT || 5000;

const start = async () => {
  // Wait for MongoDB before accepting traffic — prevents "Login failed" on first request
  await connectDB();

  const server = app.listen(PORT, () => {
    console.log(`🚀 Server running on port ${PORT} in ${process.env.NODE_ENV || 'development'} mode`);
  });

  server.on('error', (err) => {
    if (err.code === 'EADDRINUSE') {
      console.error(`❌ Port ${PORT} is already in use. Stop the other process, then restart:`);
      console.error(`   Get-NetTCPConnection -LocalPort ${PORT} | % { Stop-Process -Id $_.OwningProcess -Force }`);
      process.exit(1);
    }
    throw err;
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
};

start().catch((err) => {
  console.error('Failed to start server:', err.message);
  process.exit(1);
});
