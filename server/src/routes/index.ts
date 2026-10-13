import { Router } from 'express';
import authRoutes from './auth.routes';
import patientRoutes from './patient.routes';
import departmentRoutes from './department.routes';
import doctorRoutes from './doctor.routes';
import appointmentRoutes from './appointment.routes';
import queueRoutes from './queue.routes';
import dashboardRoutes from './dashboard.routes';
import userRoutes from './user.routes';
import notificationRoutes from './notification.routes';
import settingsRoutes from './settings.routes';

const router = Router();

router.use('/auth', authRoutes);
router.use('/patients', patientRoutes);
router.use('/departments', departmentRoutes);
router.use('/doctors', doctorRoutes);
router.use('/appointments', appointmentRoutes);
router.use('/queue', queueRoutes);
router.use('/dashboard', dashboardRoutes);
router.use('/notifications', notificationRoutes);
router.use('/settings', settingsRoutes);
// Admin users and audit logs
router.use('/', userRoutes);

export default router;
