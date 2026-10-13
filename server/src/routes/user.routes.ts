import { Router } from 'express';
import { getUsers, createUser, updateUser } from '../controllers/user.controller';
import { getAuditLogs } from '../controllers/notification.controller';
import { authenticateJWT, requireRole } from '../middleware/auth';

const router = Router();

router.use(authenticateJWT);
router.use(requireRole('admin'));

router.get('/users', getUsers);
router.post('/users', createUser);
router.patch('/users/:id', updateUser);
router.get('/audit-logs', getAuditLogs);

export default router;
