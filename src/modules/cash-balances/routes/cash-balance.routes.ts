import { Router } from 'express';
import { CashBalanceController } from '../controllers/cash-balance.controller';
import { LogCashBalanceController } from '../controllers/log-cash-balance.controller';
import {
  validateCreateCashBalance,
  validateUpdateLogCashBalance,
} from '../validators/cash-balance.validator';
import { jwtAuth, requirePermission } from '../../../middlewares';
import { UserRole } from '../../../utils/auth/jwt';

const router = Router();
const cashBalanceController = new CashBalanceController();
const logCashBalanceController = new LogCashBalanceController();

// Cash Balance routes
router.get(
  '/',
  jwtAuth,
  requirePermission(UserRole.EMPLOYEE),
  cashBalanceController.getAllCashBalances,
);
router.get(
  '/current',
  jwtAuth,
  requirePermission(UserRole.EMPLOYEE),
  cashBalanceController.getCashBalanceCurrent,
);

// Log Cash Balance routes
router.get(
  '/logs',
  jwtAuth,
  requirePermission(UserRole.EMPLOYEE),
  logCashBalanceController.getAllLogCashBalances,
);
router.get(
  '/logs/:id',
  jwtAuth,
  requirePermission(UserRole.EMPLOYEE),
  logCashBalanceController.getLogCashBalanceById,
);
router.post(
  '/logs',
  jwtAuth,
  requirePermission(UserRole.STORE_MANAGER),
  validateCreateCashBalance,
  logCashBalanceController.createLogCashBalance,
);
router.put(
  '/logs/:id',
  jwtAuth,
  requirePermission(UserRole.STORE_MANAGER),
  validateUpdateLogCashBalance,
  logCashBalanceController.updateLogCashBalance,
);

export default router;
