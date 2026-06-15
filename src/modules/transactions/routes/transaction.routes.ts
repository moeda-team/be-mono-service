import { Router } from 'express';
import {
  validateCalculation,
  validateCheckTransactionStatus,
  validateCreateTransaction,
  validateUpdateTransactionStatus,
  validateUpdateTransactionTable,
  validateIngredientAvailability,
} from '../validators/transaction.validator';
import { basicAuth, jwtAuth, jwtAuthNotRequired, requirePermission } from '../../../middlewares';
import { UserRole } from '../../../utils/auth/jwt';
import { TransactionController } from '../controllers/transaction.controller';

/**
 * @openapi
 * /transactions/main:
 *   get:
 *     tags: [Transactions]
 *     summary: List transactions (min role EMPLOYEE)
 *     parameters:
 *       - $ref: '#/components/parameters/OutletIdQuery'
 *       - $ref: '#/components/parameters/PageQuery'
 *       - $ref: '#/components/parameters/LimitQuery'
 *       - $ref: '#/components/parameters/SearchQuery'
 *     responses:
 *       '200':
 *         description: OK
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/SuccessResponse'
 *                 - type: object
 *                   properties:
 *                     data:
 *                       type: array
 *                       items: { $ref: '#/components/schemas/Transaction' }
 *       '401': { $ref: '#/components/responses/Unauthorized' }
 *   post:
 *     tags: [Transactions]
 *     summary: Create a transaction
 *     description: Authentication optional (`jwtAuthNotRequired`). For ADMIN/OWNER the outlet is taken from the body `outletId`.
 *     security: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema: { $ref: '#/components/schemas/TransactionCreate' }
 *     responses:
 *       '200':
 *         description: Created
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/SuccessResponse'
 *                 - type: object
 *                   properties:
 *                     data: { $ref: '#/components/schemas/Transaction' }
 *       '400': { $ref: '#/components/responses/BadRequest' }
 *
 * /transactions/main/all/active:
 *   get:
 *     tags: [Transactions]
 *     summary: List active transactions (min role EMPLOYEE)
 *     parameters:
 *       - $ref: '#/components/parameters/OutletIdQuery'
 *     responses:
 *       '200':
 *         description: OK
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/SuccessResponse'
 *                 - type: object
 *                   properties:
 *                     data:
 *                       type: array
 *                       items: { $ref: '#/components/schemas/Transaction' }
 *       '401': { $ref: '#/components/responses/Unauthorized' }
 *
 * /transactions/main/check/status:
 *   post:
 *     tags: [Transactions]
 *     summary: Check a transaction's payment status
 *     security: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               paymentNumber: { type: string }
 *     responses:
 *       '200': { description: OK }
 *       '400': { $ref: '#/components/responses/BadRequest' }
 *
 * /transactions/main/calculate:
 *   post:
 *     tags: [Transactions]
 *     summary: Calculate a transaction total (preview, no persistence)
 *     security: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema: { $ref: '#/components/schemas/TransactionCreate' }
 *     responses:
 *       '200': { description: OK }
 *       '400': { $ref: '#/components/responses/BadRequest' }
 *
 * /transactions/main/{id}:
 *   get:
 *     tags: [Transactions]
 *     summary: Get a transaction by id
 *     description: Authentication optional (`jwtAuthNotRequired`).
 *     security: []
 *     parameters:
 *       - $ref: '#/components/parameters/IdPath'
 *     responses:
 *       '200':
 *         description: OK
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/SuccessResponse'
 *                 - type: object
 *                   properties:
 *                     data: { $ref: '#/components/schemas/Transaction' }
 *       '404': { $ref: '#/components/responses/NotFound' }
 *   delete:
 *     tags: [Transactions]
 *     summary: Delete a transaction (min role EMPLOYEE)
 *     parameters:
 *       - $ref: '#/components/parameters/IdPath'
 *     responses:
 *       '200': { description: Deleted }
 *       '401': { $ref: '#/components/responses/Unauthorized' }
 *       '404': { $ref: '#/components/responses/NotFound' }
 *
 * /transactions/main/status/{id}:
 *   patch:
 *     tags: [Transactions]
 *     summary: Update a transaction status (min role EMPLOYEE)
 *     parameters:
 *       - $ref: '#/components/parameters/IdPath'
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               status: { type: string, example: paid }
 *     responses:
 *       '200': { description: Updated }
 *       '400': { $ref: '#/components/responses/BadRequest' }
 *       '404': { $ref: '#/components/responses/NotFound' }
 *
 * /transactions/main/table/{id}:
 *   patch:
 *     tags: [Transactions]
 *     summary: Move a transaction to another table
 *     security: []
 *     parameters:
 *       - $ref: '#/components/parameters/IdPath'
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               tableId: { type: string, format: uuid }
 *               note: { type: string }
 *     responses:
 *       '200': { description: Updated }
 *       '400': { $ref: '#/components/responses/BadRequest' }
 *       '404': { $ref: '#/components/responses/NotFound' }
 */
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
  validateIngredientAvailability,
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
