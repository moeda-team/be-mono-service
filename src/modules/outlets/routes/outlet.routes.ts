import { Router } from 'express';
import { OutletController } from '../controllers/outlet.controller';
import { validateCreateOutlet, validateUpdateOutlet } from '../validators/outlet.validator';
import { HealthController } from '../controllers/health.controller';
import { jwtAuth, roleAuth } from '../../../middlewares';
import { UserRole } from '../../../utils/auth/jwt';

const router = Router();
const outletController = new OutletController();
const healthController = new HealthController();

router.get('/health', healthController.check);
router.get('/:id', outletController.getOutletById);
router.get('/', jwtAuth, roleAuth(UserRole.OWNER), outletController.getAllOutlets);
router.post(
  '/',
  jwtAuth,
  roleAuth(UserRole.OWNER),
  validateCreateOutlet,
  outletController.createOutlet,
);
router.put(
  '/:id',
  jwtAuth,
  roleAuth(UserRole.OWNER),
  validateUpdateOutlet,
  outletController.updateOutlet,
);
router.delete('/:id', jwtAuth, roleAuth(UserRole.OWNER), outletController.deleteOutlet);

export default router;
