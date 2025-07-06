import express from 'express';
import UsersController from '../controllers/usersController.js';
import { authMiddleware } from './middlewares.js';

const router = express.Router();

router.get('/me', authMiddleware, UsersController.getMe);

router.delete('/me', authMiddleware, UsersController.deleteMe);

router.put('/me/profile', authMiddleware, UsersController.addProfileInfo);

router.get('/:id', UsersController.getUserPublicInfo);


router.get('/:id/posts', UsersController.getUserPosts);


export default router;
