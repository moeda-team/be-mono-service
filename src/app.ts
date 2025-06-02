import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import timeout from 'connect-timeout';
import { Router } from 'express';
import { NextFunction, Request, Response } from 'express';

import { config } from './config';
import { errorHandler, notFoundHandler } from './middlewares';
import { logger } from './utils/logger';
import { ResponseHandler } from './utils/response/responseHandler';
import userRouter from './modules/users/routes/users.routes';

const app = express();

app.use(timeout('5s'));
app.use(helmet());
app.use(cors({ origin: config.corsOrigin }));
app.use(morgan('combined', { stream: { write: message => logger.info(message.trim()) } }));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

const router = Router();
router.use(`${config.apiPrefix}/v1/users`, userRouter);
app.use(router);

app.use(notFoundHandler);
app.use(errorHandler);

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

export { app };
