import { Router } from 'express';
import { OptionController } from '../controllers/option.controller';
import { jwtAuth, requirePermission, jwtAuthNotRequired } from '../../../middlewares';
import { UserRole } from '../../../utils/auth/jwt';
import { validateUpsertOption } from '../validators/option.validator';

const router = Router();
const optionController = new OptionController();

router.get('', jwtAuthNotRequired, requirePermission(UserRole.STORE_MANAGER), optionController.findAll);
router.get('/:menuId', jwtAuthNotRequired, optionController.findOne);
router.post(
  '/',
  jwtAuth,
  requirePermission(UserRole.STORE_MANAGER),
  validateUpsertOption,
  optionController.upsert,
);
router.delete('/:menuId', jwtAuth, requirePermission(UserRole.STORE_MANAGER), optionController.delete);

export default router;
