import { Router } from 'express';
import { BestSellerMenuController } from '../controllers/best-seller-menu.controller';
import { validateCreateBestSellerMenu } from '../validators/best-seller-menu.validator';
import { jwtAuth, requirePermission, jwtAuthNotRequired } from '../../../middlewares';
import { UserRole } from '../../../utils/auth/jwt';

const router = Router();
const bestSellerMenuController = new BestSellerMenuController();

router.get('/', jwtAuthNotRequired, bestSellerMenuController.getAllBestSellerMenus);
router.get('/:id', jwtAuthNotRequired, bestSellerMenuController.getBestSellerMenuById);
router.post(
  '/',
  jwtAuth,
  requirePermission(UserRole.STORE_MANAGER),
  validateCreateBestSellerMenu,
  bestSellerMenuController.createBestSellerMenu,
);
router.delete(
  '/:id',
  jwtAuth,
  requirePermission(UserRole.STORE_MANAGER),
  bestSellerMenuController.deleteBestSellerMenu,
);

export default router;
