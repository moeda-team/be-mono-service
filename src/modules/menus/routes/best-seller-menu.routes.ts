import { Router } from 'express';
import { BestSellerMenuController } from '../controllers/best-seller-menu.controller';
import {
  validateCreateBestSellerMenu,
  validateUpdateBestSellerMenu,
} from '../validators/best-seller-menu.validator';
import { basicAuth, jwtAuth, roleAuth } from '../../../middlewares';
import { UserRole } from '../../../utils/auth/jwt';

const router = Router();
const bestSellerMenuController = new BestSellerMenuController();

router.get('/', basicAuth, bestSellerMenuController.getAllBestSellerMenus);
router.get('/:id', basicAuth, bestSellerMenuController.getBestSellerMenuById);
router.post(
  '/',
  jwtAuth,
  roleAuth(UserRole.STORE_MANAGER),
  validateCreateBestSellerMenu,
  bestSellerMenuController.createBestSellerMenu,
);
router.put(
  '/:id',
  jwtAuth,
  roleAuth(UserRole.STORE_MANAGER),
  validateUpdateBestSellerMenu,
  bestSellerMenuController.updateBestSellerMenu,
);
router.delete(
  '/:id',
  jwtAuth,
  roleAuth(UserRole.STORE_MANAGER),
  bestSellerMenuController.deleteBestSellerMenu,
);

export default router;
