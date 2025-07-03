import express from 'express';
import UsersController from '../controllers/usersController.js';
import { authMiddleware } from './middlewares.js';

const router = express.Router();

router.post('/signup', (req, res) => {
  UsersController.createUser(req, res);
});


router.post('/signin', (req, res) => {
  UsersController.connectUser(req, res);
});

router.get('/protected', authMiddleware, (request, response) => {
  response.send('Hello from protected endpoint');
});

router.get('/users/me', authMiddleware, UsersController.getMe);

router.post('/refresh-token', (req, res) => {
  UsersController.refreshToken(req, res);
});

export default router;
