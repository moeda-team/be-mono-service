import { Router } from 'express';
import {
  validateCreateTransaction,
  validateUpdateTransactionStatus,
} from '../validators/transaction.validator';
import { HealthController } from '../controllers/health.controller';
import { basicAuth, jwtAuth, jwtAuthNotRequired, roleAuth } from '../../../middlewares';
import { UserRole } from '../../../utils/auth/jwt';
import { TransactionController } from '../controllers/transaction.controller';

const router = Router();
const transactionController = new TransactionController();
const healthController = new HealthController();

router.get('/health', healthController.check);
router.get('/:id', basicAuth, transactionController.getTransactionById);
router.get('/', jwtAuth, roleAuth(UserRole.EMPLOYEE), transactionController.getAllTransactions);
router.post(
  '/',
  jwtAuthNotRequired,
  validateCreateTransaction,
  transactionController.createTransaction,
);
router.patch(
  '/status/:id',
  jwtAuth,
  roleAuth(UserRole.EMPLOYEE),
  validateUpdateTransactionStatus,
  transactionController.updateTransactionStatus,
);
router.delete(
  '/:id',
  jwtAuth,
  roleAuth(UserRole.EMPLOYEE),
  transactionController.deleteTransaction,
);

export default router;
