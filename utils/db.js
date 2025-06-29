import { MongoClient, ServerApiVersion } from 'mongodb';
import { config } from '../config.js';

/**
 * MongoDB Database Client
 *
 * A robust wrapper around the MongoDB driver that provides:
 * - Connection management with pooling
 * - Health monitoring
 * - Error handling and recovery
 * - Clean lifecycle management
 *
 * @example
 * const dbClient = new DBClient();
 * await dbClient.init();
 * const db = dbClient.getDb();
 * const collection = db.collection('users');
 * await dbClient.close();
 */
class DBClient {
  /**
   * Initialize a new database client instance
   *
   * Sets up the MongoDB connection with connection pooling and
   * server API configuration for optimal performance and reliability.
   */
  constructor() {
    // Database configuration from environment variables
    this.dbName = config.dbName;
    this.port = config.dbPort;
    this.host = config.dbHost;
    this.uri = config.dbUri;

    // Connection state tracking
    this.connected = false;

    // Initialize MongoDB client with connection pooling
    this.client = new MongoClient(this.uri, {
      serverApi: {
        version: ServerApiVersion.v1,
        strict: true,
        deprecationErrors: true,
      },
      // Connection pool settings for optimal performance
      maxPoolSize: 10, // Maximum number of connections in the pool
      minPoolSize: 2, // Minimum number of connections to maintain
      maxIdleTimeMS: 30000, // Close connections after 30 seconds of inactivity
    });
  }

  /**
   * Establish connection to MongoDB
   *
   * Attempts to connect to the MongoDB server and updates the connection state.
   * This method must be called before any database operations.
   *
   * @returns {Promise<DBClient>} Returns this instance for method chaining
   * @throws {Error} If connection fails
   *
   * @example
   * const dbClient = new DBClient();
   * await dbClient.init();
   */
  async init() {
    try {
      await this.client.connect();
      this.connected = true;
      console.log('✅ Connected to MongoDB successfully');
    } catch (error) {
      console.error('❌ Failed to connect to MongoDB:', error.message);
      throw error; // Re-throw to allow caller to handle the error
    }
    return this; // Return instance for method chaining
  }

  /**
   * Get the database instance
   *
   * Returns a database instance that can be used to access collections.
   * Throws an error if the client is not connected.
   *
   * @returns {Db} MongoDB database instance
   * @throws {Error} If database is not connected
   *
   * @example
   * const db = dbClient.getDb();
   * const usersCollection = db.collection('users');
   */
  getDb() {
    if (!this.connected) {
      throw new Error('Database not connected. Call init() first.');
    }
    return this.client.db(this.dbName);
  }

  /**
   * Check if the client is currently connected
   *
   * @returns {boolean} True if connected, false otherwise
   */
  isConnected() {
    return this.connected;
  }

  /**
   * Close the database connection
   *
   * Gracefully closes the MongoDB connection and updates the connection state.
   * This should be called when the application is shutting down.
   *
   * @example
   * await dbClient.close();
   */
  async close() {
    if (this.client) {
      await this.client.close();
      this.connected = false;
      console.log('🔌 MongoDB connection closed');
    }
  }

  /**
   * Perform a health check on the database connection
   *
   * Sends a lightweight ping command to verify the database is responsive.
   * If the health check fails, the connection state is updated to disconnected.
   *
   * @returns {Promise<boolean>} True if healthy, false if unhealthy or disconnected
   *
   * @example
   * const isHealthy = await dbClient.healthCheck();
   * if (isHealthy) {
   *   console.log('Database is healthy');
   * } else {
   *   console.log('Database is not responding');
   * }
   */
  async healthCheck() {
    try {
      // Check if we think we're connected
      if (!this.connected) return false;

      // Send a ping command to verify the connection is actually alive
      await this.client.db().admin().ping();
      return true;
    } catch (error) {
      // If ping fails, mark as disconnected
      this.connected = false;
      return false;
    }
  }
}

export default DBClient;
