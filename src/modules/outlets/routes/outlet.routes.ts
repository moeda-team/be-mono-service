import { Router } from 'express';
import { OutletController } from '../controllers/outlet.controller';
import { validateCreateOutlet, validateUpdateOutlet } from '../validators/outlet.validator';
import { jwtAuth, requirePermission } from '../../../middlewares';
import { UserRole } from '../../../utils/auth/jwt';

/**
 * @openapi
 * /outlets:
 *   get:
 *     tags: [Outlets]
 *     summary: List all outlets (min role OWNER)
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
 *                       items: { $ref: '#/components/schemas/Outlet' }
 *       '401': { $ref: '#/components/responses/Unauthorized' }
 *       '403': { $ref: '#/components/responses/Forbidden' }
 *   post:
 *     tags: [Outlets]
 *     summary: Create an outlet (min role OWNER)
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema: { $ref: '#/components/schemas/OutletCreate' }
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
 *                     data: { $ref: '#/components/schemas/Outlet' }
 *       '400': { $ref: '#/components/responses/BadRequest' }
 *       '403': { $ref: '#/components/responses/Forbidden' }
 *
 * /outlets/{id}:
 *   get:
 *     tags: [Outlets]
 *     summary: Get an outlet by id
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
 *                     data: { $ref: '#/components/schemas/Outlet' }
 *       '404': { $ref: '#/components/responses/NotFound' }
 *   put:
 *     tags: [Outlets]
 *     summary: Update an outlet (min role OWNER)
 *     parameters:
 *       - $ref: '#/components/parameters/IdPath'
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema: { $ref: '#/components/schemas/OutletCreate' }
 *     responses:
 *       '200':
 *         description: Updated
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/SuccessResponse'
 *                 - type: object
 *                   properties:
 *                     data: { $ref: '#/components/schemas/Outlet' }
 *       '400': { $ref: '#/components/responses/BadRequest' }
 *       '403': { $ref: '#/components/responses/Forbidden' }
 *       '404': { $ref: '#/components/responses/NotFound' }
 *   delete:
 *     tags: [Outlets]
 *     summary: Delete an outlet (min role OWNER)
 *     parameters:
 *       - $ref: '#/components/parameters/IdPath'
 *     responses:
 *       '200': { description: Deleted }
 *       '403': { $ref: '#/components/responses/Forbidden' }
 *       '404': { $ref: '#/components/responses/NotFound' }
 */
const router = Router();
const outletController = new OutletController();

router.get('/:id', outletController.getOutletById);
router.get('/', jwtAuth, requirePermission(UserRole.OWNER), outletController.getAllOutlets);
router.post(
  '/',
  jwtAuth,
  requirePermission(UserRole.OWNER),
  validateCreateOutlet,
  outletController.createOutlet,
);
router.put(
  '/:id',
  jwtAuth,
  requirePermission(UserRole.OWNER),
  validateUpdateOutlet,
  outletController.updateOutlet,
);
router.delete('/:id', jwtAuth, requirePermission(UserRole.OWNER), outletController.deleteOutlet);

export default router;
