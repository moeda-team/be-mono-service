import { Request, Response, NextFunction } from 'express';
import { verifyToken, JwtPayload, TokenType } from '../utils/auth/jwt';
import { ResponseHandler } from '../utils/response/responseHandler';

export function jwtAuth(req: Request, res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return ResponseHandler.error(res, {
      message: 'Authorization header missing or invalid',
      statusCode: 401,
    });
  }
  const token = authHeader.split(' ')[1];
  try {
    const payload = verifyToken(token);
    (req as Request & { user?: JwtPayload }).user = payload;
    next();
  } catch (err) {
    return ResponseHandler.error(res, {
      message: 'Invalid or expired token',
      statusCode: 401,
    });
  }
}

export function jwtAuthNotRequired(req: Request, res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization;

  // If no auth header, continue without authentication
  if (!authHeader) {
    next();
    return;
  }

  // Try JWT authentication first
  if (authHeader.startsWith('Bearer ')) {
    const token = authHeader.split(' ')[1];
    try {
      const payload = verifyToken(token);
      (req as Request & { user?: JwtPayload }).user = payload;
      next();
      return;
    } catch (err) {
      // JWT failed, continue to try basic auth
    }
  }

  // Try Basic authentication if JWT failed or not present
  if (authHeader.startsWith('Basic ')) {
    const base64Credentials = authHeader.split(' ')[1];
    try {
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

      // Set user for basic auth
      (req as Request & { user?: JwtPayload }).user = {
        userId: username,
        tokenType: TokenType.ACCESS,
        iat: Math.floor(Date.now() / 1000),
      } as JwtPayload;

      next();
      return;
    } catch (err) {
      return ResponseHandler.error(res, {
        message: 'Invalid basic authentication format',
        statusCode: 401,
      });
    }
  }

  // If auth header is present but doesn't match Bearer or Basic, return unauthorized
  return ResponseHandler.error(res, {
    message: 'Invalid authentication method',
    statusCode: 401,
  });
}
