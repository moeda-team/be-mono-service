import { Router } from 'express';
import { VoucherMenuController } from '../controllers/voucher-menu.controller';
import { validateCreateVoucherMenu } from '../validators/voucher-menu.validator';
import { jwtAuth, requirePermission } from '../../../middlewares';
import { UserRole } from '../../../utils/auth/jwt';

/**
 * @openapi
 * /vouchers/menus:
 *   post:
 *     tags: [Voucher Menus]
 *     summary: Link a voucher to menus (min role STORE_MANAGER)
 *     parameters:
 *       - $ref: '#/components/parameters/OutletIdQuery'
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema: { $ref: '#/components/schemas/VoucherMenuCreate' }
 *     responses:
 *       '200': { description: Linked }
 *       '400': { $ref: '#/components/responses/BadRequest' }
 *       '403': { $ref: '#/components/responses/Forbidden' }
 *
 * /vouchers/menus/{voucherId}/{menuId}:
 *   delete:
 *     tags: [Voucher Menus]
 *     summary: Unlink a voucher from a menu (min role STORE_MANAGER)
 *     parameters:
 *       - name: voucherId
 *         in: path
 *         required: true
 *         schema: { type: string, format: uuid }
 *       - name: menuId
 *         in: path
 *         required: true
 *         schema: { type: string, format: uuid }
 *     responses:
 *       '200': { description: Unlinked }
 *       '403': { $ref: '#/components/responses/Forbidden' }
 *       '404': { $ref: '#/components/responses/NotFound' }
 */
const router = Router();
const voucherMenuController = new VoucherMenuController();

router.post(
  '/',
  jwtAuth,
  requirePermission(UserRole.STORE_MANAGER),
  validateCreateVoucherMenu,
  voucherMenuController.createVoucherMenu,
);

router.delete(
  '/:voucherId/:menuId',
  jwtAuth,
  requirePermission(UserRole.STORE_MANAGER),
  voucherMenuController.deleteVoucherMenu,
);

export default router;
