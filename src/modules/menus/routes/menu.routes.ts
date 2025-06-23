import { Router } from 'express';
import { MenuController } from '../controllers/menu.controller';
import { validateCreateMenu, validateUpdateMenu } from '../validators/menu.validator';
import { HealthController } from '../controllers/health.controller';
import { basicAuth, jwtAuth, roleAuth } from '../../../middlewares';
import { UserRole } from '../../../utils/auth/jwt';

const router = Router();
const menuController = new MenuController();
const healthController = new HealthController();

router.get('/health', healthController.check);
router.get('/:outletId', basicAuth, menuController.getAllMenus);
router.get('/:outletId/:id', basicAuth, menuController.getMenuById);
router.post(
  '/',
  jwtAuth,
  roleAuth(UserRole.STORE_MANAGER),
  validateCreateMenu,
  menuController.createMenu,
);
router.put(
  '/:id',
  jwtAuth,
  roleAuth(UserRole.STORE_MANAGER),
  validateUpdateMenu,
  menuController.updateMenu,
);
router.delete('/:id', jwtAuth, roleAuth(UserRole.STORE_MANAGER), menuController.deleteMenu);

router.get('/list/best/:outletId', basicAuth, menuController.getBestMenus);
router.get('/list/category/:outletId/:categoryId', basicAuth, menuController.getMenusByCategory);

export default router;
