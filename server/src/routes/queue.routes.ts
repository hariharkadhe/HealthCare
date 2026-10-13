import { Router } from 'express';
import {
  getHospitalQueue,
  getPublicQueue,
  getDoctorQueue,
  updateQueueEntryStatus,
} from '../controllers/queue.controller';
import { authenticateJWT } from '../middleware/auth';

const router = Router();

// Public monitor endpoint for patient waiting room screens
router.get('/public', getPublicQueue);

// Protected routes
router.use(authenticateJWT);

router.get('/', getHospitalQueue);
router.get('/doctors/:id', getDoctorQueue);
router.patch('/:id/status', updateQueueEntryStatus);

export default router;
