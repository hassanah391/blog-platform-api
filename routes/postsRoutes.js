import express from 'express';
import PostsController from '../controllers/postsController.js';
import { authMiddleware } from './middlewares.js';

const router = express.Router();

router.get('/', PostsController.getAllPostsFromDB);

router.post('/', authMiddleware, PostsController.createPost);

router.get('/:id', authMiddleware, PostsController.getPost);

router.put('/:id', authMiddleware, PostsController.updatePost);

router.delete('/:id', authMiddleware, PostsController.deletePost);


export default router;
