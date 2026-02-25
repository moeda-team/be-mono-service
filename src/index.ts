import { createServer } from 'http';
import app from './app';
import { config } from './config';
import { logger } from './utils/common/logger';
import { initializeWebSocket } from './services/websocket.service';

const startServer = () => {
  try {
    // Create HTTP server
    const httpServer = createServer(app);

    // Initialize WebSocket service
    initializeWebSocket(httpServer);

    httpServer.listen(config.port, () => {
      logger.info('Starting');
      logger.info(`Server is running on port ${config.port}`);
      logger.info(`API is available at ${config.apiPrefix}`);
      logger.info('WebSocket server is initialized');
    });
  } catch (error) {
    logger.error('Error starting server:', error);
    process.exit(1);
  }
};

startServer();
