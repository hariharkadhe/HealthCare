import { Router } from 'express';
import {
  getHospitalSettings,
  updateHospitalSettings,
} from '../controllers/settings.controller';
import { authenticateJWT, requireRole } from '../middleware/auth';

const router = Router();

// Hospital settings can be read by all authenticated staff
router.get('/', authenticateJWT, getHospitalSettings);
router.put('/', authenticateJWT, requireRole('admin'), updateHospitalSettings);

export default router;
