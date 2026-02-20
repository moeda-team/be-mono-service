import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import timeout from 'connect-timeout';
import { Router } from 'express';
import { NextFunction, Request, Response } from 'express';

import { config } from './config';
import { errorHandler, notFoundHandler } from './utils/errors/error.handler';
import { logger } from './utils/common/logger';
import { ResponseHandler } from './utils/response/responseHandler';
import { databaseManager } from './config/database.refactored';
import { rateLimiter } from './middlewares/rateLimiter.middlewares';

// Import routes
import userRouter from './modules/users/routes';
import messageRouter from './modules/messages/routes';
import transactionRouter from './modules/transactions/routes';
import outletRouter from './modules/outlets/routes';
import menuRouter from './modules/menus/routes';
import voucherRouter from './modules/vouchers/routes';
import fileRouter from './modules/files/routes';

class Application {
  public app: express.Application;

  constructor() {
    this.app = express();
    this.initializeMiddlewares();
    this.initializeRoutes();
    this.initializeErrorHandling();
  }

  private initializeMiddlewares(): void {
    // Security middleware
    this.app.use(
      helmet({
        contentSecurityPolicy: {
          directives: {
            defaultSrc: ["'self'"],
            styleSrc: ["'self'", "'unsafe-inline'"],
            scriptSrc: ["'self'"],
            imgSrc: ["'self'", 'data:', 'https:'],
          },
        },
        hsts: {
          maxAge: 31536000,
          includeSubDomains: true,
          preload: true,
        },
      }),
    );

    // Rate limiting
    this.app.use(rateLimiter);

    // CORS configuration
    const allowedOrigins = config.corsOrigin.split(',').map(origin => origin.trim());
    this.app.use(
      cors({
        origin: (origin, callback) => {
          if (!origin || allowedOrigins.includes(origin)) {
            callback(null, true);
          } else {
            callback(new Error('Not allowed by CORS'));
          }
        },
        credentials: true,
        methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
        allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
      }),
    );

    // Compression (commented out as compression is not installed)
    // this.app.use(compression());

    // Request timeout
    this.app.use(timeout('30s'));

    // Body parsing
    this.app.use(
      express.json({
        limit: '10mb',
        verify: (req: any, res, buf) => {
          req.rawBody = buf;
        },
      }),
    );
    this.app.use(
      express.urlencoded({
        extended: true,
        limit: '10mb',
      }),
    );

    // Logging
    if (config.nodeEnv !== 'test') {
      this.app.use(
        morgan('combined', {
          stream: {
            write: message => logger.info(message.trim()),
          },
        }),
      );
    }

    // Request ID middleware
    this.app.use((req: Request, res: Response, next: NextFunction) => {
      req.headers['x-request-id'] =
        req.headers['x-request-id'] || Math.random().toString(36).substring(2, 15);
      res.setHeader('X-Request-ID', req.headers['x-request-id']);
      next();
    });
  }

  private initializeRoutes(): void {
    // Health check endpoint
    this.app.get('/health', async (req: Request, res: Response) => {
      try {
        const dbHealthy = await databaseManager.healthCheck();

        const health = {
          status: 'ok',
          timestamp: new Date().toISOString(),
          uptime: process.uptime(),
          environment: config.nodeEnv,
          database: dbHealthy ? 'connected' : 'disconnected',
          memory: {
            used: Math.round((process.memoryUsage().heapUsed / 1024 / 1024) * 100) / 100,
            total: Math.round((process.memoryUsage().heapTotal / 1024 / 1024) * 100) / 100,
          },
        };

        if (!dbHealthy) {
          health.status = 'degraded';
          return ResponseHandler.error(res, {
            message: 'Service degraded - database connection issues',
            statusCode: 503,
            error: {
              code: 'SERVICE_UNAVAILABLE',
              details: health,
            },
          });
        }

        return ResponseHandler.success(res, {
          message: 'Service healthy',
          data: health,
        });
      } catch (error) {
        logger.error('Health check failed:', error);
        return ResponseHandler.error(res, {
          message: 'Health check failed',
          statusCode: 503,
          error: {
            code: 'SERVICE_UNAVAILABLE',
          },
        });
      }
    });

    // API routes
    const router = Router();

    router.use(`/v1/users`, userRouter);
    router.use(`/v1/messages`, messageRouter);
    router.use(`/v1/transactions`, transactionRouter);
    router.use(`/v1/outlets`, outletRouter);
    router.use(`/v1/menus`, menuRouter);
    router.use(`/v1/vouchers`, voucherRouter);
    router.use(`/v1/files`, fileRouter);

    // API documentation endpoint
    router.get('/', (req: Request, res: Response) => {
      return ResponseHandler.success(res, {
        message: 'API Documentation',
        data: {
          name: 'BE Mono Service',
          version: '1.0.0',
          description: 'Backend API service with Node.js and TypeScript',
          endpoints: {
            users: '/v1/users',
            messages: '/v1/messages',
            transactions: '/v1/transactions',
            outlets: '/v1/outlets',
            menus: '/v1/menus',
            vouchers: '/v1/vouchers',
            files: '/v1/files',
          },
          health: '/health',
        },
      });
    });

    this.app.use(config.apiPrefix, router);

    // Root endpoint
    this.app.get('/', (req: Request, res: Response) => {
      return ResponseHandler.success(res, {
        message: 'BE Mono Service API',
        data: {
          status: 'running',
          version: '1.0.0',
          timestamp: new Date().toISOString(),
        },
      });
    });
  }

  private initializeErrorHandling(): void {
    // Handle timeout errors
    this.app.use((err: any, req: Request, res: Response, next: NextFunction) => {
      if (err.timeout && req.timedout) {
        return ResponseHandler.error(res, {
          message: 'Request timed out',
          statusCode: 503,
          error: {
            code: 'TIMEOUT_ERROR',
          },
        });
      }
      next(err);
    });

    // 404 handler
    this.app.use(notFoundHandler);

    // Global error handler
    this.app.use(errorHandler);
  }

  public async initialize(): Promise<void> {
    try {
      // Connect to database
      await databaseManager.connect();
      logger.info('Application initialized successfully');
    } catch (error) {
      logger.error('Failed to initialize application:', error);
      throw error;
    }
  }
}

export default new Application();
