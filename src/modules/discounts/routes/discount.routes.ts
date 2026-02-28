import { Router } from 'express';
import { DiscountController } from '../controllers/discount.controller';
import { validateCreateDiscount, validateUpdateDiscount } from '../validators/discount.validator';
import { jwtAuthNotRequired, jwtAuth, requirePermission } from '../../../middlewares';
import { UserRole } from '../../../utils/auth/jwt';
import discountMenuRoutes from './discount-menu.routes';

const router = Router();
const discountController = new DiscountController();

// Discount Menu routes
router.use('/menus', discountMenuRoutes);

router.get('/:code/detail', jwtAuthNotRequired, discountController.getDiscountByName);
router.get('/', jwtAuth, requirePermission(UserRole.EMPLOYEE), discountController.getAllDiscounts);
router.post(
  '/',
  jwtAuth,
  requirePermission(UserRole.STORE_MANAGER),
  validateCreateDiscount,
  discountController.createDiscount,
);
router.put(
  '/:id',
  jwtAuth,
  requirePermission(UserRole.STORE_MANAGER),
  validateUpdateDiscount,
  discountController.updateDiscount,
);
router.delete(
  '/:id',
  jwtAuth,
  requirePermission(UserRole.STORE_MANAGER),
  discountController.deleteDiscount,
);

export default router;
