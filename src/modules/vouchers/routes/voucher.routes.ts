import { Router } from 'express';
import { VoucherController } from '../controllers/voucher.controller';
import { validateCreateVoucher, validateUpdateVoucher } from '../validators/voucher.validator';
import { jwtAuthNotRequired, jwtAuth, requirePermission } from '../../../middlewares';
import { UserRole } from '../../../utils/auth/jwt';
import voucherMenuRoutes from './voucher-menu.routes';

/**
 * @openapi
 * /vouchers:
 *   get:
 *     tags: [Vouchers]
 *     summary: List vouchers (min role EMPLOYEE)
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
 *                       items: { $ref: '#/components/schemas/Voucher' }
 *       '401': { $ref: '#/components/responses/Unauthorized' }
 *   post:
 *     tags: [Vouchers]
 *     summary: Create a voucher (min role STORE_MANAGER)
 *     parameters:
 *       - $ref: '#/components/parameters/OutletIdQuery'
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema: { $ref: '#/components/schemas/VoucherCreate' }
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
 *                     data: { $ref: '#/components/schemas/Voucher' }
 *       '400': { $ref: '#/components/responses/BadRequest' }
 *       '403': { $ref: '#/components/responses/Forbidden' }
 *
 * /vouchers/{code}/detail:
 *   get:
 *     tags: [Vouchers]
 *     summary: Get a voucher by code/name
 *     security: []
 *     parameters:
 *       - name: code
 *         in: path
 *         required: true
 *         schema: { type: string }
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
 *                     data: { $ref: '#/components/schemas/Voucher' }
 *       '404': { $ref: '#/components/responses/NotFound' }
 *
 * /vouchers/{id}:
 *   put:
 *     tags: [Vouchers]
 *     summary: Update a voucher (min role STORE_MANAGER)
 *     parameters:
 *       - $ref: '#/components/parameters/IdPath'
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema: { $ref: '#/components/schemas/VoucherCreate' }
 *     responses:
 *       '200': { description: Updated }
 *       '400': { $ref: '#/components/responses/BadRequest' }
 *       '403': { $ref: '#/components/responses/Forbidden' }
 *       '404': { $ref: '#/components/responses/NotFound' }
 *   delete:
 *     tags: [Vouchers]
 *     summary: Delete a voucher (min role STORE_MANAGER)
 *     parameters:
 *       - $ref: '#/components/parameters/IdPath'
 *     responses:
 *       '200': { description: Deleted }
 *       '403': { $ref: '#/components/responses/Forbidden' }
 *       '404': { $ref: '#/components/responses/NotFound' }
 */
const router = Router();
const voucherController = new VoucherController();

// Voucher Menu routes
router.use('/menus', voucherMenuRoutes);

router.get('/:code/detail', jwtAuthNotRequired, voucherController.getVoucherByName);
router.get('/', jwtAuth, requirePermission(UserRole.EMPLOYEE), voucherController.getAllVouchers);
router.post(
  '/',
  jwtAuth,
  requirePermission(UserRole.STORE_MANAGER),
  validateCreateVoucher,
  voucherController.createVoucher,
);
router.put(
  '/:id',
  jwtAuth,
  requirePermission(UserRole.STORE_MANAGER),
  validateUpdateVoucher,
  voucherController.updateVoucher,
);
router.delete(
  '/:id',
  jwtAuth,
  requirePermission(UserRole.STORE_MANAGER),
  voucherController.deleteVoucher,
);

export default router;
