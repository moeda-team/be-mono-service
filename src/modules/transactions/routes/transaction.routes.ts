import { Router } from 'express';
import {
  validateCalculation,
  validateCheckTransactionStatus,
  validateCreateTransaction,
  validateUpdateTransactionStatus,
  validateUpdateTransactionTable,
} from '../validators/transaction.validator';
import { basicAuth, jwtAuth, jwtAuthNotRequired, requirePermission } from '../../../middlewares';
import { UserRole } from '../../../utils/auth/jwt';
import { TransactionController } from '../controllers/transaction.controller';

const router = Router();
const transactionController = new TransactionController();

router.get('/:id', jwtAuthNotRequired, transactionController.getTransactionById);
router.get(
  '/',
  jwtAuth,
  requirePermission(UserRole.EMPLOYEE),
  transactionController.getAllTransactions,
);
router.get(
  '/all/active',
  jwtAuth,
  requirePermission(UserRole.EMPLOYEE),
  transactionController.getAllActiveTransactions,
);
router.post(
  '/check/status',
  validateCheckTransactionStatus,
  transactionController.checkTransactionStatus,
);
router.post('/calculate', validateCalculation, transactionController.calculateTransaction);
router.post(
  '/',
  jwtAuthNotRequired,
  validateCreateTransaction,
  transactionController.createTransaction,
);
router.patch(
  '/status/:id',
  jwtAuth,
  requirePermission(UserRole.EMPLOYEE),
  validateUpdateTransactionStatus,
  transactionController.updateTransactionStatus,
);
router.patch(
  '/table/:id',
  jwtAuthNotRequired,
  validateUpdateTransactionTable,
  transactionController.updateTransactionTable,
);
router.delete(
  '/:id',
  jwtAuth,
  requirePermission(UserRole.EMPLOYEE),
  transactionController.deleteTransaction,
);

export default router;
