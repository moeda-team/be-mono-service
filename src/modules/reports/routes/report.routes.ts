import { Router } from 'express';
import { ReportController } from '../controllers/report.controller';
import { jwtAuth, requirePermission } from '../../../middlewares';
import { UserRole } from '../../../utils/auth/jwt';

const router = Router();
const reportController = new ReportController();

// Daily report route
router.get('/daily', jwtAuth, requirePermission(UserRole.EMPLOYEE), reportController.dailyReport);

export default router;
