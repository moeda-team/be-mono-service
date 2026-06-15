import { Router } from 'express';
import { BestSellerMenuController } from '../controllers/best-seller-menu.controller';
import { validateCreateBestSellerMenu } from '../validators/best-seller-menu.validator';
import { jwtAuth, requirePermission, jwtAuthNotRequired } from '../../../middlewares';
import { UserRole } from '../../../utils/auth/jwt';

/**
 * @openapi
 * /menus/best-seller:
 *   get:
 *     tags: [Best Seller]
 *     summary: List best seller menus
 *     security: []
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
 *                       items: { $ref: '#/components/schemas/BestSellerMenu' }
 *   post:
 *     tags: [Best Seller]
 *     summary: Add a menu to the best seller list (min role STORE_MANAGER)
 *     parameters:
 *       - $ref: '#/components/parameters/OutletIdQuery'
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema: { $ref: '#/components/schemas/BestSellerMenuCreate' }
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
 *                     data: { $ref: '#/components/schemas/BestSellerMenu' }
 *       '400': { $ref: '#/components/responses/BadRequest' }
 *       '403': { $ref: '#/components/responses/Forbidden' }
 *
 * /menus/best-seller/{id}:
 *   get:
 *     tags: [Best Seller]
 *     summary: Get a best seller entry by id
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
 *                     data: { $ref: '#/components/schemas/BestSellerMenu' }
 *       '404': { $ref: '#/components/responses/NotFound' }
 *   delete:
 *     tags: [Best Seller]
 *     summary: Remove a menu from the best seller list (min role STORE_MANAGER)
 *     parameters:
 *       - $ref: '#/components/parameters/IdPath'
 *       - $ref: '#/components/parameters/OutletIdQuery'
 *     responses:
 *       '200': { description: Removed }
 *       '403': { $ref: '#/components/responses/Forbidden' }
 *       '404': { $ref: '#/components/responses/NotFound' }
 */
const router = Router();
const bestSellerMenuController = new BestSellerMenuController();

router.get('/', jwtAuthNotRequired, bestSellerMenuController.getAllBestSellerMenus);
router.get('/:id', jwtAuthNotRequired, bestSellerMenuController.getBestSellerMenuById);
router.post(
  '/',
  jwtAuth,
  requirePermission(UserRole.STORE_MANAGER),
  validateCreateBestSellerMenu,
  bestSellerMenuController.createBestSellerMenu,
);
router.delete(
  '/:id',
  jwtAuth,
  requirePermission(UserRole.STORE_MANAGER),
  bestSellerMenuController.deleteBestSellerMenu,
);

export default router;
