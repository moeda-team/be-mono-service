import { Router } from 'express';
import { OptionController } from '../controllers/option.controller';
import { jwtAuth, roleAuth, basicAuth } from '../../../middlewares';
import { UserRole } from '../../../utils/auth/jwt';
import { validateCreateOption, validateUpdateOption } from '../validators/option.validator';

const router = Router();
const optionController = new OptionController();

router.get('', jwtAuth, roleAuth(UserRole.STORE_MANAGER), optionController.findAll);
router.get('/:id', basicAuth, optionController.findOne);
router.post(
  '/',
  jwtAuth,
  roleAuth(UserRole.STORE_MANAGER),
  validateCreateOption,
  optionController.create,
);
router.put(
  '/:id',
  jwtAuth,
  roleAuth(UserRole.STORE_MANAGER),
  validateUpdateOption,
  optionController.update,
);
router.delete('/:id', jwtAuth, roleAuth(UserRole.STORE_MANAGER), optionController.delete);

export default router;
