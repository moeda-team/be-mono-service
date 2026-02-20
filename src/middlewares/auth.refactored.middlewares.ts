import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { ResponseHandler } from '../utils/response/responseHandler';
import { AppError, ErrorCode } from '../utils/errors/custom.errors';
import { asyncHandler } from '../utils/errors/error.handler';
import { databaseManager } from '../config/database.refactored';

export interface AuthenticatedRequest extends Request {
  user?: {
    userId: string;
    outletId?: string;
    role: string;
    email: string;
  };
}

export interface JwtPayload {
  userId: string;
  outletId?: string;
  role: string;
  email: string;
  iat?: number;
  exp?: number;
}

export const jwtAuth = asyncHandler(async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  const authHeader = req.headers.authorization;
  
  if (!authHeader) {
    throw AppError.unauthorized('Authorization header is required', ErrorCode.UNAUTHORIZED);
  }

  if (!authHeader.startsWith('Bearer ')) {
    throw AppError.unauthorized('Bearer token is required', ErrorCode.INVALID_TOKEN);
  }

  const token = authHeader.substring(7);
  const jwtSecret = process.env.JWT_SECRET;

  if (!jwtSecret) {
    throw AppError.internal('JWT secret is not configured');
  }

  try {
    const decoded = jwt.verify(token, jwtSecret) as JwtPayload;
    
    // Validate required fields in token
    if (!decoded.userId || !decoded.role || !decoded.email) {
      throw AppError.unauthorized('Invalid token structure', ErrorCode.INVALID_TOKEN);
    }

    // Verify user still exists and is active
    const user = await databaseManager.client.user.findUnique({
      where: { id: decoded.userId },
      select: {
        id: true,
        outletId: true,
        role: true,
        email: true,
        status: true,
      },
    });

    if (!user) {
      throw AppError.unauthorized('User not found', ErrorCode.USER_NOT_FOUND);
    }

    if (user.status !== 'active') {
      throw AppError.unauthorized('User account is inactive', ErrorCode.FORBIDDEN);
    }

    // Attach user info to request
    req.user = {
      userId: user.id,
      outletId: user.outletId || undefined,
      role: user.role,
      email: user.email,
    };

    next();
  } catch (error) {
    if (error instanceof jwt.JsonWebTokenError) {
      throw AppError.unauthorized('Invalid token', ErrorCode.INVALID_TOKEN);
    }
    if (error instanceof jwt.TokenExpiredError) {
      throw AppError.unauthorized('Token expired', ErrorCode.TOKEN_EXPIRED);
    }
    if (error instanceof AppError) {
      throw error;
    }
    throw AppError.unauthorized('Authentication failed', ErrorCode.UNAUTHORIZED);
  }
});

export const requireRole = (...allowedRoles: string[]) => {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    if (!req.user) {
      throw AppError.unauthorized('Authentication required', ErrorCode.UNAUTHORIZED);
    }

    if (!allowedRoles.includes(req.user.role)) {
      throw AppError.forbidden(
        `Access denied. Required roles: ${allowedRoles.join(', ')}`,
        ErrorCode.FORBIDDEN
      );
    }

    next();
  };
};

export const requireOutletAccess = (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  if (!req.user) {
    throw AppError.unauthorized('Authentication required', ErrorCode.UNAUTHORIZED);
  }

  // Admin users can access all outlets
  if (req.user.role === 'ADMIN') {
    return next();
  }

  // Other users must have an outletId
  if (!req.user.outletId) {
    throw AppError.forbidden('Outlet access required', ErrorCode.FORBIDDEN);
  }

  next();
};

export const basicAuth = (req: Request, res: Response, next: NextFunction) => {
  const authHeader = req.headers.authorization;

  if (!authHeader) {
    return ResponseHandler.error(res, {
      message: 'Authorization header is required',
      statusCode: 401,
      error: {
        code: ErrorCode.UNAUTHORIZED,
      },
    });
  }

  if (!authHeader.startsWith('Basic ')) {
    return ResponseHandler.error(res, {
      message: 'Basic authentication is required',
      statusCode: 401,
      error: {
        code: ErrorCode.UNAUTHORIZED,
      },
    });
  }

  try {
    const base64Credentials = authHeader.split(' ')[1];
    const credentials = Buffer.from(base64Credentials, 'base64').toString('utf8');
    const [username, password] = credentials.split(':');
    
    const AUTH_USERNAME = process.env.AUTH_USERNAME;
    const AUTH_PASSWORD = process.env.AUTH_PASSWORD;

    if (!AUTH_USERNAME || !AUTH_PASSWORD) {
      return ResponseHandler.error(res, {
        message: 'Authentication configuration is missing',
        statusCode: 500,
        error: {
          code: ErrorCode.INTERNAL_SERVER_ERROR,
        },
      });
    }

    if (username !== AUTH_USERNAME || password !== AUTH_PASSWORD) {
      return ResponseHandler.error(res, {
        message: 'Invalid credentials',
        statusCode: 401,
        error: {
          code: ErrorCode.UNAUTHORIZED,
        },
      });
    }

    next();
  } catch (error) {
    return ResponseHandler.error(res, {
      message: 'Invalid authentication format',
      statusCode: 401,
      error: {
        code: ErrorCode.UNAUTHORIZED,
      },
    });
  }
};
