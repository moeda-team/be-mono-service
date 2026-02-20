import { Request, Response, NextFunction } from 'express';
import { logger } from '../common/logger';
import { AppError, ErrorCode } from './custom.errors';
import { ResponseHandler } from '../response/responseHandler';

export const errorHandler = (
  error: Error | AppError,
  req: Request,
  res: Response,
  next: NextFunction,
): void => {
  let statusCode = 500;
  let errorCode = ErrorCode.INTERNAL_SERVER_ERROR;
  let message = 'Internal server error';
  let details: unknown = undefined;

  // Handle operational errors (AppError instances)
  if (error instanceof AppError) {
    statusCode = error.statusCode;
    errorCode = error.code;
    message = error.message;
    details = error.details;
  } else {
    // Handle unexpected errors
    logger.error('Unexpected error:', {
      error: error.message,
      stack: error.stack,
      url: req.url,
      method: req.method,
      ip: req.ip,
      userAgent: req.get('User-Agent'),
    });

    // Handle specific known error types
    if (error.name === 'ValidationError') {
      statusCode = 400;
      errorCode = ErrorCode.VALIDATION_ERROR;
      message = 'Validation failed';
    } else if (error.name === 'CastError') {
      statusCode = 400;
      errorCode = ErrorCode.INVALID_INPUT;
      message = 'Invalid input format';
    } else if (error.name === 'JsonWebTokenError') {
      statusCode = 401;
      errorCode = ErrorCode.INVALID_TOKEN;
      message = 'Invalid token';
    } else if (error.name === 'TokenExpiredError') {
      statusCode = 401;
      errorCode = ErrorCode.TOKEN_EXPIRED;
      message = 'Token expired';
    } else if (error.name === 'PrismaClientKnownRequestError') {
      const prismaError = error as any;
      statusCode = 400;
      errorCode = ErrorCode.DATABASE_ERROR;

      switch (prismaError.code) {
        case 'P2002':
          message = 'Unique constraint violation';
          errorCode = ErrorCode.CONFLICT;
          break;
        case 'P2025':
          message = 'Record not found';
          errorCode = ErrorCode.NOT_FOUND;
          statusCode = 404;
          break;
        case 'P2003':
          message = 'Foreign key constraint violation';
          errorCode = ErrorCode.VALIDATION_ERROR;
          break;
        default:
          message = 'Database operation failed';
      }

      details = {
        prismaCode: prismaError.code,
        target: prismaError.meta?.target,
      };
    } else if (error.name === 'PrismaClientUnknownRequestError') {
      statusCode = 500;
      errorCode = ErrorCode.DATABASE_ERROR;
      message = 'Database request failed';
    } else if (error.name === 'PrismaClientRustPanicError') {
      statusCode = 500;
      errorCode = ErrorCode.DATABASE_ERROR;
      message = 'Database connection panic';
    } else if (error.name === 'PrismaClientInitializationError') {
      statusCode = 503;
      errorCode = ErrorCode.CONNECTION_ERROR;
      message = 'Database connection failed';
    } else if (error.name === 'PrismaClientValidationError') {
      statusCode = 400;
      errorCode = ErrorCode.VALIDATION_ERROR;
      message = 'Database query validation failed';
    }
  }

  // Log error details
  const logLevel = statusCode >= 500 ? 'error' : 'warn';
  logger[logLevel]('Error handled:', {
    message: error.message,
    statusCode,
    errorCode,
    url: req.url,
    method: req.method,
    ip: req.ip,
    userAgent: req.get('User-Agent'),
    userId: (req as any).user?.userId,
    outletId: (req as any).user?.outletId,
    stack: error.stack,
    details,
  });

  // Send error response
  ResponseHandler.error(res, {
    message,
    statusCode,
    error: {
      code: errorCode,
      details: process.env.NODE_ENV === 'development' ? details : undefined,
    },
  });
};

export const notFoundHandler = (req: Request, res: Response, next: NextFunction): void => {
  const message = `Route ${req.method} ${req.originalUrl} not found`;
  logger.warn('Route not found:', {
    url: req.originalUrl,
    method: req.method,
    ip: req.ip,
    userAgent: req.get('User-Agent'),
  });

  ResponseHandler.error(res, {
    message,
    statusCode: 404,
    error: {
      code: ErrorCode.NOT_FOUND,
    },
  });
};

export const asyncHandler = (fn: Function) => {
  return (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};
