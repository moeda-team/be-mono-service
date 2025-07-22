import { Router } from 'express';
import { LogStockController } from '../controllers/log_stock.controller';
import { validateCreateLogStock, validateUpdateLogStock } from '../validators/log_stock.validator';
import { HealthController } from '../controllers/health.controller';
import { jwtAuth, roleAuth } from '../../../middlewares';
import { UserRole } from '../../../utils/auth/jwt';

const router = Router();
const logStockController = new LogStockController();
const healthController = new HealthController();

router.get('/health', healthController.check);
router.get('/:id', jwtAuth, roleAuth(UserRole.STORE_MANAGER), logStockController.getLogStockById);
router.get('/', jwtAuth, roleAuth(UserRole.STORE_MANAGER), logStockController.getAllLogStocks);
router.post(
  '/',
  jwtAuth,
  roleAuth(UserRole.STORE_MANAGER),
  validateCreateLogStock,
  logStockController.createLogStock,
);
router.put(
  '/:id',
  jwtAuth,
  roleAuth(UserRole.STORE_MANAGER),
  validateUpdateLogStock,
  logStockController.updateLogStock,
);

export default router;
