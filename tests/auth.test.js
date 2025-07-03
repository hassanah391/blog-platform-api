import request from 'supertest';
import express from 'express';
import authRoutes from '../routes/authRoutes.js';
import dbClient from '../utils/db.js';
import { ObjectId } from 'mongodb';

const app = express();
app.use(express.json());
app.use('/auth', authRoutes);

const testUser = {
  email: 'testuser@example.com',
  password: 'TestPass123!',
  firstName: 'Test',
  lastName: 'User',
  phoneNumber: '1234567890',
};

let accessToken, refreshToken;

describe('Auth System', () => {
  beforeAll(async () => {
    await dbClient.init();
    const usersCollection = await dbClient.getCollection('users');
    await usersCollection.deleteMany({ email: testUser.email });
  });

  afterAll(async () => {
    const usersCollection = await dbClient.getCollection('users');
    await usersCollection.deleteMany({ email: testUser.email });
    await dbClient.close();
  });

  test('Signup: should create a new user', async () => {
    const res = await request(app)
      .post('/auth/signup')
      .send(testUser);
    expect(res.statusCode).toBe(201);
    expect(res.body).toHaveProperty('id');
    expect(res.body).toHaveProperty('email', testUser.email);
  });

  test('Signin: should return access and refresh tokens', async () => {
    const res = await request(app)
      .post('/auth/signin')
      .send({ email: testUser.email, password: testUser.password });
    expect(res.statusCode).toBe(200);
    expect(res.body).toHaveProperty('accessToken');
    expect(res.body).toHaveProperty('refreshToken');
    accessToken = res.body.accessToken;
    refreshToken = res.body.refreshToken;
  });

  test('Protected endpoint: should allow access with valid token', async () => {
    const res = await request(app)
      .get('/auth/protected')
      .set('Authorization', `Bearer ${accessToken}`);
    expect(res.statusCode).toBe(200);
    expect(res.text).toContain('Hello from protected endpoint');
  });

  test('Protected endpoint: should deny access with invalid token', async () => {
    const res = await request(app)
      .get('/auth/protected')
      .set('Authorization', 'Bearer invalidtoken');
    expect(res.statusCode).toBe(401);
  });

  test('Refresh token: should issue new access and refresh tokens', async () => {
    const res = await request(app)
      .post('/auth/refresh-token')
      .send({ refreshToken });
    expect(res.statusCode).toBe(200);
    expect(res.body).toHaveProperty('accessToken');
    expect(res.body).toHaveProperty('refreshToken');
  });
});
