import { app } from './app';
import { config } from './config';
import { logger } from './utils/logger';

const startServer = () => {
  try {
    app.listen(config.port, () => {
      logger.info(`Server is running on port ${config.port}`);
      logger.info(`API is available at ${config.apiPrefix}`);
    });
  } catch (error) {
    logger.error('Error starting server:', error);
    process.exit(1);
  }
};

startServer();
