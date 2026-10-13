import { Router } from 'express';
import {
  bookAppointment,
  getAppointments,
  getAppointmentById,
  cancelAppointment,
  rescheduleAppointment,
  checkInAppointment,
  updateAppointmentStatus,
} from '../controllers/appointment.controller';
import { authenticateJWT, requireRole } from '../middleware/auth';

const router = Router();

router.use(authenticateJWT);

router.post('/', requireRole('admin', 'receptionist'), bookAppointment);
router.get('/', getAppointments);
router.get('/:id', getAppointmentById);
router.post('/:id/cancel', cancelAppointment);
router.post('/:id/reschedule', requireRole('admin', 'receptionist'), rescheduleAppointment);
router.post('/:id/check-in', requireRole('admin', 'receptionist'), checkInAppointment);
router.patch('/:id/status', updateAppointmentStatus);

export default router;
