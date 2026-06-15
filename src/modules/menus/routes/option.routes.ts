import { Router } from 'express';
import { OptionController } from '../controllers/option.controller';
import { jwtAuth, requirePermission, jwtAuthNotRequired } from '../../../middlewares';
import { UserRole } from '../../../utils/auth/jwt';
import { validateUpsertOption } from '../validators/option.validator';

/**
 * @openapi
 * /menus/options:
 *   get:
 *     tags: [Options]
 *     summary: List all menu options (min role STORE_MANAGER)
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
 *                       items: { $ref: '#/components/schemas/Option' }
 *       '401': { $ref: '#/components/responses/Unauthorized' }
 *   post:
 *     tags: [Options]
 *     summary: Upsert options for a menu (min role STORE_MANAGER)
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema: { $ref: '#/components/schemas/OptionUpsert' }
 *     responses:
 *       '200':
 *         description: Upserted
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/SuccessResponse'
 *                 - type: object
 *                   properties:
 *                     data: { $ref: '#/components/schemas/Option' }
 *       '400': { $ref: '#/components/responses/BadRequest' }
 *       '403': { $ref: '#/components/responses/Forbidden' }
 *
 * /menus/options/{menuId}:
 *   get:
 *     tags: [Options]
 *     summary: Get options for a menu
 *     security: []
 *     parameters:
 *       - name: menuId
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
 *                     data: { $ref: '#/components/schemas/Option' }
 *       '404': { $ref: '#/components/responses/NotFound' }
 *   delete:
 *     tags: [Options]
 *     summary: Delete options for a menu (min role STORE_MANAGER)
 *     parameters:
 *       - name: menuId
 *         in: path
 *         required: true
 *         schema: { type: string, format: uuid }
 *     responses:
 *       '200': { description: Deleted }
 *       '403': { $ref: '#/components/responses/Forbidden' }
 *       '404': { $ref: '#/components/responses/NotFound' }
 */
const router = Router();
const optionController = new OptionController();

router.get('', jwtAuth, requirePermission(UserRole.STORE_MANAGER), optionController.findAll);
router.get('/:menuId', jwtAuthNotRequired, optionController.findOne);
router.post(
  '/',
  jwtAuth,
  requirePermission(UserRole.STORE_MANAGER),
  validateUpsertOption,
  optionController.upsert,
);
router.delete(
  '/:menuId',
  jwtAuth,
  requirePermission(UserRole.STORE_MANAGER),
  optionController.delete,
);

export default router;
