import { Router } from 'express';
import { AttendanceController } from '../controllers/attendance.controller';
import {
  validateCreateAttendance,
  validateGetAttendances,
} from '../validators/attendance.validator';
import { jwtAuth, requirePermission } from '../../../middlewares';
import { UserRole } from '../../../utils/auth/jwt';

const router = Router();
const attendanceController = new AttendanceController();

router.post(
  '/',
  jwtAuth,
  requirePermission(UserRole.EMPLOYEE),
  validateCreateAttendance,
  attendanceController.createAttendance,
);

router.get(
  '/check-today',
  jwtAuth,
  requirePermission(UserRole.EMPLOYEE),
  attendanceController.checkAttendanceToday,
);

router.get(
  '/',
  jwtAuth,
  requirePermission(UserRole.STORE_MANAGER),
  validateGetAttendances,
  attendanceController.getAttendances,
);

router.get(
  '/:id',
  jwtAuth,
  requirePermission(UserRole.STORE_MANAGER),
  attendanceController.getAttendanceById,
);

export default router;
