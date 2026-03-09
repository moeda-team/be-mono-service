import { Router } from 'express';
import { ReportController } from '../controllers/report.controller';
import { jwtAuth, requirePermission } from '../../../middlewares';
import { UserRole } from '../../../utils/auth/jwt';

const router = Router();
const reportController = new ReportController();

// Daily report route
router.get('/daily', jwtAuth, requirePermission(UserRole.EMPLOYEE), reportController.dailyReport);
router.post(
  '/daily/download',
  jwtAuth,
  requirePermission(UserRole.EMPLOYEE),
  reportController.dailyReportDownload,
);

// Sales analytics route
router.get(
  '/sales',
  jwtAuth,
  requirePermission(UserRole.EMPLOYEE),
  reportController.salesAnalytics,
);

// Top selling menu route
router.get(
  '/top-selling',
  jwtAuth,
  requirePermission(UserRole.EMPLOYEE),
  reportController.topSellingMenu,
);

export default router;
