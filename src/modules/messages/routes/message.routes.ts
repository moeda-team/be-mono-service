import { Router } from 'express';
import { MessageController } from '../controllers/message.controller';
import { validateCreateMessage } from '../validators/message.validator';
import { basicAuth, jwtAuth, requirePermission } from '../../../middlewares';
import { UserRole } from '../../../utils/auth/jwt';

/**
 * @openapi
 * /messages:
 *   get:
 *     tags: [Messages]
 *     summary: List feedback messages (min role STORE_MANAGER)
 *     parameters:
 *       - $ref: '#/components/parameters/OutletIdQuery'
 *       - $ref: '#/components/parameters/PageQuery'
 *       - $ref: '#/components/parameters/LimitQuery'
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
 *                       items: { $ref: '#/components/schemas/Message' }
 *       '401': { $ref: '#/components/responses/Unauthorized' }
 *       '403': { $ref: '#/components/responses/Forbidden' }
 *   post:
 *     tags: [Messages]
 *     summary: Submit a feedback message
 *     description: Service endpoint protected by HTTP Basic auth.
 *     security:
 *       - basicAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema: { $ref: '#/components/schemas/MessageCreate' }
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
 *                     data: { $ref: '#/components/schemas/Message' }
 *       '400': { $ref: '#/components/responses/BadRequest' }
 *       '401': { $ref: '#/components/responses/Unauthorized' }
 *
 * /messages/{id}:
 *   get:
 *     tags: [Messages]
 *     summary: Get a message by id (min role STORE_MANAGER)
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
 *                     data: { $ref: '#/components/schemas/Message' }
 *       '403': { $ref: '#/components/responses/Forbidden' }
 *       '404': { $ref: '#/components/responses/NotFound' }
 */
const router = Router();
const messageController = new MessageController();

router.get(
  '/:id',
  jwtAuth,
  requirePermission(UserRole.STORE_MANAGER),
  messageController.getMessageById,
);
router.get(
  '/',
  jwtAuth,
  requirePermission(UserRole.STORE_MANAGER),
  messageController.getAllMessages,
);
router.post('/', basicAuth, validateCreateMessage, messageController.createMessage);

export default router;
