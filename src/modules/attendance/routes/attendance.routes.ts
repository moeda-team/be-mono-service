import { Router } from 'express';
import { AttendanceController } from '../controllers/attendance.controller';
import {
  validateCreateAttendance,
  validateApprovedAttendance,
} from '../validators/attendance.validator';
import { HealthController } from '../controllers/health.controller';
import { jwtAuth, roleAuth } from '../../../middlewares';
import { UserRole } from '../../../utils/auth/jwt';

const router = Router();
const attendanceController = new AttendanceController();
const healthController = new HealthController();

router.get('/health', healthController.check);
router.get(
  '/detail/:id',
  jwtAuth,
  roleAuth(UserRole.EMPLOYEE),
  attendanceController.getAttendanceById,
);
router.get('/', jwtAuth, roleAuth(UserRole.EMPLOYEE), attendanceController.getAllAttendances);
router.post(
  '/',
  jwtAuth,
  roleAuth(UserRole.EMPLOYEE),
  validateCreateAttendance,
  attendanceController.createAttendance,
);
router.patch(
  '/approved',
  jwtAuth,
  roleAuth(UserRole.STORE_MANAGER),
  validateApprovedAttendance,
  attendanceController.approveAttendance,
);

export default router;
