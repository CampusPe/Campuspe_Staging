import express from 'express';
import { debugGetUsers, debugCurrentUser } from '../controllers/debugUserData';
import authMiddleware from '../middleware/auth';

const router = express.Router();

// Debug routes
router.get('/users', debugGetUsers);
router.get('/current-user', authMiddleware, debugCurrentUser);

export default router;
