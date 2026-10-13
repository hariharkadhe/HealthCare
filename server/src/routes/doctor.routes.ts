import { Router } from 'express';
import {
  getDoctors,
  createDoctor,
  getDoctorById,
  updateDoctor,
  getDoctorSchedule,
  updateDoctorSchedule,
  getDoctorAvailability,
  addDoctorScheduleException,
  getDoctorScheduleExceptions,
} from '../controllers/doctor.controller';
import { authenticateJWT, requireRole } from '../middleware/auth';

const router = Router();

router.use(authenticateJWT);

router.get('/', getDoctors);
router.post('/', requireRole('admin'), createDoctor);
router.get('/:id', getDoctorById);
router.patch('/:id', requireRole('admin'), updateDoctor);
router.get('/:id/schedule', getDoctorSchedule);
router.put('/:id/schedule', requireRole('admin'), updateDoctorSchedule);
router.get('/:id/availability', getDoctorAvailability);
router.post(
  '/:id/schedule-exceptions',
  requireRole('admin', 'doctor'),
  addDoctorScheduleException
);
router.get('/:id/schedule-exceptions', getDoctorScheduleExceptions);

export default router;
