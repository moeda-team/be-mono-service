import { Router } from 'express';
import { ActivityController } from '../controllers/activity.controller';
import { validateCreateActivity } from '../validators/activity.validator';
import { jwtAuth, requirePermission } from '../../../middlewares';
import { UserRole } from '../../../utils/auth/jwt';

/**
 * @openapi
 * /inventories/activities:
 *   get:
 *     tags: [Activities]
 *     summary: List stock activities (min role EMPLOYEE)
 *     parameters:
 *       - $ref: '#/components/parameters/OutletIdQuery'
 *       - name: inventoryId
 *         in: query
 *         schema: { type: string, format: uuid }
 *       - name: type
 *         in: query
 *         schema: { type: string, enum: [ADD, REDUCE, ADJUST] }
 *       - $ref: '#/components/parameters/PageQuery'
 *       - $ref: '#/components/parameters/LimitQuery'
 *       - $ref: '#/components/parameters/SearchQuery'
 *     responses:
 *       '200':
 *         description: OK
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/SuccessResponse'
 *                 - type: object
 *                   properties:
 *                     data:
 *                       type: array
 *                       items: { $ref: '#/components/schemas/StockActivity' }
 *       '401': { $ref: '#/components/responses/Unauthorized' }
 *   post:
 *     tags: [Activities]
 *     summary: Create a stock activity and adjust stock (min role EMPLOYEE)
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema: { $ref: '#/components/schemas/StockActivityCreate' }
 *     responses:
 *       '200':
 *         description: Created
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/SuccessResponse'
 *                 - type: object
 *                   properties:
 *                     data: { $ref: '#/components/schemas/StockActivity' }
 *       '400': { $ref: '#/components/responses/BadRequest' }
 *
 * /inventories/activities/{id}:
 *   get:
 *     tags: [Activities]
 *     summary: Get a stock activity by id (min role EMPLOYEE)
 *     parameters:
 *       - $ref: '#/components/parameters/IdPath'
 *       - $ref: '#/components/parameters/OutletIdQuery'
 *     responses:
 *       '200':
 *         description: OK
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/SuccessResponse'
 *                 - type: object
 *                   properties:
 *                     data: { $ref: '#/components/schemas/StockActivity' }
 *       '404': { $ref: '#/components/responses/NotFound' }
 *   delete:
 *     tags: [Activities]
 *     summary: Delete a stock activity and reverse stock (min role OWNER)
 *     description: ADJUST activities cannot be deleted.
 *     parameters:
 *       - $ref: '#/components/parameters/IdPath'
 *     responses:
 *       '200': { description: Deleted and stock reversed }
 *       '400': { $ref: '#/components/responses/BadRequest' }
 *       '403': { $ref: '#/components/responses/Forbidden' }
 *       '404': { $ref: '#/components/responses/NotFound' }
 */
const router = Router();
const activityController = new ActivityController();

router.get(
  '/:id',
  jwtAuth,
  requirePermission(UserRole.EMPLOYEE),
  activityController.getActivityById,
);
router.get('/', jwtAuth, requirePermission(UserRole.EMPLOYEE), activityController.getAllActivities);
router.post(
  '/',
  jwtAuth,
  requirePermission(UserRole.EMPLOYEE),
  validateCreateActivity,
  activityController.createActivity,
);
router.delete(
  '/:id',
  jwtAuth,
  requirePermission(UserRole.OWNER),
  activityController.deleteActivity,
);

export default router;
