import { Router } from 'express';
import {
  getDepartments,
  createDepartment,
  updateDepartment,
} from '../controllers/department.controller';
import { authenticateJWT, requireRole } from '../middleware/auth';

const router = Router();

router.use(authenticateJWT);

router.get('/', getDepartments);
router.post('/', requireRole('admin'), createDepartment);
router.patch('/:id', requireRole('admin'), updateDepartment);

export default router;
