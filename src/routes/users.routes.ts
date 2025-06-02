import { Router } from 'express';
import { UserController } from '../controllers/user.controller';
import { validateCreateUser, validateUpdateUser } from '../middleware';
import { HealthController } from '../controllers/health.controller';
import { AuthController } from '../controllers/auth.controller';
import { jwtAuth } from '../middleware/jwtAuth.middleware';
import { roleAuth } from '../middleware/roleAuth.middleware';
import { UserRole } from '../utils/jwt';

const router = Router();
const userController = new UserController();
const healthController = new HealthController();
const authController = new AuthController();

router.get('/health', healthController.check);
router.post('/login', authController.login);
router.get('/:id', jwtAuth, roleAuth(UserRole.EMPLOYEE), userController.getUserById);
router.get('/', jwtAuth, roleAuth(UserRole.STORE_MANAGER), userController.getAllUsers);
router.post(
  '/',
  jwtAuth,
  roleAuth(UserRole.STORE_MANAGER),
  validateCreateUser,
  userController.createUser,
);
router.put(
  '/:id',
  jwtAuth,
  roleAuth(UserRole.STORE_MANAGER),
  validateUpdateUser,
  userController.updateUser,
);
router.delete('/:id', jwtAuth, roleAuth(UserRole.OWNER), userController.deleteUser);

export default router;
