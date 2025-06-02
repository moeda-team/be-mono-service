import { Request, Response, NextFunction } from 'express';
import { ResponseHandler } from '../utils/response/responseHandler';
import { hasPermission, UserRole } from '../utils/jwt';
import prisma from '../lib/prisma';

export function roleAuth(requiredRole: UserRole) {
  return async (req: Request, res: Response, next: NextFunction) => {
    const user = (req as Request & { user: { userId: string } }).user;

    const getUser = await prisma.user.findUnique({
      where: {
        id: user.userId,
      },
    });
    if (!getUser) {
      return ResponseHandler.error(res, {
        message: 'User not found',
        statusCode: 404,
      });
    }

    if (!getUser.role || !hasPermission(getUser.role as UserRole, requiredRole)) {
      return ResponseHandler.error(res, {
        message: 'Insufficient permissions',
        statusCode: 403,
      });
    }

    next();
  };
}
