import { Router } from 'express';
import { validateAddStock, validateReduceStock } from '../validators/inventory.validator';
import { InventoryController } from '../controllers/inventory.controller';
import { HealthController } from '../controllers/health.controller';
import { InventoryService } from '../services/inventory.service';
import { basicAuth, jwtAuth, roleAuth } from '../../../middlewares';
import { UserRole } from '../../../utils/auth/jwt';

const router = Router();
const inventoryService = new InventoryService();
const inventoryController = new InventoryController(inventoryService);
const healthController = new HealthController();

router.get('/health', basicAuth, healthController.check);

router.post(
  '/add-stock',
  jwtAuth,
  roleAuth(UserRole.EMPLOYEE),
  validateAddStock,
  inventoryController.addStock,
);

router.post(
  '/reduce-stock',
  jwtAuth,
  roleAuth(UserRole.EMPLOYEE),
  validateReduceStock,
  inventoryController.reduceStock,
);

router.get(
  '/ingredients',
  jwtAuth,
  roleAuth(UserRole.EMPLOYEE),
  inventoryController.getIngredients,
);

router.get('/activity', jwtAuth, roleAuth(UserRole.EMPLOYEE), inventoryController.getActivity);

export default router;
