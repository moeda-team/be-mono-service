import { Router } from 'express';
import { VoucherController } from '../controllers/voucher.controller';
import { validateCreateVoucher, validateUpdateVoucher } from '../validators/voucher.validator';
import { HealthController } from '../controllers/health.controller';
import { jwtAuthNotRequired, jwtAuth, roleAuth } from '../../../middlewares';
import { UserRole } from '../../../utils/auth/jwt';

const router = Router();
const voucherController = new VoucherController();
const healthController = new HealthController();

router.get('/health', healthController.check);
router.get('/:code/detail', jwtAuthNotRequired, voucherController.getVoucherByName);
router.get('/', jwtAuth, roleAuth(UserRole.EMPLOYEE), voucherController.getAllVouchers);
router.get(
  '/today/used',
  jwtAuth,
  roleAuth(UserRole.EMPLOYEE),
  voucherController.getTodayUsedVouchers,
);
router.post(
  '/',
  jwtAuth,
  roleAuth(UserRole.STORE_MANAGER),
  validateCreateVoucher,
  voucherController.createVoucher,
);
router.put(
  '/:id',
  jwtAuth,
  roleAuth(UserRole.STORE_MANAGER),
  validateUpdateVoucher,
  voucherController.updateVoucher,
);
router.delete('/:id', jwtAuth, roleAuth(UserRole.STORE_MANAGER), voucherController.deleteVoucher);

export default router;
