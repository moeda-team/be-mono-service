import { Router } from 'express';
import { DiscountController } from '../controllers/discount.controller';
import { validateCreateDiscount, validateUpdateDiscount } from '../validators/discount.validator';
import { HealthController } from '../controllers/health.controller';
import { jwtAuthNotRequired, jwtAuth, roleAuth } from '../../../middlewares';
import { UserRole } from '../../../utils/auth/jwt';
import discountMenuRoutes from './discount-menu.routes';

const router = Router();
const discountController = new DiscountController();
const healthController = new HealthController();

// Discount Menu routes
router.use('/menus', discountMenuRoutes);

router.get('/health', healthController.check);
router.get('/:code/detail', jwtAuthNotRequired, discountController.getDiscountByName);
router.get('/', jwtAuth, roleAuth(UserRole.EMPLOYEE), discountController.getAllDiscounts);
router.post(
  '/',
  jwtAuth,
  roleAuth(UserRole.STORE_MANAGER),
  validateCreateDiscount,
  discountController.createDiscount,
);
router.put(
  '/:id',
  jwtAuth,
  roleAuth(UserRole.STORE_MANAGER),
  validateUpdateDiscount,
  discountController.updateDiscount,
);
router.delete('/:id', jwtAuth, roleAuth(UserRole.STORE_MANAGER), discountController.deleteDiscount);

export default router;
