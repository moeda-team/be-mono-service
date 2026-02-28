import { Router } from 'express';
import { OutletController } from '../controllers/outlet.controller';
import { validateCreateOutlet, validateUpdateOutlet } from '../validators/outlet.validator';
import { jwtAuth, requirePermission } from '../../../middlewares';
import { UserRole } from '../../../utils/auth/jwt';

const router = Router();
const outletController = new OutletController();

router.get('/:id', outletController.getOutletById);
router.get('/', jwtAuth, requirePermission(UserRole.OWNER), outletController.getAllOutlets);
router.post(
  '/',
  jwtAuth,
  requirePermission(UserRole.OWNER),
  validateCreateOutlet,
  outletController.createOutlet,
);
router.put(
  '/:id',
  jwtAuth,
  requirePermission(UserRole.OWNER),
  validateUpdateOutlet,
  outletController.updateOutlet,
);
router.delete('/:id', jwtAuth, requirePermission(UserRole.OWNER), outletController.deleteOutlet);

export default router;
