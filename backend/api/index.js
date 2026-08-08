/**
 * Vercel serverless entry — exports the Express app.
 * Railway / local still use server.js with app.listen().
 */
require('dotenv').config();
const app = require('../src/app');
const connectDB = require('../src/config/database');

let ready;
const ensureDb = async () => {
  if (!ready) {
    ready = connectDB().catch((err) => {
      ready = null;
      throw err;
    });
  }
  await ready;
};

module.exports = async (req, res) => {
  await ensureDb();
  return app(req, res);
};
