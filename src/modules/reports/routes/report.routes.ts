import { Router } from 'express';
import { ReportController } from '../controllers/report.controller';
import {
  validateDailyReportQuery,
  validateSalesAnalyticsQuery,
  validateSystemRevenueQuery,
} from '../validators/report.validator';
import { jwtAuth, requirePermission } from '../../../middlewares';
import { UserRole } from '../../../utils/auth/jwt';

/**
 * @openapi
 * /reports/daily:
 *   get:
 *     tags: [Reports]
 *     summary: Daily sales report (min role EMPLOYEE)
 *     parameters:
 *       - $ref: '#/components/parameters/OutletIdQuery'
 *       - name: date
 *         in: query
 *         schema: { type: string, format: date }
 *     responses:
 *       '200': { description: OK }
 *       '400': { $ref: '#/components/responses/BadRequest' }
 *       '401': { $ref: '#/components/responses/Unauthorized' }
 *
 * /reports/daily/download:
 *   get:
 *     tags: [Reports]
 *     summary: Download daily report (PDF/Excel) (min role EMPLOYEE)
 *     parameters:
 *       - $ref: '#/components/parameters/OutletIdQuery'
 *       - name: date
 *         in: query
 *         schema: { type: string, format: date }
 *     responses:
 *       '200':
 *         description: Binary file
 *         content:
 *           application/octet-stream:
 *             schema: { type: string, format: binary }
 *       '401': { $ref: '#/components/responses/Unauthorized' }
 *
 * /reports/sales:
 *   get:
 *     tags: [Reports]
 *     summary: Sales analytics over a period (min role EMPLOYEE)
 *     parameters:
 *       - $ref: '#/components/parameters/OutletIdQuery'
 *       - name: startDate
 *         in: query
 *         schema: { type: string, format: date }
 *       - name: endDate
 *         in: query
 *         schema: { type: string, format: date }
 *     responses:
 *       '200': { description: OK }
 *       '400': { $ref: '#/components/responses/BadRequest' }
 *       '401': { $ref: '#/components/responses/Unauthorized' }
 *
 * /reports/top-selling:
 *   get:
 *     tags: [Reports]
 *     summary: Top selling menus (min role EMPLOYEE)
 *     parameters:
 *       - $ref: '#/components/parameters/OutletIdQuery'
 *     responses:
 *       '200': { description: OK }
 *       '401': { $ref: '#/components/responses/Unauthorized' }
 *
 * /reports/system-revenue:
 *   get:
 *     tags: [Reports]
 *     summary: System-wide revenue across outlets (min role ADMIN)
 *     parameters:
 *       - $ref: '#/components/parameters/OutletIdQuery'
 *     responses:
 *       '200': { description: OK }
 *       '403': { $ref: '#/components/responses/Forbidden' }
 */
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
  validateSystemRevenueQuery,
  reportController.systemRevenue,
);

export default router;
