import express from 'express';
import AuthController from '../controllers/authController.js';
import { authMiddleware } from './middlewares.js';

const router = express.Router();

router.post('/signup', (req, res) => {
  AuthController.createUser(req, res);
});


router.post('/signin', (req, res) => {
  AuthController.connectUser(req, res);
});

router.get('/protected', authMiddleware, (request, response) => {
  response.send('Hello from protected endpoint');
});

router.post('/refresh-token', (req, res) => {
  AuthController.refreshToken(req, res);
});

export default router;
