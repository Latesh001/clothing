const mongoose = require('mongoose');

const connectDB = async () => {
  try {
    const uri = process.env.MONGODB_URI || 'mongodb://localhost:27017/manikanta_khadi';

    // Pool sized for ~100 concurrent customers + admin traffic
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
  } catch (error) {
    console.error('❌ MongoDB connection error:', error.message);
    // Don't kill the process on serverless platforms (Vercel); let the request fail instead
    if (process.env.VERCEL) {
      throw error;
    }
    process.exit(1);
  }
};

module.exports = connectDB;
