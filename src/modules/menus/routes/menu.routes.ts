import { Router } from 'express';
import { MenuController } from '../controllers/menu.controller';
import {
  validateCreateMenu,
  validateUpdateMenu,
  validateUpdateMenuStatus,
} from '../validators/menu.validator';
import { jwtAuth, jwtAuthNotRequired, requirePermission } from '../../../middlewares';
import { UserRole } from '../../../utils/auth/jwt';
import menuIngredientRoutes from './menu-ingredient.routes';

/**
 * @openapi
 * /menus/main:
 *   get:
 *     tags: [Menus]
 *     summary: List menus
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
 *                       items: { $ref: '#/components/schemas/Menu' }
 *   post:
 *     tags: [Menus]
 *     summary: Create a menu (min role STORE_MANAGER)
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema: { $ref: '#/components/schemas/MenuCreate' }
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
 *                     data: { $ref: '#/components/schemas/Menu' }
 *       '400': { $ref: '#/components/responses/BadRequest' }
 *       '403': { $ref: '#/components/responses/Forbidden' }
 *
 * /menus/main/{id}:
 *   get:
 *     tags: [Menus]
 *     summary: Get a menu by id
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
 *                     data: { $ref: '#/components/schemas/Menu' }
 *       '404': { $ref: '#/components/responses/NotFound' }
 *   put:
 *     tags: [Menus]
 *     summary: Update a menu (min role STORE_MANAGER)
 *     parameters:
 *       - $ref: '#/components/parameters/IdPath'
 *       - $ref: '#/components/parameters/OutletIdQuery'
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema: { $ref: '#/components/schemas/MenuCreate' }
 *     responses:
 *       '200': { description: Updated }
 *       '400': { $ref: '#/components/responses/BadRequest' }
 *       '403': { $ref: '#/components/responses/Forbidden' }
 *       '404': { $ref: '#/components/responses/NotFound' }
 *   delete:
 *     tags: [Menus]
 *     summary: Delete a menu (min role STORE_MANAGER)
 *     parameters:
 *       - $ref: '#/components/parameters/IdPath'
 *     responses:
 *       '200': { description: Deleted }
 *       '403': { $ref: '#/components/responses/Forbidden' }
 *       '404': { $ref: '#/components/responses/NotFound' }
 *
 * /menus/main/{id}/status:
 *   patch:
 *     tags: [Menus]
 *     summary: Toggle a menu's active status (min role STORE_MANAGER)
 *     parameters:
 *       - $ref: '#/components/parameters/IdPath'
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               isActive: { type: boolean }
 *     responses:
 *       '200': { description: Updated }
 *       '400': { $ref: '#/components/responses/BadRequest' }
 *       '404': { $ref: '#/components/responses/NotFound' }
 */
const router = Router();
const menuController = new MenuController();

// Menu ingredient routes
router.use('/ingredients', menuIngredientRoutes);

router.get('/', jwtAuthNotRequired, menuController.getAllMenus);
router.get('/:id', jwtAuthNotRequired, menuController.getMenuById);
router.post(
  '/',
  jwtAuth,
  requirePermission(UserRole.STORE_MANAGER),
  validateCreateMenu,
  menuController.createMenu,
);
router.put(
  '/:id',
  jwtAuth,
  requirePermission(UserRole.STORE_MANAGER),
  validateUpdateMenu,
  menuController.updateMenu,
);
router.delete(
  '/:id',
  jwtAuth,
  requirePermission(UserRole.STORE_MANAGER),
  menuController.deleteMenu,
);
router.patch(
  '/:id/status',
  jwtAuth,
  requirePermission(UserRole.STORE_MANAGER),
  validateUpdateMenuStatus,
  menuController.updateMenuStatus,
);

export default router;
