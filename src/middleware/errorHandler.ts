import { Request, Response, NextFunction } from 'express';
import { logger } from '../utils/logger';
import { isProduction } from '../config';
import { ResponseHandler } from '../utils/response/responseHandler';

export class AppError extends Error {
  constructor(
    public statusCode: number,
    public message: string,
    public code?: string,
    public details?: unknown,
    public isOperational = true,
  ) {
    super(message);
    Object.setPrototypeOf(this, AppError.prototype);
  }
}

export const errorHandler = (err: Error, _: Request, res: Response, __: NextFunction) => {
  if (err instanceof AppError) {
    return ResponseHandler.error(res, {
      message: err.message,
      statusCode: err.statusCode,
      error: {
        code: err.code,
        details: err.details,
      },
    });
  }

  logger.error('Error:', err);

  return ResponseHandler.error(res, {
    message: isProduction ? 'Internal server error' : err.message,
    statusCode: 500,
    error: {
      code: 'INTERNAL_SERVER_ERROR',
      details: isProduction ? undefined : err,
    },
  });
};
