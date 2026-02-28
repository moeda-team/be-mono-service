import { Router } from 'express';
import { InventoryController } from '../controllers/inventory.controller';
import {
  validateCreateInventory,
  validateUpdateInventory,
} from '../validators/inventory.validator';
import { jwtAuth, requirePermission } from '../../../middlewares';
import { UserRole } from '../../../utils/auth/jwt';

const router = Router();
const inventoryController = new InventoryController();

router.get(
  '/count-by-status',
  jwtAuth,
  requirePermission(UserRole.EMPLOYEE),
  inventoryController.countByStatus,
);
router.get('/:id', inventoryController.getInventoryById);
router.get(
  '/',
  jwtAuth,
  requirePermission(UserRole.EMPLOYEE),
  inventoryController.getAllInventories,
);
router.post(
  '/',
  jwtAuth,
  requirePermission(UserRole.EMPLOYEE),
  validateCreateInventory,
  inventoryController.createInventory,
);
router.put(
  '/:id',
  jwtAuth,
  requirePermission(UserRole.EMPLOYEE),
  validateUpdateInventory,
  inventoryController.updateInventory,
);
router.delete(
  '/:id',
  jwtAuth,
  requirePermission(UserRole.EMPLOYEE),
  inventoryController.deleteInventory,
);

export default router;
