import { Router } from 'express';
import { login, logout, getMe } from '../controllers/auth.controller';
import { authenticateJWT } from '../middleware/auth';
import { authLimiter } from '../middleware/rateLimiter';

const router = Router();

router.post('/login', authLimiter, login);
router.post('/logout', authenticateJWT, logout);
router.get('/me', authenticateJWT, getMe);

export default router;
