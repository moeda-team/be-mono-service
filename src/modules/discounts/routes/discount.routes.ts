import { Router } from 'express';
import { DiscountController } from '../controllers/discount.controller';
import { validateCreateDiscount, validateUpdateDiscount } from '../validators/discount.validator';
import { jwtAuthNotRequired, jwtAuth, requirePermission } from '../../../middlewares';
import { UserRole } from '../../../utils/auth/jwt';
import discountMenuRoutes from './discount-menu.routes';

/**
 * @openapi
 * /discounts:
 *   get:
 *     tags: [Discounts]
 *     summary: List discounts (min role EMPLOYEE)
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
 *                       items: { $ref: '#/components/schemas/Discount' }
 *       '401': { $ref: '#/components/responses/Unauthorized' }
 *   post:
 *     tags: [Discounts]
 *     summary: Create a discount (min role STORE_MANAGER)
 *     parameters:
 *       - $ref: '#/components/parameters/OutletIdQuery'
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema: { $ref: '#/components/schemas/DiscountCreate' }
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
 *                     data: { $ref: '#/components/schemas/Discount' }
 *       '400': { $ref: '#/components/responses/BadRequest' }
 *       '403': { $ref: '#/components/responses/Forbidden' }
 *
 * /discounts/{code}/detail:
 *   get:
 *     tags: [Discounts]
 *     summary: Get a discount by code/name
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
 *                     data: { $ref: '#/components/schemas/Discount' }
 *       '404': { $ref: '#/components/responses/NotFound' }
 *
 * /discounts/{id}:
 *   put:
 *     tags: [Discounts]
 *     summary: Update a discount (min role STORE_MANAGER)
 *     parameters:
 *       - $ref: '#/components/parameters/IdPath'
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema: { $ref: '#/components/schemas/DiscountCreate' }
 *     responses:
 *       '200': { description: Updated }
 *       '400': { $ref: '#/components/responses/BadRequest' }
 *       '403': { $ref: '#/components/responses/Forbidden' }
 *       '404': { $ref: '#/components/responses/NotFound' }
 *   delete:
 *     tags: [Discounts]
 *     summary: Delete a discount (min role STORE_MANAGER)
 *     parameters:
 *       - $ref: '#/components/parameters/IdPath'
 *     responses:
 *       '200': { description: Deleted }
 *       '403': { $ref: '#/components/responses/Forbidden' }
 *       '404': { $ref: '#/components/responses/NotFound' }
 */
const router = Router();
const discountController = new DiscountController();

// Discount Menu routes
router.use('/menus', discountMenuRoutes);

router.get('/:code/detail', jwtAuthNotRequired, discountController.getDiscountByName);
router.get('/', jwtAuth, requirePermission(UserRole.EMPLOYEE), discountController.getAllDiscounts);
router.post(
  '/',
  jwtAuth,
  requirePermission(UserRole.STORE_MANAGER),
  validateCreateDiscount,
  discountController.createDiscount,
);
router.put(
  '/:id',
  jwtAuth,
  requirePermission(UserRole.STORE_MANAGER),
  validateUpdateDiscount,
  discountController.updateDiscount,
);
router.delete(
  '/:id',
  jwtAuth,
  requirePermission(UserRole.STORE_MANAGER),
  discountController.deleteDiscount,
);

export default router;
