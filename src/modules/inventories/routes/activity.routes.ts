import { Router } from 'express';
import { ActivityController } from '../controllers/activity.controller';
import { validateCreateActivity } from '../validators/activity.validator';
import { jwtAuth, roleAuth } from '../../../middlewares';
import { UserRole } from '../../../utils/auth/jwt';

const router = Router();
const activityController = new ActivityController();

router.get('/:id', jwtAuth, roleAuth(UserRole.EMPLOYEE), activityController.getActivityById);
router.get('/', jwtAuth, roleAuth(UserRole.EMPLOYEE), activityController.getAllActivities);
router.post(
  '/',
  jwtAuth,
  roleAuth(UserRole.EMPLOYEE),
  validateCreateActivity,
  activityController.createActivity,
);
router.delete('/:id', jwtAuth, roleAuth(UserRole.OWNER), activityController.deleteActivity);

export default router;
