const mongoose = require('mongoose');

const connectDB = async () => {
  const uri = process.env.MONGODB_URI || 'mongodb://localhost:27017/manikanta_khadi';

  // Fail fast instead of buffering queries for 10s while disconnected
  mongoose.set('bufferCommands', false);

  const conn = await mongoose.connect(uri, {
    maxPoolSize: Number(process.env.MONGO_POOL_SIZE) || 50,
    minPoolSize: Number(process.env.MONGO_MIN_POOL) || 5,
    serverSelectionTimeoutMS: 10000,
    socketTimeoutMS: 45000,
    maxIdleTimeMS: 60000,
  });

  mongoose.connection.on('error', (err) => {
    console.error('MongoDB connection error:', err.message);
  });

  mongoose.connection.on('disconnected', () => {
    console.warn('MongoDB disconnected — waiting for reconnect...');
  });

  console.log(`✅ MongoDB Connected: ${conn.connection.host} (pool ${conn.connection?.client?.s?.options?.maxPoolSize || 50})`);
  return conn;
};

module.exports = connectDB;
