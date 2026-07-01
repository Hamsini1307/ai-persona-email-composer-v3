const mongoose = require("mongoose");

/**
 * Establishes a connection to MongoDB using the URI provided in the
 * environment. Fails fast and loudly if the connection cannot be made,
 * since the rest of the app cannot function without persistence.
 */
async function connectDB() {
  const uri = process.env.MONGO_URI;

  if (!uri) {
    console.error("MONGO_URI is not set. Please define it in your .env file.");
    process.exit(1);
  }

  try {
    await mongoose.connect(uri);
    console.log(`MongoDB connected: ${mongoose.connection.host}/${mongoose.connection.name}`);
  } catch (err) {
    console.error("MongoDB connection failed:", err.message);
    process.exit(1);
  }
}

module.exports = connectDB;
