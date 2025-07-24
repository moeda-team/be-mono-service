import { Router } from 'express';
import { AttendanceController } from '../controllers/attendance.controller';
import { validateCreateAttendance } from '../validators/attendance.validator';
import { HealthController } from '../controllers/health.controller';
import { jwtAuth, roleAuth } from '../../../middlewares';
import { UserRole } from '../../../utils/auth/jwt';

const router = Router();
const attendanceController = new AttendanceController();
const healthController = new HealthController();

router.get('/health', healthController.check);
router.get('/:id', jwtAuth, roleAuth(UserRole.EMPLOYEE), attendanceController.getAttendanceById);
router.get('/', jwtAuth, roleAuth(UserRole.EMPLOYEE), attendanceController.getAllAttendances);
router.post(
  '/',
  jwtAuth,
  roleAuth(UserRole.EMPLOYEE),
  validateCreateAttendance,
  attendanceController.createAttendance,
);

export default router;
