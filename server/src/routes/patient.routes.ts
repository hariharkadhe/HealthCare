import { Router } from 'express';
import {
  createPatient,
  getPatients,
  getPatientById,
  updatePatient,
} from '../controllers/patient.controller';
import { authenticateJWT, requireRole } from '../middleware/auth';

const router = Router();

router.use(authenticateJWT);

router.post('/', requireRole('admin', 'receptionist'), createPatient);
router.get('/', getPatients);
router.get('/:id', getPatientById);
router.patch('/:id', requireRole('admin', 'receptionist'), updatePatient);

export default router;
