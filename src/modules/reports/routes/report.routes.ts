import { Router } from 'express';
import { ReportController } from '../controllers/report.controller';
import {
  validateDailyReportQuery,
  validateSalesAnalyticsQuery,
} from '../validators/report.validator';
import { jwtAuth, requirePermission } from '../../../middlewares';
import { UserRole } from '../../../utils/auth/jwt';

const router = Router();
const reportController = new ReportController();

// Daily report route
router.get(
  '/daily',
  jwtAuth,
  requirePermission(UserRole.EMPLOYEE),
  validateDailyReportQuery,
  reportController.dailyReport,
);
router.get(
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
  validateSalesAnalyticsQuery,
  reportController.salesAnalytics,
);

// Top selling menu route
router.get(
  '/top-selling',
  jwtAuth,
  requirePermission(UserRole.EMPLOYEE),
  reportController.topSellingMenu,
);

// System revenue route
router.get(
  '/system-revenue',
  jwtAuth,
  requirePermission(UserRole.ADMIN),
  reportController.systemRevenue,
);

export default router;
