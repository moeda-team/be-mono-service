import { Router } from 'express';
import { ActivityController } from '../controllers/activity.controller';
import { validateCreateActivity } from '../validators/activity.validator';
import { jwtAuth, requirePermission } from '../../../middlewares';
import { UserRole } from '../../../utils/auth/jwt';

const router = Router();
const activityController = new ActivityController();

router.get(
  '/:id',
  jwtAuth,
  requirePermission(UserRole.EMPLOYEE),
  activityController.getActivityById,
);
router.get('/', jwtAuth, requirePermission(UserRole.EMPLOYEE), activityController.getAllActivities);
router.post(
  '/',
  jwtAuth,
  requirePermission(UserRole.EMPLOYEE),
  validateCreateActivity,
  activityController.createActivity,
);
router.delete(
  '/:id',
  jwtAuth,
  requirePermission(UserRole.OWNER),
  activityController.deleteActivity,
);

export default router;
