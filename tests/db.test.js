import { jest } from '@jest/globals';
import DBClient from '../utils/db.js';

// Mock MongoDB client
const mockConnect = jest.fn();
const mockClose = jest.fn();
const mockDb = jest.fn();
const mockAdmin = jest.fn();
const mockPing = jest.fn();

// Mock the MongoDB client
jest.mock('mongodb', () => ({
  MongoClient: jest.fn().mockImplementation(() => ({
    connect: mockConnect,
    close: mockClose,
    db: mockDb,
  })),
  ServerApiVersion: {
    v1: '1',
  },
}));

// Mock config
jest.mock('../config.js', () => ({
  config: {
    dbName: 'test_db',
    dbPort: 27017,
    dbHost: 'localhost',
    dbUri: 'mongodb://localhost:27017',
  },
}));

describe('DBClient', () => {
  let dbClient;

  beforeEach(() => {
    // Reset all mocks before each test
    jest.clearAllMocks();
    
    // Setup default mock implementations
    mockConnect.mockResolvedValue();
    mockClose.mockResolvedValue();
    mockDb.mockReturnValue({
      admin: mockAdmin,
    });
    mockAdmin.mockReturnValue({
      ping: mockPing,
    });
    mockPing.mockResolvedValue();
    
    // Create a new instance for each test
    dbClient = new DBClient();
  });

  afterEach(async () => {
    // Clean up connection if it exists
    if (dbClient.isConnected()) {
      await dbClient.close();
    }
  });

  describe('Constructor', () => {
    test('should initialize with correct configuration', () => {
      expect(dbClient.dbName).toBe('test_db');
      expect(dbClient.port).toBe(27017);
      expect(dbClient.host).toBe('localhost');
      expect(dbClient.uri).toBe('mongodb://localhost:27017');
      expect(dbClient.connected).toBe(false);
    });

    test('should create MongoClient with correct options', () => {
      const { MongoClient } = require('mongodb');
      expect(MongoClient).toHaveBeenCalledWith('mongodb://localhost:27017', {
        serverApi: {
          version: '1',
          strict: true,
          deprecationErrors: true,
        },
        maxPoolSize: 10,
        minPoolSize: 2,
        maxIdleTimeMS: 30000,
      });
    });
  });

  describe('init()', () => {
    test('should connect successfully and update state', async () => {
      await dbClient.init();

      expect(mockConnect).toHaveBeenCalledTimes(1);
      expect(dbClient.connected).toBe(true);
    });

    test('should return instance for method chaining', async () => {
      const result = await dbClient.init();

      expect(result).toBe(dbClient);
    });

    test('should throw error when connection fails', async () => {
      const errorMessage = 'Connection failed';
      mockConnect.mockRejectedValue(new Error(errorMessage));

      await expect(dbClient.init()).rejects.toThrow(errorMessage);
      expect(dbClient.connected).toBe(false);
    });

    test('should log success message on successful connection', async () => {
      const consoleSpy = jest.spyOn(console, 'log').mockImplementation();
      
      await dbClient.init();

      expect(consoleSpy).toHaveBeenCalledWith('✅ Connected to MongoDB successfully');
      consoleSpy.mockRestore();
    });

    test('should log error message on connection failure', async () => {
      const errorMessage = 'Connection failed';
      mockConnect.mockRejectedValue(new Error(errorMessage));
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();

      await expect(dbClient.init()).rejects.toThrow(errorMessage);

      expect(consoleSpy).toHaveBeenCalledWith('❌ Failed to connect to MongoDB:', errorMessage);
      consoleSpy.mockRestore();
    });
  });

  describe('getDb()', () => {
    test('should return database instance when connected', async () => {
      await dbClient.init();
      const db = dbClient.getDb();

      expect(mockDb).toHaveBeenCalledWith('test_db');
      expect(db).toBeDefined();
    });

    test('should throw error when not connected', () => {
      expect(() => dbClient.getDb()).toThrow('Database not connected. Call init() first.');
    });

    test('should throw error when connection was lost', async () => {
      await dbClient.init();
      dbClient.connected = false; // Simulate lost connection

      expect(() => dbClient.getDb()).toThrow('Database not connected. Call init() first.');
    });
  });

  describe('isConnected()', () => {
    test('should return false when not connected', () => {
      expect(dbClient.isConnected()).toBe(false);
    });

    test('should return true when connected', async () => {
      await dbClient.init();
      expect(dbClient.isConnected()).toBe(true);
    });

    test('should return false after connection is closed', async () => {
      await dbClient.init();
      await dbClient.close();
      expect(dbClient.isConnected()).toBe(false);
    });
  });

  describe('close()', () => {
    test('should close connection successfully', async () => {
      await dbClient.init();
      await dbClient.close();

      expect(mockClose).toHaveBeenCalledTimes(1);
      expect(dbClient.connected).toBe(false);
    });

    test('should log close message', async () => {
      await dbClient.init();
      const consoleSpy = jest.spyOn(console, 'log').mockImplementation();
      
      await dbClient.close();

      expect(consoleSpy).toHaveBeenCalledWith('🔌 MongoDB connection closed');
      consoleSpy.mockRestore();
    });

    test('should call close even when not connected (client exists)', async () => {
      // Client exists but not connected
      expect(dbClient.client).toBeDefined();
      expect(dbClient.connected).toBe(false);
      
      await expect(dbClient.close()).resolves.not.toThrow();
      expect(mockClose).toHaveBeenCalledTimes(1);
      expect(dbClient.connected).toBe(false);
    });

    test('should handle close errors gracefully', async () => {
      await dbClient.init();
      mockClose.mockRejectedValue(new Error('Close failed'));

      await expect(dbClient.close()).rejects.toThrow('Close failed');
      // Connection state should remain true since close failed
      expect(dbClient.connected).toBe(true);
    });
  });

  describe('healthCheck()', () => {
    test('should return true when connection is healthy', async () => {
      await dbClient.init();
      const isHealthy = await dbClient.healthCheck();

      expect(isHealthy).toBe(true);
      expect(mockPing).toHaveBeenCalledTimes(1);
    });

    test('should return false when not connected', async () => {
      const isHealthy = await dbClient.healthCheck();

      expect(isHealthy).toBe(false);
      expect(mockPing).not.toHaveBeenCalled();
    });

    test('should return false and update state when ping fails', async () => {
      await dbClient.init();
      mockPing.mockRejectedValue(new Error('Ping failed'));

      const isHealthy = await dbClient.healthCheck();

      expect(isHealthy).toBe(false);
      expect(dbClient.connected).toBe(false);
    });

    test('should return false when connection state is false but ping succeeds', async () => {
      // This shouldn't happen in normal operation, but test the edge case
      dbClient.connected = false;
      const isHealthy = await dbClient.healthCheck();

      expect(isHealthy).toBe(false);
      expect(mockPing).not.toHaveBeenCalled();
    });

    test('should handle ping errors and update connection state', async () => {
      await dbClient.init();
      const pingError = new Error('Network timeout');
      mockPing.mockRejectedValue(pingError);

      const isHealthy = await dbClient.healthCheck();

      expect(isHealthy).toBe(false);
      expect(dbClient.connected).toBe(false);
    });
  });

  describe('Integration scenarios', () => {
    test('should handle complete lifecycle: init -> use -> health check -> close', async () => {
      // Initialize
      await dbClient.init();
      expect(dbClient.isConnected()).toBe(true);

      // Use database
      const db = dbClient.getDb();
      expect(db).toBeDefined();

      // Health check
      const isHealthy = await dbClient.healthCheck();
      expect(isHealthy).toBe(true);

      // Close
      await dbClient.close();
      expect(dbClient.isConnected()).toBe(false);
    });

    test('should handle reconnection scenario', async () => {
      // Initial connection
      await dbClient.init();
      expect(dbClient.isConnected()).toBe(true);

      // Simulate connection loss
      dbClient.connected = false;
      expect(dbClient.isConnected()).toBe(false);

      // Try to use database (should fail)
      expect(() => dbClient.getDb()).toThrow('Database not connected. Call init() first.');

      // Reconnect
      await dbClient.init();
      expect(dbClient.isConnected()).toBe(true);

      // Use database again (should work)
      const db = dbClient.getDb();
      expect(db).toBeDefined();
    });

    test('should handle multiple health checks', async () => {
      await dbClient.init();

      // Multiple health checks should all succeed
      const health1 = await dbClient.healthCheck();
      const health2 = await dbClient.healthCheck();
      const health3 = await dbClient.healthCheck();

      expect(health1).toBe(true);
      expect(health2).toBe(true);
      expect(health3).toBe(true);
      expect(mockPing).toHaveBeenCalledTimes(3);
    });
  });

  describe('Error handling', () => {
    test('should handle connection timeout', async () => {
      const timeoutError = new Error('Connection timeout');
      mockConnect.mockRejectedValue(timeoutError);

      await expect(dbClient.init()).rejects.toThrow('Connection timeout');
      expect(dbClient.connected).toBe(false);
    });

    test('should handle authentication errors', async () => {
      const authError = new Error('Authentication failed');
      mockConnect.mockRejectedValue(authError);

      await expect(dbClient.init()).rejects.toThrow('Authentication failed');
      expect(dbClient.connected).toBe(false);
    });

    test('should handle network errors during health check', async () => {
      await dbClient.init();
      const networkError = new Error('Network unreachable');
      mockPing.mockRejectedValue(networkError);

      const isHealthy = await dbClient.healthCheck();

      expect(isHealthy).toBe(false);
      expect(dbClient.connected).toBe(false);
    });
  });
});
