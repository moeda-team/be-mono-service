import { Router } from 'express';
import { MenuIngredientController } from '../controllers/menu-ingredient.controller';
import { validateUpsertMenuIngredient } from '../validators/menu-ingredient.validator';
import { jwtAuth, requirePermission } from '../../../middlewares';
import { UserRole } from '../../../utils/auth/jwt';

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
