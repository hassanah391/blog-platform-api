import express from "express";
const router = express.Router();
import authRoutes from './authRoutes.js';
import usersRoutes from './usersRoutes.js';

router.use('/auth', authRoutes);

router.use('/users', usersRoutes);

export default router;
