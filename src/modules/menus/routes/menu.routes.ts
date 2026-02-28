import { Router } from 'express';
import { MenuController } from '../controllers/menu.controller';
import { validateCreateMenu, validateUpdateMenu } from '../validators/menu.validator';
import { jwtAuth, jwtAuthNotRequired, requirePermission } from '../../../middlewares';
import { UserRole } from '../../../utils/auth/jwt';
import menuIngredientRoutes from './menu-ingredient.routes';

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

export default router;
