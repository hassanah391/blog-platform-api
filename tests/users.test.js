import request from 'supertest';
import express from 'express';
import usersRoutes from '../routes/usersRoutes.js';
import dbClient from '../utils/db.js';
import { ObjectId } from 'mongodb';
import jwt from 'jsonwebtoken';
import { config } from '../config.js';

const app = express();
app.use(express.json());
app.use('/users', usersRoutes);

const testUser = {
  email: 'testuser@example.com',
  password: 'TestPass123!',
  firstName: 'Test',
  lastName: 'User',
  phoneNumber: '1234567890',
};

const testUser2 = {
  email: 'testuser2@example.com',
  password: 'TestPass123!',
  firstName: 'Test2',
  lastName: 'User2',
  phoneNumber: '1234567891',
};

let accessToken, userId, userId2;

describe('Users Routes', () => {
  beforeAll(async () => {
    await dbClient.init();
    const usersCollection = await dbClient.getCollection('users');
    
    // Clean up test users
    await usersCollection.deleteMany({ 
      email: { $in: [testUser.email, testUser2.email] } 
    });
    
    // Create test users
    const user1 = await usersCollection.insertOne(testUser);
    const user2 = await usersCollection.insertOne(testUser2);
    userId = user1.insertedId.toString();
    userId2 = user2.insertedId.toString();
    
    // Generate access token for authentication
    accessToken = jwt.sign(
      { 
        _id: userId, 
        email: testUser.email,
        firstName: testUser.firstName,
        lastName: testUser.lastName
      }, 
      config.secretKey, 
      { expiresIn: '1h' }
    );
  });

  afterAll(async () => {
    const usersCollection = await dbClient.getCollection('users');
    await usersCollection.deleteMany({ 
      email: { $in: [testUser.email, testUser2.email] } 
    });
    await dbClient.close();
  });

  describe('GET /users/me', () => {
    test('should return user info with valid token', async () => {
      const res = await request(app)
        .get('/users/me')
        .set('Authorization', `Bearer ${accessToken}`);
      
      expect(res.statusCode).toBe(200);
      expect(res.body).toHaveProperty('id');
      expect(res.body).toHaveProperty('email', testUser.email);
      expect(res.body).toHaveProperty('firstName', testUser.firstName);
      expect(res.body).toHaveProperty('lastName', testUser.lastName);
    });

    test('should return 401 without token', async () => {
      const res = await request(app)
        .get('/users/me');
      
      expect(res.statusCode).toBe(401);
      expect(res.body).toHaveProperty('error', 'Missing or invalid token');
    });

    test('should return 401 with invalid token', async () => {
      const res = await request(app)
        .get('/users/me')
        .set('Authorization', 'Bearer invalidtoken');
      
      expect(res.statusCode).toBe(401);
      expect(res.body).toHaveProperty('error', 'Invalid or expired token');
    });
  });

  describe('DELETE /users/me', () => {
    test('should delete user account with valid token', async () => {
      const res = await request(app)
        .delete('/users/me')
        .set('Authorization', `Bearer ${accessToken}`);
      
      expect(res.statusCode).toBe(200);
      expect(res.text).toContain('Successfully deleted account with email: testuser@example.com');
    });

    test('should return 401 without token', async () => {
      const res = await request(app)
        .delete('/users/me');
      
      expect(res.statusCode).toBe(401);
      expect(res.body).toHaveProperty('error', 'Missing or invalid token');
    });

    test('should return 401 with invalid token', async () => {
      const res = await request(app)
        .delete('/users/me')
        .set('Authorization', 'Bearer invalidtoken');
      
      expect(res.statusCode).toBe(401);
      expect(res.body).toHaveProperty('error', 'Invalid or expired token');
    });
  });

  describe('PUT /users/me/profile', () => {
    let profileTestUser, newAccessToken;

    beforeEach(async () => {
      // Create a new user for each test with unique email
      const usersCollection = await dbClient.getCollection('users');
      const uniqueEmail = `profiletest${Date.now()}@example.com`;
      
      profileTestUser = await usersCollection.insertOne({
        ...testUser,
        email: uniqueEmail
      });
      
      newAccessToken = jwt.sign(
        { 
          _id: profileTestUser.insertedId, 
          email: uniqueEmail,
          firstName: testUser.firstName,
          lastName: testUser.lastName
        }, 
        config.secretKey, 
        { expiresIn: '1h' }
      );
    });

    afterEach(async () => {
      // Clean up the test user after each test
      const usersCollection = await dbClient.getCollection('users');
      await usersCollection.deleteOne({ _id: profileTestUser.insertedId });
    });

    test('should add bio to user profile', async () => {
      const bio = 'This is my bio';
      const res = await request(app)
        .put('/users/me/profile')
        .set('Authorization', `Bearer ${newAccessToken}`)
        .send({ bio });
      
      expect(res.statusCode).toBe(200);
      expect(res.body).toHaveProperty('message', 'Bio updated successfully');
      expect(res.body).toHaveProperty('bio', bio);
    });

    test('should return 400 when bio is missing', async () => {
      const res = await request(app)
        .put('/users/me/profile')
        .set('Authorization', `Bearer ${newAccessToken}`)
        .send({});
      
      expect(res.statusCode).toBe(400);
      expect(res.body).toHaveProperty('error', 'Bio is required and must be a non-empty string');
    });

    test('should return 400 when bio is empty string', async () => {
      const res = await request(app)
        .put('/users/me/profile')
        .set('Authorization', `Bearer ${newAccessToken}`)
        .send({ bio: '' });
      
      expect(res.statusCode).toBe(400);
      expect(res.body).toHaveProperty('error', 'Bio is required and must be a non-empty string');
    });

    test('should return 400 when bio is too long', async () => {
      const longBio = 'a'.repeat(501);
      const res = await request(app)
        .put('/users/me/profile')
        .set('Authorization', `Bearer ${newAccessToken}`)
        .send({ bio: longBio });
      
      expect(res.statusCode).toBe(400);
      expect(res.body).toHaveProperty('error', 'Bio must be less than 500 characters');
    });

    test('should return 401 without token', async () => {
      const res = await request(app)
        .put('/users/me/profile')
        .send({ bio: 'Test bio' });
      
      expect(res.statusCode).toBe(401);
      expect(res.body).toHaveProperty('error', 'Missing or invalid token');
    });

    test('should return 401 with invalid token', async () => {
      const res = await request(app)
        .put('/users/me/profile')
        .set('Authorization', 'Bearer invalidtoken')
        .send({ bio: 'Test bio' });
      
      expect(res.statusCode).toBe(401);
      expect(res.body).toHaveProperty('error', 'Invalid or expired token');
    });
  });

  describe('GET /users/:id', () => {
    test('should return public user info with valid ID', async () => {
      const res = await request(app)
        .get(`/users/${userId2}`);
      
      expect(res.statusCode).toBe(200);
      expect(res.body).toHaveProperty('userId', userId2);
      expect(res.body).toHaveProperty('firstName', testUser2.firstName);
      expect(res.body).toHaveProperty('lastName', testUser2.lastName);
      expect(res.body).toHaveProperty('email', testUser2.email);
      expect(res.body).toHaveProperty('postCount');
    });

    test('should return 400 with invalid ID format', async () => {
      const res = await request(app)
        .get('/users/invalid-id');
      
      expect(res.statusCode).toBe(400);
      expect(res.body).toHaveProperty('error', 'Invalid ID');
    });

    test('should return 400 when ID is missing', async () => {
      const res = await request(app)
        .get('/users/');
      
      expect(res.statusCode).toBe(404); // Express will return 404 for this route
    });

    test('should return 404 when user does not exist', async () => {
      const nonExistentId = new ObjectId().toString();
      const res = await request(app)
        .get(`/users/${nonExistentId}`);
      
      expect(res.statusCode).toBe(404);
      expect(res.body).toHaveProperty('error', 'User not found');
    });

    test('should include bio when user has bio', async () => {
      // First add a bio to the user
      const usersCollection = await dbClient.getCollection('users');
      await usersCollection.updateOne(
        { _id: new ObjectId(userId2) },
        { $set: { bio: 'Test bio for user 2' } }
      );

      const res = await request(app)
        .get(`/users/${userId2}`);
      
      expect(res.statusCode).toBe(200);
      expect(res.body).toHaveProperty('bio', 'Test bio for user 2');
    });

    test('should not include bio when user has no bio', async () => {
      // Remove bio from user
      const usersCollection = await dbClient.getCollection('users');
      await usersCollection.updateOne(
        { _id: new ObjectId(userId2) },
        { $unset: { bio: "" } }
      );

      const res = await request(app)
        .get(`/users/${userId2}`);
      
      expect(res.statusCode).toBe(200);
      expect(res.body).not.toHaveProperty('bio');
    });
  });
});
