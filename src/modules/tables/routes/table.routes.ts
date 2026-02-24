import { Router } from 'express';
import { TableController } from '../controllers/table.controller';
import { HealthController } from '../controllers/health.controller';
import { validateCreateTable, validateUpdateTable } from '../validators/table.validator';
import { jwtAuth, jwtAuthNotRequired, roleAuth } from '../../../middlewares';
import { UserRole } from '../../../utils/auth/jwt';

const router = Router();
const tableController = new TableController();
const healthController = new HealthController();

router.get('/health', healthController.check);
router.get('/', jwtAuthNotRequired, tableController.getTablesByOutlet);
router.get('/outlet/:outletId', jwtAuthNotRequired, tableController.getTablesByOutlet);
router.get(
  '/outlet/:outletId/status/:status',
  jwtAuthNotRequired,
  tableController.getTablesByStatus,
);
router.get('/:id', jwtAuthNotRequired, tableController.getTableById);
router.post(
  '/',
  jwtAuth,
  roleAuth(UserRole.STORE_MANAGER),
  validateCreateTable,
  tableController.createTable,
);
router.put(
  '/:id',
  jwtAuth,
  roleAuth(UserRole.STORE_MANAGER),
  validateUpdateTable,
  tableController.updateTable,
);
router.delete('/:id', jwtAuth, roleAuth(UserRole.STORE_MANAGER), tableController.deleteTable);

export default router;
