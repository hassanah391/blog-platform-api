import { jest } from '@jest/globals';

let mockConnect;
let mockClose;
let mockDb;
let mockAdmin;
let mockPing;

jest.mock('mongodb', () => {
  const MongoClient = jest.fn().mockImplementation(() => ({
    connect: mockConnect,
    close: mockClose,
    db: mockDb,
  }));
  return {
    MongoClient,
    ServerApiVersion: {
      v1: '1',
    },
  };
});

jest.mock('../config.js', () => ({
  config: {
    dbName: 'test_db',
    dbPort: 27017,
    dbHost: 'localhost',
    dbUri: 'mongodb://localhost:27017',
  },
}));

let DBClientClass;

describe('DBClient', () => {
  let dbClientInstance;

  beforeAll(async () => {
    try {
      DBClientClass = (await import('../utils/db.js')).default.constructor;
    } catch (error) {
      console.error("Error importing DBClient in beforeAll:", error);
      throw error;
    }
  });

  beforeEach(() => {
    jest.clearAllMocks();
    
    mockConnect = jest.fn();
    mockClose = jest.fn();
    mockAdmin = jest.fn();
    mockPing = jest.fn();

    mockConnect.mockResolvedValue();
    mockClose.mockResolvedValue();
    mockPing.mockResolvedValue();

    mockDb = jest.fn().mockReturnValue({
      admin: jest.fn().mockReturnValue({
        ping: mockPing,
      }),
      collection: jest.fn(),
    });
    
    dbClientInstance = new DBClientClass();
  });

  afterEach(async () => {
    if (dbClientInstance.isConnected()) {
      try {
        await dbClientInstance.close();
      } catch (error) {
        // Ignore close errors during cleanup
      }
    }
  });

  describe('Constructor', () => {
    test('should initialize with correct configuration', () => {
      expect(dbClientInstance.dbName).toBe('test_db');
      expect(dbClientInstance.uri).toBe('mongodb://localhost:27017');
      expect(dbClientInstance.connected).toBe(false);
    });
  });

  describe('init()', () => {
    test('should connect successfully and update state', async () => {
      await dbClientInstance.init();
      expect(mockConnect).toHaveBeenCalledTimes(1);
      expect(dbClientInstance.connected).toBe(true);
    });

    test('should throw error when connection fails', async () => {
      const errorMessage = 'Connection failed';
      mockConnect.mockRejectedValue(new Error(errorMessage));
      await expect(dbClientInstance.init()).rejects.toThrow(errorMessage);
      expect(dbClientInstance.connected).toBe(false);
    });
  });

  describe('getDb()', () => {
    test('should return database instance when connected', async () => {
      await dbClientInstance.init();
      const db = await dbClientInstance.getDb(); 
      expect(mockDb).toHaveBeenCalledWith('test_db');
      expect(db).toBeDefined();
    });

    test('should throw error when not connected', async () => { 
      await expect(dbClientInstance.getDb()).rejects.toThrow('Database not connected. Call init() first.');
    });
  });

  describe('getCollection(collectionName)', () => {
    test('should return collection instance when connected', async () => {
      await dbClientInstance.init();
      const mockCollectionInstance = { insertOne: jest.fn() };
      mockDb.mockReturnValue({ 
        admin: jest.fn().mockReturnValue({ ping: mockPing }),
        collection: jest.fn().mockReturnValue(mockCollectionInstance),
      });
      const collection = await dbClientInstance.getCollection('users');
      expect(mockDb().collection).toHaveBeenCalledWith('users');
      expect(collection).toBe(mockCollectionInstance);
    });
  });

  describe('isConnected()', () => {
    test('should return false when not connected', () => {
      expect(dbClientInstance.isConnected()).toBe(false);
    });

    test('should return true when connected', async () => {
      await dbClientInstance.init();
      expect(dbClientInstance.isConnected()).toBe(true);
    });
  });

  describe('close()', () => {
    test('should close connection successfully', async () => {
      await dbClientInstance.init();
      await dbClientInstance.close();
      expect(mockClose).toHaveBeenCalledTimes(1);
      expect(dbClientInstance.connected).toBe(false);
    });
  });

  describe('healthCheck()', () => {
    test('should return true when connection is healthy', async () => {
      await dbClientInstance.init();
      const isHealthy = await dbClientInstance.healthCheck();
      expect(isHealthy).toBe(true);
      expect(mockPing).toHaveBeenCalledTimes(1);
    });

    test('should return false and update state when ping fails', async () => {
      await dbClientInstance.init();
      mockPing.mockRejectedValue(new Error('Ping failed'));
      const isHealthy = await dbClientInstance.healthCheck();
      expect(isHealthy).toBe(false);
      expect(dbClientInstance.connected).toBe(false);
    });
  });
});
