import { Router } from 'express';
import { CashBalanceController } from '../controllers/cash-balance.controller';
import { LogCashBalanceController } from '../controllers/log-cash-balance.controller';
import {
  validateCreateCashBalance,
  validateUpdateLogCashBalance,
} from '../validators/cash-balance.validator';
import { jwtAuth, requirePermission } from '../../../middlewares';
import { UserRole } from '../../../utils/auth/jwt';

/**
 * @openapi
 * /cash-balances:
 *   get:
 *     tags: [Cash Balances]
 *     summary: List cash balances (min role EMPLOYEE)
 *     parameters:
 *       - $ref: '#/components/parameters/OutletIdQuery'
 *       - $ref: '#/components/parameters/PageQuery'
 *       - $ref: '#/components/parameters/LimitQuery'
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
 *                       items: { $ref: '#/components/schemas/CashBalance' }
 *       '401': { $ref: '#/components/responses/Unauthorized' }
 *
 * /cash-balances/current:
 *   get:
 *     tags: [Cash Balances]
 *     summary: Get the current (active) cash balance (min role EMPLOYEE)
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
 *                     data: { $ref: '#/components/schemas/CashBalance' }
 *       '401': { $ref: '#/components/responses/Unauthorized' }
 *
 * /cash-balances/logs:
 *   get:
 *     tags: [Cash Balances]
 *     summary: List cash balance logs (min role EMPLOYEE)
 *     parameters:
 *       - $ref: '#/components/parameters/OutletIdQuery'
 *       - $ref: '#/components/parameters/PageQuery'
 *       - $ref: '#/components/parameters/LimitQuery'
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
 *                       items: { $ref: '#/components/schemas/LogCashBalance' }
 *       '401': { $ref: '#/components/responses/Unauthorized' }
 *   post:
 *     tags: [Cash Balances]
 *     summary: Create a cash balance log entry (min role STORE_MANAGER)
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema: { $ref: '#/components/schemas/LogCashBalanceCreate' }
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
 *                     data: { $ref: '#/components/schemas/LogCashBalance' }
 *       '400': { $ref: '#/components/responses/BadRequest' }
 *       '403': { $ref: '#/components/responses/Forbidden' }
 *
 * /cash-balances/logs/{id}:
 *   get:
 *     tags: [Cash Balances]
 *     summary: Get a cash balance log by id (min role EMPLOYEE)
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
 *                     data: { $ref: '#/components/schemas/LogCashBalance' }
 *       '404': { $ref: '#/components/responses/NotFound' }
 *   put:
 *     tags: [Cash Balances]
 *     summary: Update / cancel a cash balance log (min role STORE_MANAGER)
 *     parameters:
 *       - $ref: '#/components/parameters/IdPath'
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               status: { type: string, example: cancelled }
 *               cancelNote: { type: string }
 *     responses:
 *       '200': { description: Updated }
 *       '400': { $ref: '#/components/responses/BadRequest' }
 *       '404': { $ref: '#/components/responses/NotFound' }
 */
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
