import { Router } from 'express';
import { StockController } from '../controllers/stock.controller';
import { validateCreateStock, validateUpdateStock } from '../validators/stock.validator';
import { HealthController } from '../controllers/health.controller';
import { jwtAuth, roleAuth } from '../../../middlewares';
import { UserRole } from '../../../utils/auth/jwt';

const router = Router();
const stockController = new StockController();
const healthController = new HealthController();

router.get('/health', healthController.check);
router.get('/:id', jwtAuth, roleAuth(UserRole.STORE_MANAGER), stockController.getStockById);
router.get('/', jwtAuth, roleAuth(UserRole.STORE_MANAGER), stockController.getAllStocks);
router.post(
  '/',
  jwtAuth,
  roleAuth(UserRole.STORE_MANAGER),
  validateCreateStock,
  stockController.createStock,
);
router.put(
  '/:id',
  jwtAuth,
  roleAuth(UserRole.STORE_MANAGER),
  validateUpdateStock,
  stockController.updateStock,
);
router.delete('/:id', jwtAuth, roleAuth(UserRole.STORE_MANAGER), stockController.deleteStock);

export default router;
