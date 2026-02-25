import { Router } from 'express';
import { basicAuth, jwtAuth } from '../../../middlewares';
import { getWebSocketService } from '../../../services/websocket.service';
import { ResponseHandler } from '../../../utils/response/responseHandler';

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
