import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import timeout from 'connect-timeout';
import { Router, NextFunction, Request, Response } from 'express';

import { config } from './config';
import { errorHandler, notFoundHandler, rateLimiter } from './middlewares';
import { logger } from './utils/common/logger';
import { ResponseHandler } from './utils/response/responseHandler';
import { databaseManager, prisma } from './config/database';
import userRouter from './modules/users/routes';
import messageRouter from './modules/messages/routes';
import transactionRouter from './modules/transactions/routes';
import outletRouter from './modules/outlets/routes';
import menuRouter from './modules/menus/routes';
import voucherRouter from './modules/vouchers/routes';
import fileRouter from './modules/files/routes';
import inventoryRouter from './modules/inventories';
import { activityRoutes } from './modules/inventories';
import discountRouter from './modules/discounts/routes';
import tableRouter from './modules/tables/routes';
import websocketRouter from './modules/websockets/routes';
import cashBalanceRouter from './modules/cash-balances/routes/cash-balance.routes';
import reportRouter from './modules/reports/routes';
import attendanceRouter from './modules/attendances/routes/attendance.routes';

const app = express();
app.set('trust proxy', config.trustProxy);
const allowedOrigins = config.corsOrigin.split(',').map(origin => origin.trim());

const isCorsAllowAll = allowedOrigins.length === 1 && allowedOrigins[0] === '*';

const haltOnTimedout = (req: Request, res: Response, next: NextFunction) => {
  if (!req.timedout) {
    next();
  }
};

// Health check endpoint
app.get('/health', async (req: Request, res: Response) => {
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

// Apply rate limiter to all routes except WebSocket
app.use((req, res, next) => {
  if (req.path.startsWith('/v1/websockets') || req.path.includes('/socket.io/')) {
    return next();
  }
  return rateLimiter(req, res, next);
});
app.use(timeout('10s'));
app.use(haltOnTimedout);
app.use(helmet());
app.use(
  cors({
    origin: (origin, callback) => {
      if (isCorsAllowAll) {
        callback(null, true);
      } else if (!origin || allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        callback(new Error('Not allowed by CORS'));
      }
    },
    credentials: true,
  }),
);

app.use(morgan('combined', { stream: { write: message => logger.info(message.trim()) } }));
app.use(express.json());
app.use(haltOnTimedout);
app.use(express.urlencoded({ extended: true }));
app.use(haltOnTimedout);

const router = Router();

router.use(`/v1/users`, userRouter);
router.use(`/v1/messages`, messageRouter);
router.use(`/v1/transactions`, transactionRouter);
router.use(`/v1/outlets`, outletRouter);
router.use(`/v1/menus`, menuRouter);
router.use(`/v1/vouchers`, voucherRouter);
router.use(`/v1/files`, fileRouter);
router.use(`/v1/inventories/activities`, activityRoutes);
router.use(`/v1/inventories`, inventoryRouter);
router.use(`/v1/discounts`, discountRouter);
router.use(`/v1/tables`, tableRouter);
router.use(`/v1/websockets`, websocketRouter);
router.use(`/v1/cash-balances`, cashBalanceRouter);
router.use(`/v1/reports`, reportRouter);
router.use(`/v1/attendances`, attendanceRouter);

app.use(router);

// eslint-disable-next-line @typescript-eslint/no-explicit-any
app.use((err: any, req: Request, res: Response, next: NextFunction) => {
  if (err.timeout && req.timedout) {
    return ResponseHandler.error(res, {
      message: 'Request timed out',
      statusCode: 503,
    });
  }
  next(err);
});

app.use(notFoundHandler);
app.use(errorHandler);

export default app;
