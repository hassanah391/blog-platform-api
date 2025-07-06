import request from 'supertest';
import jwt from 'jsonwebtoken';
import { ObjectId } from 'mongodb';
import app from '../server.js';
import dbClient from '../utils/db.js';
import { config } from '../config.js';

// Mock the database client
jest.mock('../utils/db.js');

describe('Posts Routes', () => {
  let mockToken;
  let mockUserId;
  let mockPostId;

  beforeAll(() => {
    mockUserId = new ObjectId().toString();
    mockPostId = new ObjectId().toString();
    mockToken = jwt.sign({ userId: mockUserId }, config.secretKey);
  });

  beforeEach(() => {
    jest.clearAllMocks();
  });

  afterAll(async () => {
    await dbClient.close();
  });

  describe('GET /posts', () => {
    it('should return all posts with pagination', async () => {
      const mockPosts = [
        { _id: new ObjectId(), title: 'Test Post 1', body: 'Content 1', author: new ObjectId(mockUserId) },
        { _id: new ObjectId(), title: 'Test Post 2', body: 'Content 2', author: new ObjectId(mockUserId) }
      ];

      const mockCollection = {
        find: jest.fn().mockReturnValue({
          sort: jest.fn().mockReturnValue({
            skip: jest.fn().mockReturnValue({
              limit: jest.fn().mockReturnValue({
                toArray: jest.fn().mockResolvedValue(mockPosts)
              })
            })
          })
        }),
        countDocuments: jest.fn().mockResolvedValue(2)
      };

      dbClient.init.mockResolvedValue();
      dbClient.getCollection.mockResolvedValue(mockCollection);

      const response = await request(app)
        .get('/posts')
        .query({ page: 1, limit: 10 });

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('posts');
      expect(response.body).toHaveProperty('pagination');
      expect(response.body.posts).toHaveLength(2);
      expect(response.body.pagination.total).toBe(2);
    });

    it('should handle database errors gracefully', async () => {
      dbClient.init.mockRejectedValue(new Error('Database connection failed'));

      const response = await request(app)
        .get('/posts');

      expect(response.status).toBe(500);
      expect(response.body).toHaveProperty('error', 'Internal server error');
    });
  });

  describe('GET /posts/:id', () => {
    it('should return a specific post by ID', async () => {
      const mockPost = {
        _id: new ObjectId(mockPostId),
        title: 'Test Post',
        body: 'Test Content',
        author: new ObjectId(mockUserId)
      };

      const mockCollection = {
        findOne: jest.fn().mockResolvedValue(mockPost)
      };

      dbClient.init.mockResolvedValue();
      dbClient.getCollection.mockResolvedValue(mockCollection);

      const response = await request(app)
        .get(`/posts/${mockPostId}`)
        .set('Authorization', `Bearer ${mockToken}`);

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('post');
      expect(response.body.post.title).toBe('Test Post');
    });

    it('should return 400 for invalid post ID', async () => {
      const response = await request(app)
        .get('/posts/invalid-id')
        .set('Authorization', `Bearer ${mockToken}`);

      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('error', 'Invalid ID');
    });

    it('should return 404 for non-existent post', async () => {
      const mockCollection = {
        findOne: jest.fn().mockResolvedValue(null)
      };

      dbClient.init.mockResolvedValue();
      dbClient.getCollection.mockResolvedValue(mockCollection);

      const response = await request(app)
        .get(`/posts/${mockPostId}`)
        .set('Authorization', `Bearer ${mockToken}`);

      expect(response.status).toBe(404);
      expect(response.body).toHaveProperty('error', 'Post ID not found');
    });

    it('should return 401 without authentication token', async () => {
      const response = await request(app)
        .get(`/posts/${mockPostId}`);

      expect(response.status).toBe(401);
      expect(response.body).toHaveProperty('error', 'Missing or invalid token');
    });
  });

  describe('POST /posts', () => {
    it('should create a new post successfully', async () => {
      const postData = {
        title: 'New Post',
        body: 'Post content',
        tags: ['test', 'blog'],
        coverImageUrl: 'https://example.com/image.jpg'
      };

      const mockCollection = {
        insertOne: jest.fn().mockResolvedValue({
          acknowledged: true,
          insertedId: new ObjectId()
        })
      };

      dbClient.init.mockResolvedValue();
      dbClient.getCollection.mockResolvedValue(mockCollection);

      const response = await request(app)
        .post('/posts')
        .set('Authorization', `Bearer ${mockToken}`)
        .send(postData);

      expect(response.status).toBe(201);
      expect(response.body).toHaveProperty('message', 'Post created successfully');
      expect(response.body).toHaveProperty('postId');
    });

    it('should return 400 when title or body is missing', async () => {
      const postData = {
        title: 'New Post'
        // Missing body
      };

      const response = await request(app)
        .post('/posts')
        .set('Authorization', `Bearer ${mockToken}`)
        .send(postData);

      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('error', 'title and body needed');
    });

    it('should return 401 without authentication token', async () => {
      const postData = {
        title: 'New Post',
        body: 'Post content'
      };

      const response = await request(app)
        .post('/posts')
        .send(postData);

      expect(response.status).toBe(401);
      expect(response.body).toHaveProperty('error', 'Missing or invalid token');
    });
  });

  describe('PUT /posts/:id', () => {
    it('should update a post successfully', async () => {
      const updateData = {
        title: 'Updated Post',
        body: 'Updated content'
      };

      const mockCollection = {
        updateOne: jest.fn().mockResolvedValue({
          matchedCount: 1,
          modifiedCount: 1
        })
      };

      dbClient.init.mockResolvedValue();
      dbClient.getCollection.mockResolvedValue(mockCollection);

      const response = await request(app)
        .put(`/posts/${mockPostId}`)
        .set('Authorization', `Bearer ${mockToken}`)
        .send(updateData);

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('message', 'Post updated successfully');
    });

    it('should return 400 for invalid post ID', async () => {
      const response = await request(app)
        .put('/posts/invalid-id')
        .set('Authorization', `Bearer ${mockToken}`)
        .send({ title: 'Updated Post' });

      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('error', 'Invalid Post ID');
    });

    it('should return 404 when post not found or user not author', async () => {
      const mockCollection = {
        updateOne: jest.fn().mockResolvedValue({
          matchedCount: 0,
          modifiedCount: 0
        })
      };

      dbClient.init.mockResolvedValue();
      dbClient.getCollection.mockResolvedValue(mockCollection);

      const response = await request(app)
        .put(`/posts/${mockPostId}`)
        .set('Authorization', `Bearer ${mockToken}`)
        .send({ title: 'Updated Post' });

      expect(response.status).toBe(404);
      expect(response.body).toHaveProperty('error', 'Post not found or you are not the author');
    });

    it('should return 400 when no fields to update', async () => {
      const response = await request(app)
        .put(`/posts/${mockPostId}`)
        .set('Authorization', `Bearer ${mockToken}`)
        .send({});

      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('error', 'No fields to update');
    });
  });

  describe('DELETE /posts/:id', () => {
    it('should delete a post successfully', async () => {
      const mockCollection = {
        deleteOne: jest.fn().mockResolvedValue({
          acknowledged: true,
          deletedCount: 1
        })
      };

      dbClient.init.mockResolvedValue();
      dbClient.getCollection.mockResolvedValue(mockCollection);

      const response = await request(app)
        .delete(`/posts/${mockPostId}`)
        .set('Authorization', `Bearer ${mockToken}`);

      expect(response.status).toBe(200);
      expect(response.text).toBe('Post deleted successfully');
    });

    it('should return 400 for invalid post ID', async () => {
      const response = await request(app)
        .delete('/posts/invalid-id')
        .set('Authorization', `Bearer ${mockToken}`);

      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('error', 'Invalid Post ID');
    });

    it('should return 404 when post not found or user not author', async () => {
      const mockCollection = {
        deleteOne: jest.fn().mockResolvedValue({
          acknowledged: true,
          deletedCount: 0
        })
      };

      dbClient.init.mockResolvedValue();
      dbClient.getCollection.mockResolvedValue(mockCollection);

      const response = await request(app)
        .delete(`/posts/${mockPostId}`)
        .set('Authorization', `Bearer ${mockToken}`);

      expect(response.status).toBe(404);
      expect(response.body).toHaveProperty('error', 'Post not found or you are not the author');
    });
  });
});
