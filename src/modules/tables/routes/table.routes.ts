import { Router } from 'express';
import { TableController } from '../controllers/table.controller';
import { validateCreateTable, validateUpdateTable } from '../validators/table.validator';
import { jwtAuth, jwtAuthNotRequired, requirePermission } from '../../../middlewares';
import { UserRole } from '../../../utils/auth/jwt';

/**
 * @openapi
 * /tables:
 *   get:
 *     tags: [Tables]
 *     summary: List tables for the resolved outlet
 *     security: []
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
 *                       type: array
 *                       items: { $ref: '#/components/schemas/Table' }
 *   post:
 *     tags: [Tables]
 *     summary: Create a table (min role STORE_MANAGER)
 *     parameters:
 *       - $ref: '#/components/parameters/OutletIdQuery'
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema: { $ref: '#/components/schemas/TableCreate' }
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
 *                     data: { $ref: '#/components/schemas/Table' }
 *       '400': { $ref: '#/components/responses/BadRequest' }
 *       '403': { $ref: '#/components/responses/Forbidden' }
 *
 * /tables/outlet/{outletId}:
 *   get:
 *     tags: [Tables]
 *     summary: List tables for a specific outlet
 *     security: []
 *     parameters:
 *       - name: outletId
 *         in: path
 *         required: true
 *         schema: { type: string, format: uuid }
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
 *                       items: { $ref: '#/components/schemas/Table' }
 *
 * /tables/outlet/{outletId}/status/{status}:
 *   get:
 *     tags: [Tables]
 *     summary: List tables for an outlet filtered by status
 *     security: []
 *     parameters:
 *       - name: outletId
 *         in: path
 *         required: true
 *         schema: { type: string, format: uuid }
 *       - name: status
 *         in: path
 *         required: true
 *         schema: { type: string, example: available }
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
 *                       items: { $ref: '#/components/schemas/Table' }
 *
 * /tables/{id}:
 *   get:
 *     tags: [Tables]
 *     summary: Get a table by id
 *     security: []
 *     parameters:
 *       - $ref: '#/components/parameters/IdPath'
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
 *                     data: { $ref: '#/components/schemas/Table' }
 *       '404': { $ref: '#/components/responses/NotFound' }
 *   put:
 *     tags: [Tables]
 *     summary: Update a table (min role STORE_MANAGER)
 *     parameters:
 *       - $ref: '#/components/parameters/IdPath'
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema: { $ref: '#/components/schemas/TableCreate' }
 *     responses:
 *       '200': { description: Updated }
 *       '400': { $ref: '#/components/responses/BadRequest' }
 *       '404': { $ref: '#/components/responses/NotFound' }
 *   delete:
 *     tags: [Tables]
 *     summary: Delete a table (min role STORE_MANAGER)
 *     parameters:
 *       - $ref: '#/components/parameters/IdPath'
 *     responses:
 *       '200': { description: Deleted }
 *       '403': { $ref: '#/components/responses/Forbidden' }
 *       '404': { $ref: '#/components/responses/NotFound' }
 */
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
