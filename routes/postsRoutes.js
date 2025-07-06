import express from 'express';
import PostsController from '../controllers/postsController.js';
import { authMiddleware } from './middlewares.js';

const router = express.Router();

// Get all posts
router.get('/', PostsController.getAllPostsFromDB);

// Create a new post
router.post('/', authMiddleware, PostsController.createPost);

// Get a post by ID
router.get('/:id', authMiddleware, PostsController.getPost);

// Update a post by ID
router.put('/:id', authMiddleware, PostsController.updatePost);

// Delete a post by ID
router.delete('/:id', authMiddleware, PostsController.deletePost);

export default router;
