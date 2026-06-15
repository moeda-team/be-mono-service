import { Router } from 'express';
import { DiscountMenuController } from '../controllers/discount-menu.controller';
import { validateCreateDiscountMenu } from '../validators/discount-menu.validator';
import { jwtAuth, requirePermission } from '../../../middlewares';
import { UserRole } from '../../../utils/auth/jwt';

/**
 * @openapi
 * /discounts/menus:
 *   post:
 *     tags: [Discount Menus]
 *     summary: Link a discount to menus (min role STORE_MANAGER)
 *     parameters:
 *       - $ref: '#/components/parameters/OutletIdQuery'
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema: { $ref: '#/components/schemas/DiscountMenuCreate' }
 *     responses:
 *       '200': { description: Linked }
 *       '400': { $ref: '#/components/responses/BadRequest' }
 *       '403': { $ref: '#/components/responses/Forbidden' }
 *
 * /discounts/menus/{discountId}/{menuId}:
 *   delete:
 *     tags: [Discount Menus]
 *     summary: Unlink a discount from a menu (min role STORE_MANAGER)
 *     parameters:
 *       - name: discountId
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
const discountMenuController = new DiscountMenuController();

router.post(
  '/',
  jwtAuth,
  requirePermission(UserRole.STORE_MANAGER),
  validateCreateDiscountMenu,
  discountMenuController.createDiscountMenu,
);

router.delete(
  '/:discountId/:menuId',
  jwtAuth,
  requirePermission(UserRole.STORE_MANAGER),
  discountMenuController.deleteDiscountMenu,
);

export default router;
