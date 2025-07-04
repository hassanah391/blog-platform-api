import express from 'express';
import UsersController from '../controllers/usersController.js';
import { authMiddleware } from './middlewares.js';

const router = express.Router();

router.get('/me', authMiddleware, UsersController.getMe);


export default router;
