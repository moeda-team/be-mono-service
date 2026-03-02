import { Router } from 'express';
import { AttendanceController } from '../controllers/attendance.controller';
import {
  validateCreateAttendance,
  validateGetAttendances,
} from '../validators/attendance.validator';
import { jwtAuth, requirePermission } from '../../../middlewares';
import { UserRole } from '../../../utils/auth/jwt';
import multer from 'multer';

const router = Router();
const attendanceController = new AttendanceController();

const storage = multer.memoryStorage();
const upload = multer({ storage });

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
