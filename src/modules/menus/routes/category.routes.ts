import { Router } from 'express';
import { CategoryController } from '../controllers/category.controller';
import { jwtAuth, requirePermission, jwtAuthNotRequired } from '../../../middlewares';
import { UserRole } from '../../../utils/auth/jwt';
import { validateCreateCategory, validateUpdateCategory } from '../validators/category.validator';

const router = Router();
const categoryController = new CategoryController();

router.get('/', jwtAuthNotRequired, categoryController.findAll);
router.get('/:id', jwtAuthNotRequired, categoryController.findOne);
router.post(
  '/',
  jwtAuth,
  requirePermission(UserRole.STORE_MANAGER),
  validateCreateCategory,
  categoryController.create,
);
router.put(
  '/:id',
  jwtAuth,
  requirePermission(UserRole.STORE_MANAGER),
  validateUpdateCategory,
  categoryController.update,
);
router.delete(
  '/:id',
  jwtAuth,
  requirePermission(UserRole.STORE_MANAGER),
  categoryController.delete,
);

export default router;
