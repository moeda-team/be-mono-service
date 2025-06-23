import { Router } from 'express';
import { validateUpdateTransactionStatus } from '../validators/transaction.validator';
import { jwtAuth, roleAuth, basicAuth } from '../../../middlewares';
import { UserRole } from '../../../utils/auth/jwt';
import { OrderController } from '../controllers/order.controller';

const router = Router();
const orderController = new OrderController();

router.get('/list', jwtAuth, roleAuth(UserRole.EMPLOYEE), orderController.getOrderByTransactionId);
router.get('/status/:id', basicAuth, orderController.getTransaction);
router.patch(
  '/status/:id',
  jwtAuth,
  roleAuth(UserRole.EMPLOYEE),
  validateUpdateTransactionStatus,
  orderController.updateTransactionStatus,
);

export default router;
