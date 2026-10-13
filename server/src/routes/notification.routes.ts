import { Router } from 'express';
import {
  getNotifications,
  markNotificationRead,
  markAllNotificationsRead,
} from '../controllers/notification.controller';
import { authenticateJWT } from '../middleware/auth';

const router = Router();

router.use(authenticateJWT);

router.get('/', getNotifications);
router.patch('/:id/read', markNotificationRead);
router.post('/mark-all-read', markAllNotificationsRead);

export default router;
