import { Router } from 'express';
import { VoucherMenuController } from '../controllers/voucher-menu.controller';
import { validateCreateVoucherMenu } from '../validators/voucher-menu.validator';
import { jwtAuth, requirePermission } from '../../../middlewares';
import { UserRole } from '../../../utils/auth/jwt';

const router = Router();
const voucherMenuController = new VoucherMenuController();

router.post(
  '/',
  jwtAuth,
  requirePermission(UserRole.STORE_MANAGER),
  validateCreateVoucherMenu,
  voucherMenuController.createVoucherMenu,
);

router.delete(
  '/:voucherId/:menuId',
  jwtAuth,
  requirePermission(UserRole.STORE_MANAGER),
  voucherMenuController.deleteVoucherMenu,
);

export default router;
