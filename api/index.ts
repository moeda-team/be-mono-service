import serverless from 'serverless-http';
import app from '../src/app';
import { config } from '../src/config';
import { logger } from '../src/utils/common/logger';

logger.info('Starting');
logger.info(`Server is running on port ${config.port}`);
logger.info(`API is available at ${config.apiPrefix}`);

export default serverless(app);
