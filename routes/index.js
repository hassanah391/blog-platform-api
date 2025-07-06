import express from "express";
const router = express.Router();
import authRoutes from './authRoutes.js';
import usersRoutes from './usersRoutes.js';
import postsRoutes from './postsRoutes.js';

router.use('/auth', authRoutes);

router.use('/users', usersRoutes);

router.use('/posts', postsRoutes);


export default router;
