import { Router } from 'express';
import { VoucherController } from '../controllers/voucher.controller';
import { validateCreateVoucher, validateUpdateVoucher } from '../validators/voucher.validator';
import { jwtAuthNotRequired, jwtAuth, requirePermission } from '../../../middlewares';
import { UserRole } from '../../../utils/auth/jwt';
import voucherMenuRoutes from './voucher-menu.routes';

const router = Router();
const voucherController = new VoucherController();

// Voucher Menu routes
router.use('/menus', voucherMenuRoutes);

router.get('/:code/detail', jwtAuthNotRequired, voucherController.getVoucherByName);
router.get('/', jwtAuth, requirePermission(UserRole.EMPLOYEE), voucherController.getAllVouchers);
router.post(
  '/',
  jwtAuth,
  requirePermission(UserRole.STORE_MANAGER),
  validateCreateVoucher,
  voucherController.createVoucher,
);
router.put(
  '/:id',
  jwtAuth,
  requirePermission(UserRole.STORE_MANAGER),
  validateUpdateVoucher,
  voucherController.updateVoucher,
);
router.delete(
  '/:id',
  jwtAuth,
  requirePermission(UserRole.STORE_MANAGER),
  voucherController.deleteVoucher,
);

export default router;
