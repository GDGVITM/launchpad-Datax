const mongoose = require('mongoose');
const config = require('./index');

/**
 * Database connection configuration and management
 * Supports MongoDB with Mongoose ODM
 */
class DatabaseConnection {
  constructor() {
    this.connection = null;
    this.mockMode = false;
  }

  /**
   * Connect to MongoDB database
   * @returns {Promise<mongoose.Connection>}
   */
  async connect() {
    try {
      // Check if using mock database
      if (config.MONGODB_URI.startsWith('mock://') || process.env.USE_MOCK_DB === 'true') {
        console.log('🎭 Using mock database for development...');
        this.mockMode = true;
        return this.setupMockConnection();
      }

      const mongooseOptions = {
        useNewUrlParser: true,
        useUnifiedTopology: true,
        maxPoolSize: 10, // Maintain up to 10 socket connections
        serverSelectionTimeoutMS: 10000, // Keep trying to send operations for 10 seconds
        socketTimeoutMS: 45000, // Close sockets after 45 seconds of inactivity
        connectTimeoutMS: 10000, // Give up initial connection after 10 seconds
        // Removed deprecated options: bufferMaxEntries and bufferCommands
      };

      // Use test database if in test environment
      const connectionString = config.IS_TEST ? config.MONGODB_TEST_URI : config.MONGODB_URI;
      
      this.connection = await mongoose.connect(connectionString, mongooseOptions);
      
      console.log(`✅ MongoDB connected successfully to: ${connectionString}`);
      
      // Handle connection events
      mongoose.connection.on('error', (err) => {
        console.error('❌ MongoDB connection error:', err);
      });

      mongoose.connection.on('disconnected', () => {
        console.warn('⚠️ MongoDB disconnected');
      });

      mongoose.connection.on('reconnected', () => {
        console.log('🔄 MongoDB reconnected');
      });

      return this.connection;
    } catch (error) {
      console.error('❌ MongoDB connection failed:', error.message);
      console.warn('⚠️ Continuing without database connection for development...');
      // Don't exit the process, allow the app to continue running
      // process.exit(1);
      return null;
    }
  }

  /**
   * Setup mock database connection for development
   * @returns {Object} Mock connection object
   */
  setupMockConnection() {
    console.log('✅ Mock database connected successfully');
    this.connection = {
      readyState: 1, // Connected state
      name: 'cybersecurity_saas_mock'
    };
    return this.connection;
  }

  /**
   * Disconnect from MongoDB database
   * @returns {Promise<void>}
   */
  async disconnect() {
    try {
      if (this.connection) {
        await mongoose.disconnect();
        console.log('📴 MongoDB disconnected successfully');
      }
    } catch (error) {
      console.error('❌ Error disconnecting from MongoDB:', error.message);
    }
  }

  /**
   * Get current connection status
   * @returns {string} Connection status
   */
  getConnectionStatus() {
    const states = {
      0: 'disconnected',
      1: 'connected',
      2: 'connecting',
      3: 'disconnecting'
    };
    return states[mongoose.connection.readyState] || 'unknown';
  }

  /**
   * Clear database (useful for testing)
   * @returns {Promise<void>}
   */
  async clearDatabase() {
    if (config.IS_TEST) {
      const collections = mongoose.connection.collections;
      for (const key in collections) {
        const collection = collections[key];
        await collection.deleteMany({});
      }
      console.log('🧹 Test database cleared');
    } else {
      throw new Error('Database clearing is only allowed in test environment');
    }
  }

  /**
   * Health check for database connection
   * @returns {Promise<boolean>}
   */
  async healthCheck() {
    try {
      if (mongoose.connection.readyState === 1) {
        await mongoose.connection.db.admin().ping();
        return true;
      }
      return false;
    } catch (error) {
      console.error('❌ Database health check failed:', error.message);
      return false;
    }
  }
}

// Create singleton instance
const database = new DatabaseConnection();

module.exports = database;
