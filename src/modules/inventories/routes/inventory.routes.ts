import { Router } from 'express';
import { InventoryController } from '../controllers/inventory.controller';
import {
  validateCreateInventory,
  validateUpdateInventory,
} from '../validators/inventory.validator';
import { jwtAuth, requirePermission } from '../../../middlewares';
import { UserRole } from '../../../utils/auth/jwt';

/**
 * @openapi
 * /inventories:
 *   get:
 *     tags: [Inventories]
 *     summary: List inventory items (min role EMPLOYEE)
 *     parameters:
 *       - $ref: '#/components/parameters/OutletIdQuery'
 *       - name: status
 *         in: query
 *         schema: { type: string, enum: [SAFE, LOW, OUT] }
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
 *                       items: { $ref: '#/components/schemas/Inventory' }
 *       '401': { $ref: '#/components/responses/Unauthorized' }
 *   post:
 *     tags: [Inventories]
 *     summary: Create an inventory item (min role EMPLOYEE)
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema: { $ref: '#/components/schemas/InventoryCreate' }
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
 *                     data: { $ref: '#/components/schemas/Inventory' }
 *       '400': { $ref: '#/components/responses/BadRequest' }
 *
 * /inventories/count-by-status:
 *   get:
 *     tags: [Inventories]
 *     summary: Count inventory items grouped by stock status (min role EMPLOYEE)
 *     parameters:
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
 *                     data:
 *                       type: object
 *                       properties:
 *                         SAFE: { type: integer }
 *                         LOW: { type: integer }
 *                         OUT: { type: integer }
 *                         total: { type: integer }
 *       '401': { $ref: '#/components/responses/Unauthorized' }
 *
 * /inventories/{id}:
 *   get:
 *     tags: [Inventories]
 *     summary: Get an inventory item by id (min role EMPLOYEE)
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
 *                     data: { $ref: '#/components/schemas/Inventory' }
 *       '404': { $ref: '#/components/responses/NotFound' }
 *   put:
 *     tags: [Inventories]
 *     summary: Update an inventory item (min role EMPLOYEE; cross-outlet for ADMIN/OWNER)
 *     parameters:
 *       - $ref: '#/components/parameters/IdPath'
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema: { $ref: '#/components/schemas/InventoryCreate' }
 *     responses:
 *       '200': { description: Updated }
 *       '400': { $ref: '#/components/responses/BadRequest' }
 *       '403': { $ref: '#/components/responses/Forbidden' }
 *       '404': { $ref: '#/components/responses/NotFound' }
 *   delete:
 *     tags: [Inventories]
 *     summary: Delete an inventory item (min role EMPLOYEE; cross-outlet for ADMIN/OWNER)
 *     parameters:
 *       - $ref: '#/components/parameters/IdPath'
 *     responses:
 *       '200': { description: Deleted }
 *       '403': { $ref: '#/components/responses/Forbidden' }
 *       '404': { $ref: '#/components/responses/NotFound' }
 */
const router = Router();
const inventoryController = new InventoryController();

router.get(
  '/count-by-status',
  jwtAuth,
  requirePermission(UserRole.EMPLOYEE),
  inventoryController.countByStatus,
);
router.get(
  '/:id',
  jwtAuth,
  requirePermission(UserRole.EMPLOYEE),
  inventoryController.getInventoryById,
);
router.get(
  '/',
  jwtAuth,
  requirePermission(UserRole.EMPLOYEE),
  inventoryController.getAllInventories,
);
router.post(
  '/',
  jwtAuth,
  requirePermission(UserRole.EMPLOYEE),
  validateCreateInventory,
  inventoryController.createInventory,
);
router.put(
  '/:id',
  jwtAuth,
  requirePermission(UserRole.EMPLOYEE),
  validateUpdateInventory,
  inventoryController.updateInventory,
);
router.delete(
  '/:id',
  jwtAuth,
  requirePermission(UserRole.EMPLOYEE),
  inventoryController.deleteInventory,
);

export default router;
