import { Router } from 'express';
import { UserController } from '../controllers/user.controller';
import { AuthController } from '../controllers/auth.controller';
import { jwtAuth, requirePermission } from '../../../middlewares';
import { UserRole } from '../../../utils/auth/jwt';
import { validateCreateUser, validateUpdateUser } from '../validators/user.validator';

const router = Router();
const userController = new UserController();
const authController = new AuthController();

router.post('/login', authController.login);
router.get('/:id', jwtAuth, requirePermission(UserRole.EMPLOYEE), userController.getUserById);
router.get('/', jwtAuth, requirePermission(UserRole.STORE_MANAGER), userController.getAllUsers);
router.post(
  '/',
  jwtAuth,
  requirePermission(UserRole.STORE_MANAGER),
  validateCreateUser,
  userController.createUser,
);
router.put(
  '/:id',
  jwtAuth,
  requirePermission(UserRole.STORE_MANAGER),
  validateUpdateUser,
  userController.updateUser,
);
router.delete('/:id', jwtAuth, requirePermission(UserRole.OWNER), userController.deleteUser);

export default router;
