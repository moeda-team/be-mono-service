import { Router } from 'express';
import { jwtAuth, roleAuth } from '../../../middlewares';
import { UserRole } from '../../../utils/jwt';
import { SalesController } from '../controllers/sales.controller';

const router = Router();
const salesController = new SalesController();

router.get(
  '/category/:type',
  jwtAuth,
  roleAuth(UserRole.EMPLOYEE),
  salesController.getTransactionCountByCategory,
);
router.get(
  '/method/:type',
  jwtAuth,
  roleAuth(UserRole.EMPLOYEE),
  salesController.getTransactionCountByPaymentMethod,
);
router.get(
  '/cashflow/:type',
  jwtAuth,
  roleAuth(UserRole.EMPLOYEE),
  salesController.getTransactionCashflow,
);

export default router;
