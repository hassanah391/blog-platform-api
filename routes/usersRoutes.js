import express from 'express';
import UsersController from '../controllers/usersController.js';
import { authMiddleware } from './middlewares.js';

const router = express.Router();

// Get current user info
router.get('/me', authMiddleware, UsersController.getMe);

// Delete current user
router.delete('/me', authMiddleware, UsersController.deleteMe);

// Update user profile
router.put('/me/profile', authMiddleware, UsersController.addProfileInfo);

// Get public info for a user
router.get('/:id', UsersController.getUserPublicInfo);

// Get posts for a user
router.get('/:id/posts', UsersController.getUserPosts);

export default router;
