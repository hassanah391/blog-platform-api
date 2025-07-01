import express from 'express';
import UsersController from '../controllers/usersController.js';

const router = express.Router();

router.post('/signup', (req, res) => {
  UsersController.createUser(req, res);
});


export default router;
