import { Router } from 'express';
import { basicAuth, jwtAuth } from '../../../middlewares';
import { getWebSocketService } from '../../../services/websocket.service';
import { ResponseHandler } from '../../../utils/response/responseHandler';

/**
 * @openapi
 * /websockets/stats:
 *   get:
 *     tags: [WebSockets]
 *     summary: WebSocket connection statistics
 *     description: Requires both HTTP Basic auth and a JWT bearer token.
 *     security:
 *       - basicAuth: []
 *         bearerAuth: []
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
 *                         connectedOutlets: { type: integer }
 *                         outletConnections: { type: object, additionalProperties: { type: integer } }
 *                         totalConnections: { type: integer }
 *       '401': { $ref: '#/components/responses/Unauthorized' }
 *       '500': { $ref: '#/components/responses/ServerError' }
 */
const router = Router();

// Get WebSocket connection statistics
router.get('/stats', basicAuth, jwtAuth, (req, res) => {
  try {
    const wsService = getWebSocketService();
    const stats = wsService.getConnectionStats();

    return ResponseHandler.success(res, {
      message: 'WebSocket statistics retrieved successfully',
      data: {
        connectedOutlets: Object.keys(stats).length,
        outletConnections: stats,
        totalConnections: Object.values(stats).reduce((sum, count) => sum + count, 0),
      },
    });
  } catch (error) {
    return ResponseHandler.error(res, {
      message: 'Failed to retrieve WebSocket statistics',
      statusCode: 500,
    });
  }
});

export default router;
