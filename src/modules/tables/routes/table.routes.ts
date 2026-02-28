import { Router } from 'express';
import { TableController } from '../controllers/table.controller';
import { validateCreateTable, validateUpdateTable } from '../validators/table.validator';
import { jwtAuth, jwtAuthNotRequired, requirePermission } from '../../../middlewares';
import { UserRole } from '../../../utils/auth/jwt';

const router = Router();
const tableController = new TableController();

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
  requirePermission(UserRole.STORE_MANAGER),
  validateCreateTable,
  tableController.createTable,
);
router.put(
  '/:id',
  jwtAuth,
  requirePermission(UserRole.STORE_MANAGER),
  validateUpdateTable,
  tableController.updateTable,
);
router.delete(
  '/:id',
  jwtAuth,
  requirePermission(UserRole.STORE_MANAGER),
  tableController.deleteTable,
);

export default router;
