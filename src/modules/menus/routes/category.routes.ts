import { Router } from 'express';
import { CategoryController } from '../controllers/category.controller';
import { jwtAuth, roleAuth, basicAuth } from '../../../middlewares';
import { UserRole } from '../../../utils/auth/jwt';
import { validateCreateCategory, validateUpdateCategory } from '../validators/category.validator';

const router = Router();
const categoryController = new CategoryController();

router.get('/:outletId', basicAuth, categoryController.findAll);
router.get('/:outletId/:id', basicAuth, categoryController.findOne);
router.post(
  '/',
  jwtAuth,
  roleAuth(UserRole.STORE_MANAGER),
  validateCreateCategory,
  categoryController.create,
);
router.put(
  '/:id',
  jwtAuth,
  roleAuth(UserRole.STORE_MANAGER),
  validateUpdateCategory,
  categoryController.update,
);
router.delete('/:id', jwtAuth, roleAuth(UserRole.STORE_MANAGER), categoryController.delete);

export default router;
