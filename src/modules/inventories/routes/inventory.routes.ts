import { Router } from 'express';
import { InventoryController } from '../controllers/inventory.controller';
import { HealthController } from '../controllers/health.controller';
import {
  validateCreateInventory,
  validateUpdateInventory,
} from '../validators/inventory.validator';
import { jwtAuth, roleAuth } from '../../../middlewares';
import { UserRole } from '../../../utils/auth/jwt';

const router = Router();
const inventoryController = new InventoryController();
const healthController = new HealthController();

router.get('/health', healthController.check);

router.get(
  '/count-by-status',
  jwtAuth,
  roleAuth(UserRole.EMPLOYEE),
  inventoryController.countByStatus,
);
router.get('/:id', inventoryController.getInventoryById);
router.get('/', jwtAuth, roleAuth(UserRole.EMPLOYEE), inventoryController.getAllInventories);
router.post(
  '/',
  jwtAuth,
  roleAuth(UserRole.EMPLOYEE),
  validateCreateInventory,
  inventoryController.createInventory,
);
router.put(
  '/:id',
  jwtAuth,
  roleAuth(UserRole.EMPLOYEE),
  validateUpdateInventory,
  inventoryController.updateInventory,
);
router.delete('/:id', jwtAuth, roleAuth(UserRole.EMPLOYEE), inventoryController.deleteInventory);

export default router;
