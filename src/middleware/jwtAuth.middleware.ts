import { Request, Response, NextFunction } from 'express';
import { verifyToken, JwtPayload } from '../utils/jwt';
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
