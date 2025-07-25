import { Router } from 'express';
import { jwtAuth, roleAuth } from '../../../middlewares';
import { UserRole } from '../../../utils/auth/jwt';
import { SalesController } from '../controllers/sales.controller';

const router = Router();
const salesController = new SalesController();

router.get('/:type', jwtAuth, roleAuth(UserRole.EMPLOYEE), salesController.getTransactionCount);

export default router;
