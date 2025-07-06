import express from 'express';
import AuthController from '../controllers/authController.js';
import { authMiddleware } from './middlewares.js';

const router = express.Router();

// Register new user
router.post('/signup', (req, res) => {
  AuthController.createUser(req, res);
});

// User login
router.post('/signin', (req, res) => {
  AuthController.connectUser(req, res);
});

// Protected test endpoint
router.get('/protected', authMiddleware, (request, response) => {
  response.send('Hello from protected endpoint');
});

// Refresh JWT tokens
router.post('/refresh-token', (req, res) => {
  AuthController.refreshToken(req, res);
});

export default router;
