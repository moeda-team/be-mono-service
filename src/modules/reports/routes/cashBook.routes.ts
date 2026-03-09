import { Router } from 'express';
import { CashBookController } from '../controllers/cashBook.controller';
import { jwtAuth, jwtAuthNotRequired, requirePermission } from '../../../middlewares';
import { UserRole } from '../../../utils/auth/jwt';
import { validateCashBookId, validateCashBookListQuery } from '../validators/cashBook.validator';

const router = Router();
const cashBookController = new CashBookController();

// Get all cash books for the outlet
router.get(
  '/',
  jwtAuth,
  requirePermission(UserRole.EMPLOYEE),
  validateCashBookListQuery,
  cashBookController.getCashBooks,
);

// Create a new cash book
router.post(
  '/',
  jwtAuth,
  requirePermission(UserRole.STORE_MANAGER),
  cashBookController.createCashBook,
);

// Check if there's an open cash book
router.get('/check', jwtAuthNotRequired, cashBookController.checkOpenCashBook);

// Get specific cash book report with transactions
router.get(
  '/:cashBookId',
  jwtAuth,
  requirePermission(UserRole.EMPLOYEE),
  validateCashBookId,
  cashBookController.getCashBookReport,
);
router.post(
  '/:cashBookId/download',
  jwtAuth,
  requirePermission(UserRole.EMPLOYEE),
  validateCashBookId,
  cashBookController.downloadCashBookReport,
);

// Close a cash book
router.patch(
  '/close',
  jwtAuth,
  requirePermission(UserRole.STORE_MANAGER),
  cashBookController.closeCashBook,
);

export default router;
