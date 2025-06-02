import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import { config } from './config';
import { errorHandler, notFoundHandler } from './middleware';
import { routes } from './routes';
import { logger } from './utils/logger';
import timeout from 'connect-timeout';
import { ResponseHandler } from './utils/response/responseHandler';

const app = express();

app.use(timeout('5s'));

app.use(helmet());
app.use(
  cors({
    origin: config.corsOrigin,
  }),
);
app.use(morgan('combined', { stream: { write: message => logger.info(message.trim()) } }));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use((req, res, _) => {
  if (!req.timedout) {
    return ResponseHandler.error(res, {
      message: 'Internal server error',
      statusCode: 500,
    });
  }
});

app.use(config.apiPrefix, routes);
app.use(notFoundHandler);
app.use(errorHandler);

export { app };
