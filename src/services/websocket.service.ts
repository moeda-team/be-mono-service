import { Server as SocketIOServer, Socket } from 'socket.io';
import { Server as HTTPServer } from 'http';
import { logger } from '../utils/common/logger';
import { JwtPayload } from 'jsonwebtoken';

export interface SocketWithAuth extends Socket {
  user?: {
    userId: string;
    outletId: string;
    role: string;
  };
}

export class WebSocketService {
  private io: SocketIOServer;
  private connectedClients: Map<string, Set<string>> = new Map(); // outletId -> Set of socketIds

  constructor(httpServer: HTTPServer) {
    this.io = new SocketIOServer(httpServer, {
      cors: {
        origin: process.env.CORS_ORIGIN?.split(',').map(origin => origin.trim()) || [
          'http://localhost:3000',
        ],
        credentials: true,
      },
      transports: ['websocket', 'polling'],
    });

    this.setupMiddleware();
    this.setupEventHandlers();
  }

  private setupMiddleware() {
    this.io.use(async (socket: any, next) => {
      try {
        // Try JWT token from auth parameter first
        let token = socket.handshake.auth.token || socket.handshake.headers.token;

        // If no token, try basic auth from headers
        if (!token && socket.handshake.headers.authorization) {
          const authHeader = socket.handshake.headers.authorization;
          if (authHeader.startsWith('Basic ')) {
            // For basic auth, you'd need to decode and validate credentials
            // This is more complex and requires user validation
            return next(new Error('JWT token required for WebSocket connection'));
          }
        }

        if (!token) {
          return next(new Error('Authentication token required'));
        }

        // Verify JWT token (you'll need to import your JWT verification logic)
        const jwt = require('jsonwebtoken');
        const decoded = jwt.verify(token, process.env.JWT_ACCESS_SECRET!) as JwtPayload;

        socket.user = {
          userId: decoded.userId,
          outletId: decoded.outletId,
          role: decoded.role,
        };

        next();
      } catch (error) {
        logger.error('WebSocket authentication error:', error);
        next(new Error('Authentication failed'));
      }
    });
  }

  private setupEventHandlers() {
    this.io.on('connection', (socket: any) => {
      const user = socket.user!;
      const outletId = user.outletId;

      logger.info(`WebSocket client connected: ${socket.id} for outlet: ${outletId}`);

      // Join outlet-specific room
      socket.join(`outlet:${outletId}`);

      // Track connected clients
      if (!this.connectedClients.has(outletId)) {
        this.connectedClients.set(outletId, new Set());
      }
      this.connectedClients.get(outletId)!.add(socket.id);

      // Handle joining transaction-specific room
      socket.on('join-transaction', (transactionId: string) => {
        socket.join(`transaction:${transactionId}`);
        logger.info(`Client ${socket.id} joined transaction room: ${transactionId}`);
      });

      // Handle leaving transaction-specific room
      socket.on('leave-transaction', (transactionId: string) => {
        socket.leave(`transaction:${transactionId}`);
        logger.info(`Client ${socket.id} left transaction room: ${transactionId}`);
      });

      // Handle disconnection
      socket.on('disconnect', () => {
        logger.info(`WebSocket client disconnected: ${socket.id} from outlet: ${outletId}`);

        // Remove from tracking
        const outletClients = this.connectedClients.get(outletId);
        if (outletClients) {
          outletClients.delete(socket.id);
          if (outletClients.size === 0) {
            this.connectedClients.delete(outletId);
            logger.info(`Outlet ${outletId} has no more connected clients`);
          }
        }
      });
    });
  }

  // Emit transaction events
  emitTransactionCreated(outletId: string, transaction: any) {
    this.io.to(`outlet:${outletId}`).emit('transaction:created', {
      type: 'TRANSACTION_CREATED',
      data: transaction,
      timestamp: new Date().toISOString(),
    });

    // Also emit to transaction-specific room
    this.io.to(`transaction:${transaction.id}`).emit('transaction:created', {
      type: 'TRANSACTION_CREATED',
      data: transaction,
      timestamp: new Date().toISOString(),
    });

    logger.info(
      `Transaction created event emitted for outlet: ${outletId}, transaction: ${transaction.id}`,
    );
  }

  emitTransactionStatusUpdated(
    outletId: string,
    transactionId: string,
    status: string,
    subTransactionId?: string,
  ) {
    const eventData = {
      type: 'TRANSACTION_STATUS_UPDATED',
      data: {
        transactionId,
        status,
        subTransactionId,
      },
      timestamp: new Date().toISOString(),
    };

    this.io.to(`outlet:${outletId}`).emit('transaction:status-updated', eventData);
    this.io.to(`transaction:${transactionId}`).emit('transaction:status-updated', eventData);

    logger.info(`Transaction status updated event emitted: ${transactionId} -> ${status}`);
  }

  emitTransactionTableUpdated(
    outletId: string,
    transactionId: string,
    tableId: string,
    previousTableId?: string,
  ) {
    const eventData = {
      type: 'TRANSACTION_TABLE_UPDATED',
      data: {
        transactionId,
        tableId,
        previousTableId,
      },
      timestamp: new Date().toISOString(),
    };

    this.io.to(`outlet:${outletId}`).emit('transaction:table-updated', eventData);
    this.io.to(`transaction:${transactionId}`).emit('transaction:table-updated', eventData);

    logger.info(`Transaction table updated event emitted: ${transactionId} -> table: ${tableId}`);
  }

  emitTransactionDeleted(outletId: string, transactionId: string) {
    const eventData = {
      type: 'TRANSACTION_DELETED',
      data: {
        transactionId,
      },
      timestamp: new Date().toISOString(),
    };

    this.io.to(`outlet:${outletId}`).emit('transaction:deleted', eventData);
    this.io.to(`transaction:${transactionId}`).emit('transaction:deleted', eventData);

    logger.info(`Transaction deleted event emitted: ${transactionId}`);
  }

  // Get connection statistics
  getConnectionStats() {
    const stats: Record<string, number> = {};
    this.connectedClients.forEach((clients, outletId) => {
      stats[outletId] = clients.size;
    });
    return stats;
  }

  // Get Socket.IO server instance
  getIO() {
    return this.io;
  }
}

// Singleton instance
let webSocketService: WebSocketService | null = null;

export const initializeWebSocket = (httpServer: HTTPServer): WebSocketService => {
  if (!webSocketService) {
    webSocketService = new WebSocketService(httpServer);
  }
  return webSocketService;
};

export const getWebSocketService = (): WebSocketService => {
  if (!webSocketService) {
    throw new Error('WebSocket service not initialized. Call initializeWebSocket first.');
  }
  return webSocketService;
};
