const mongoose = require('mongoose');

let mongoServer;

const connectDB = async () => {
  try {
    const useMemory = process.env.USE_MEMORY_DB === 'true' || process.env.NODE_ENV === 'test';
    let mongoUri;

    if (useMemory) {
      // In-memory MongoDB for dev/testing (no external MongoDB needed)
      const { MongoMemoryServer } = require('mongodb-memory-server');
      mongoServer = await MongoMemoryServer.create();
      mongoUri = mongoServer.getUri();
      console.log('📦 Using in-memory MongoDB');
    } else {
      // Real MongoDB for production/persistent data
      mongoUri = process.env.MONGO_URI;
      if (!mongoUri) {
        console.error('❌ MONGO_URI not set. Set USE_MEMORY_DB=true for dev or provide MONGO_URI.');
        process.exit(1);
      }
      console.log('📦 Connecting to MongoDB...');
    }

    const conn = await mongoose.connect(mongoUri);
    console.log(`✅ MongoDB Connected: ${conn.connection.host}`);

    // Auto-seed when using in-memory DB (data resets each restart)
    if (useMemory) {
      const seedDB = require('../utils/seed');
      await seedDB();
    }

    return conn;
  } catch (error) {
    console.error(`❌ MongoDB Connection Error: ${error.message}`);
    process.exit(1);
  }
};

/**
 * Gracefully close the MongoDB connection.
 */
const disconnectDB = async () => {
  try {
    await mongoose.connection.close();
    if (mongoServer) {
      await mongoServer.stop();
    }
    console.log('🔌 MongoDB disconnected');
  } catch (error) {
    console.error('Error disconnecting MongoDB:', error.message);
  }
};

module.exports = { connectDB, disconnectDB };
