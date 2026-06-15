import { Router } from 'express';
import { AttendanceController } from '../controllers/attendance.controller';
import {
  validateCreateAttendance,
  validateCreateAttendanceManual,
  validateGetAttendances,
} from '../validators/attendance.validator';
import { jwtAuth, requirePermission } from '../../../middlewares';
import { UserRole } from '../../../utils/auth/jwt';

/**
 * @openapi
 * /attendances:
 *   get:
 *     tags: [Attendances]
 *     summary: List attendances (min role STORE_MANAGER)
 *     parameters:
 *       - $ref: '#/components/parameters/OutletIdQuery'
 *       - name: date
 *         in: query
 *         schema: { type: string, format: date }
 *       - $ref: '#/components/parameters/PageQuery'
 *       - $ref: '#/components/parameters/LimitQuery'
 *     responses:
 *       '200':
 *         description: OK
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/SuccessResponse'
 *                 - type: object
 *                   properties:
 *                     data:
 *                       type: array
 *                       items: { $ref: '#/components/schemas/Attendance' }
 *       '403': { $ref: '#/components/responses/Forbidden' }
 *   post:
 *     tags: [Attendances]
 *     summary: Check in with a photo (min role EMPLOYEE)
 *     description: Attendance is always recorded against the authenticated user's own outlet.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               fileName: { type: string }
 *               fileUrl: { type: string }
 *               note: { type: string }
 *     responses:
 *       '200':
 *         description: Created
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/SuccessResponse'
 *                 - type: object
 *                   properties:
 *                     data: { $ref: '#/components/schemas/Attendance' }
 *       '400': { $ref: '#/components/responses/BadRequest' }
 *       '401': { $ref: '#/components/responses/Unauthorized' }
 *
 * /attendances/manual:
 *   post:
 *     tags: [Attendances]
 *     summary: Record a manual attendance entry (min role EMPLOYEE)
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               fileName: { type: string }
 *               fileUrl: { type: string }
 *               note: { type: string }
 *     responses:
 *       '200': { description: Created }
 *       '400': { $ref: '#/components/responses/BadRequest' }
 *
 * /attendances/check-today:
 *   get:
 *     tags: [Attendances]
 *     summary: Check whether the current user has checked in today (min role EMPLOYEE)
 *     responses:
 *       '200':
 *         description: OK
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/SuccessResponse'
 *                 - type: object
 *                   properties:
 *                     data: { type: boolean }
 *       '401': { $ref: '#/components/responses/Unauthorized' }
 *
 * /attendances/{id}:
 *   get:
 *     tags: [Attendances]
 *     summary: Get an attendance by id (min role STORE_MANAGER)
 *     parameters:
 *       - $ref: '#/components/parameters/IdPath'
 *     responses:
 *       '200':
 *         description: OK
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/SuccessResponse'
 *                 - type: object
 *                   properties:
 *                     data: { $ref: '#/components/schemas/Attendance' }
 *       '403': { $ref: '#/components/responses/Forbidden' }
 *       '404': { $ref: '#/components/responses/NotFound' }
 */
const router = Router();
const attendanceController = new AttendanceController();

router.post(
  '/',
  jwtAuth,
  requirePermission(UserRole.EMPLOYEE),
  validateCreateAttendance,
  attendanceController.createAttendance,
);

router.post(
  '/manual',
  jwtAuth,
  requirePermission(UserRole.EMPLOYEE),
  validateCreateAttendanceManual,
  attendanceController.createAttendanceManual,
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
