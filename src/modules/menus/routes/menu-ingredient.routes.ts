import { Router } from 'express';
import { MenuIngredientController } from '../controllers/menu-ingredient.controller';
import { validateUpsertMenuIngredient } from '../validators/menu-ingredient.validator';
import { jwtAuth, requirePermission } from '../../../middlewares';
import { UserRole } from '../../../utils/auth/jwt';

/**
 * @openapi
 * /menus/main/ingredients:
 *   put:
 *     tags: [Menu Ingredients]
 *     summary: Upsert menu ingredients (single or bulk, min role STORE_MANAGER)
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema: { $ref: '#/components/schemas/MenuIngredientUpsert' }
 *     responses:
 *       '200':
 *         description: Upserted
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/SuccessResponse'
 *                 - type: object
 *                   properties:
 *                     data:
 *                       type: array
 *                       items: { $ref: '#/components/schemas/MenuIngredient' }
 *       '400': { $ref: '#/components/responses/BadRequest' }
 *       '403': { $ref: '#/components/responses/Forbidden' }
 *
 * /menus/main/ingredients/menu/{menuId}:
 *   get:
 *     tags: [Menu Ingredients]
 *     summary: List ingredients for a menu
 *     parameters:
 *       - name: menuId
 *         in: path
 *         required: true
 *         schema: { type: string, format: uuid }
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
 *                       items: { $ref: '#/components/schemas/MenuIngredient' }
 *       '401': { $ref: '#/components/responses/Unauthorized' }
 *
 * /menus/main/ingredients/menu/{menuId}/ingredient/{ingredientId}:
 *   delete:
 *     tags: [Menu Ingredients]
 *     summary: Remove an ingredient from a menu (min role STORE_MANAGER)
 *     parameters:
 *       - name: menuId
 *         in: path
 *         required: true
 *         schema: { type: string, format: uuid }
 *       - name: ingredientId
 *         in: path
 *         required: true
 *         schema: { type: string, format: uuid }
 *     responses:
 *       '200': { description: Removed }
 *       '403': { $ref: '#/components/responses/Forbidden' }
 *       '404': { $ref: '#/components/responses/NotFound' }
 */
const router = Router();
const menuIngredientController = new MenuIngredientController();

// Upsert menu ingredient (create or update) - handles both single and bulk
router.put(
  '/',
  jwtAuth,
  requirePermission(UserRole.STORE_MANAGER),
  validateUpsertMenuIngredient,
  menuIngredientController.upsertMenuIngredient,
);

// Get all ingredients for a specific menu
router.get('/menu/:menuId', jwtAuth, menuIngredientController.getMenuIngredients);

// Remove ingredient from menu
router.delete(
  '/menu/:menuId/ingredient/:ingredientId',
  jwtAuth,
  requirePermission(UserRole.STORE_MANAGER),
  menuIngredientController.removeIngredientFromMenu,
);

export default router;
