import { Router } from 'express';
import { CategoryController } from '../controllers/category.controller';
import { jwtAuth, roleAuth, basicAuth } from '../../../middlewares';
import { UserRole } from '../../../utils/jwt';

const router = Router();
const categoryController = new CategoryController();

router.get('/:outletId', basicAuth, categoryController.findAll);
router.get('/:outletId/:id', basicAuth, categoryController.findOne);
router.post('/', jwtAuth, roleAuth(UserRole.STORE_MANAGER), categoryController.create);
router.put('/:id', jwtAuth, roleAuth(UserRole.STORE_MANAGER), categoryController.update);
router.delete('/:id', jwtAuth, roleAuth(UserRole.STORE_MANAGER), categoryController.delete);

export default router;
