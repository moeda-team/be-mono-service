import { Router } from 'express';
import { IngredientsController } from '../controllers/ingredient.controller';
import {
  validateCreateIngredient,
  validateUpdateIngredient,
} from '../validators/ingredient.validator';
import { HealthController } from '../controllers/health.controller';
import { jwtAuth, roleAuth } from '../../../middlewares';
import { UserRole } from '../../../utils/auth/jwt';

const router = Router();
const ingredientController = new IngredientsController();
const healthController = new HealthController();

router.get('/health', healthController.check);
router.get('/:id', jwtAuth, roleAuth(UserRole.EMPLOYEE), ingredientController.getIngredientsById);
router.get('/', jwtAuth, roleAuth(UserRole.EMPLOYEE), ingredientController.getAllIngredients);
router.post(
  '/',
  jwtAuth,
  roleAuth(UserRole.STORE_MANAGER),
  validateCreateIngredient,
  ingredientController.createIngredients,
);
router.put(
  '/:id',
  jwtAuth,
  roleAuth(UserRole.STORE_MANAGER),
  validateUpdateIngredient,
  ingredientController.updateIngredients,
);
router.delete(
  '/:id',
  jwtAuth,
  roleAuth(UserRole.STORE_MANAGER),
  ingredientController.deleteIngredients,
);

export default router;
