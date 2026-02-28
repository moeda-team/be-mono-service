import { Router } from 'express';
import { DiscountMenuController } from '../controllers/discount-menu.controller';
import { validateCreateDiscountMenu } from '../validators/discount-menu.validator';
import { jwtAuth, requirePermission } from '../../../middlewares';
import { UserRole } from '../../../utils/auth/jwt';

const router = Router();
const discountMenuController = new DiscountMenuController();

router.post(
  '/',
  jwtAuth,
  requirePermission(UserRole.STORE_MANAGER),
  validateCreateDiscountMenu,
  discountMenuController.createDiscountMenu,
);

router.delete(
  '/:discountId/:menuId',
  jwtAuth,
  requirePermission(UserRole.STORE_MANAGER),
  discountMenuController.deleteDiscountMenu,
);

export default router;
