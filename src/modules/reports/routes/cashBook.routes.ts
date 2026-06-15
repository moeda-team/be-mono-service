import { Router } from 'express';
import { CashBookController } from '../controllers/cashBook.controller';
import { jwtAuth, jwtAuthNotRequired, requirePermission } from '../../../middlewares';
import { UserRole } from '../../../utils/auth/jwt';
import { validateCashBookId, validateCashBookListQuery } from '../validators/cashBook.validator';

/**
 * @openapi
 * /reports/cash-books:
 *   get:
 *     tags: [Cash Books]
 *     summary: List cash books (min role EMPLOYEE)
 *     parameters:
 *       - $ref: '#/components/parameters/OutletIdQuery'
 *       - $ref: '#/components/parameters/PageQuery'
 *       - $ref: '#/components/parameters/LimitQuery'
 *     responses:
 *       '200': { description: OK }
 *       '401': { $ref: '#/components/responses/Unauthorized' }
 *   post:
 *     tags: [Cash Books]
 *     summary: Open a new cash book (min role STORE_MANAGER)
 *     parameters:
 *       - $ref: '#/components/parameters/OutletIdQuery'
 *     requestBody:
 *       required: false
 *       content:
 *         application/json:
 *           schema: { type: object, additionalProperties: true }
 *     responses:
 *       '200': { description: Created }
 *       '403': { $ref: '#/components/responses/Forbidden' }
 *
 * /reports/cash-books/check:
 *   get:
 *     tags: [Cash Books]
 *     summary: Check whether an open cash book exists
 *     security: []
 *     parameters:
 *       - $ref: '#/components/parameters/OutletIdQuery'
 *     responses:
 *       '200': { description: OK }
 *
 * /reports/cash-books/close:
 *   patch:
 *     tags: [Cash Books]
 *     summary: Close the open cash book (min role STORE_MANAGER)
 *     parameters:
 *       - $ref: '#/components/parameters/OutletIdQuery'
 *     responses:
 *       '200': { description: Closed }
 *       '403': { $ref: '#/components/responses/Forbidden' }
 *
 * /reports/cash-books/{cashBookId}:
 *   get:
 *     tags: [Cash Books]
 *     summary: Get a cash book report with transactions (min role EMPLOYEE)
 *     parameters:
 *       - name: cashBookId
 *         in: path
 *         required: true
 *         schema: { type: string, format: uuid }
 *     responses:
 *       '200': { description: OK }
 *       '404': { $ref: '#/components/responses/NotFound' }
 *
 * /reports/cash-books/{cashBookId}/download:
 *   get:
 *     tags: [Cash Books]
 *     summary: Download a cash book report (min role EMPLOYEE)
 *     parameters:
 *       - name: cashBookId
 *         in: path
 *         required: true
 *         schema: { type: string, format: uuid }
 *     responses:
 *       '200':
 *         description: Binary file
 *         content:
 *           application/octet-stream:
 *             schema: { type: string, format: binary }
 *       '404': { $ref: '#/components/responses/NotFound' }
 *
 * /reports/cash-books/{cashBookId}/closing:
 *   get:
 *     tags: [Cash Books]
 *     summary: Get the closing report (receipt structure) (min role EMPLOYEE)
 *     parameters:
 *       - name: cashBookId
 *         in: path
 *         required: true
 *         schema: { type: string, format: uuid }
 *     responses:
 *       '200': { description: OK }
 *       '404': { $ref: '#/components/responses/NotFound' }
 */
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
router.get(
  '/:cashBookId/download',
  jwtAuth,
  requirePermission(UserRole.EMPLOYEE),
  validateCashBookId,
  cashBookController.downloadCashBookReport,
);

// Get closing report (matches receipt structure)
router.get(
  '/:cashBookId/closing',
  jwtAuth,
  requirePermission(UserRole.EMPLOYEE),
  validateCashBookId,
  cashBookController.getClosingReport,
);

// Close a cash book
router.patch(
  '/close',
  jwtAuth,
  requirePermission(UserRole.STORE_MANAGER),
  cashBookController.closeCashBook,
);

export default router;
