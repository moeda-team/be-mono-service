import { Request, Response, NextFunction } from 'express';
import { ResponseHandler } from '../utils/response/responseHandler';

export const basicAuth = (req: Request, res: Response, next: NextFunction) => {
  const authHeader = req.headers.authorization;

  if (!authHeader) {
    return ResponseHandler.error(res, {
      message: 'Authorization header is required',
      statusCode: 401,
    });
  }

  if (!authHeader.startsWith('Basic ')) {
    return ResponseHandler.error(res, {
      message: 'Basic authentication is required',
      statusCode: 401,
    });
  }

  const base64Credentials = authHeader.split(' ')[1];
  const credentials = Buffer.from(base64Credentials, 'base64').toString('utf8');
  const [username, password] = credentials.split(':');
  const AUTH_USERNAME = process.env.AUTH_USERNAME;
  const AUTH_PASSWORD = process.env.AUTH_PASSWORD;

  if (!AUTH_USERNAME || !AUTH_PASSWORD) {
    return ResponseHandler.error(res, {
      message: 'Authentication configuration is missing',
      statusCode: 500,
    });
  }

  if (username !== AUTH_USERNAME || password !== AUTH_PASSWORD) {
    return ResponseHandler.error(res, {
      message: 'Invalid credentials',
      statusCode: 401,
    });
  }

  next();
};
