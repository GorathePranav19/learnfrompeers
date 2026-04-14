const mongoose = require('mongoose');

let mongoServer;

const connectDB = async () => {
  try {
    const useMemory = process.env.USE_MEMORY_DB === 'true' || process.env.NODE_ENV === 'test';
    let mongoUri;

    if (mongoose.connection.readyState >= 1) {
      return mongoose.connection;
    }

    if (useMemory) {
      const { MongoMemoryServer } = require('mongodb-memory-server');
      mongoServer = await MongoMemoryServer.create();
      mongoUri = mongoServer.getUri();    } else {
      // Real MongoDB for production/persistent data
      mongoUri = process.env.MONGO_URI || process.env.MONGODB_URI;
      if (!mongoUri) {
        console.error('❌ MONGO_URI not set. Set USE_MEMORY_DB=true for dev or provide MONGO_URI.');
        throw new Error('MONGO_URI not set');
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
    // DO NOT process.exit(1) in Serverless environments
    throw error;
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
