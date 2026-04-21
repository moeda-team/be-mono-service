import { Request, Response } from 'express';
import prisma from '../../../config/database';
import { comparePassword } from '../../../utils/auth/hash';
import { signToken, TokenType } from '../../../utils/auth/jwt';
import { ResponseHandler } from '../../../utils/response/responseHandler';
import { logger } from '../../../utils/common/logger';

export class AuthController {
  async login(req: Request, res: Response) {
    const { email, password } = req.body;
    if (!email || !password) {
      return ResponseHandler.error(res, {
        message: 'Email and password are required',
        statusCode: 400,
      });
    }
    try {
      const user = await prisma.user.findFirst({ where: { email } });
      if (!user) {
        return ResponseHandler.error(res, {
          message: 'Invalid credentials',
          statusCode: 401,
        });
      }
      const isMatch = await comparePassword(password, user.password);
      if (!isMatch) {
        return ResponseHandler.error(res, {
          message: 'Invalid credentials',
          statusCode: 401,
        });
      }

      let outlet = null;
      if (user.outletId) {
        outlet = await prisma.outlet.findFirst({ where: { id: user.outletId } });
        if (!outlet) {
          return ResponseHandler.error(res, {
            message: 'Outlet not found',
            statusCode: 401,
          });
        }
      }

      const token = signToken(
        { userId: user.id, outletId: user.outletId || undefined },
        TokenType.ACCESS,
      );
      const expiresIn = Number(process.env.JWT_ACCESS_EXPIRES_IN);
      const expiresOn = Math.floor(Date.now() / 1000) + expiresIn;

      return ResponseHandler.success(res, {
        message: 'Login successful',
        data: {
          id: user.id,
          name: user.name,
          email: user.email,
          role: user.role,
          token_type: 'Bearer',
          expires_in: expiresIn,
          ext_expires_in: expiresIn,
          access_token: token,
          expires_on: expiresOn.toString(),
          outlet,
        },
      });
    } catch (error) {
      logger.error('Error logging in:', error);
      return ResponseHandler.error(res, {
        message: 'Internal server error',
        statusCode: 500,
      });
    }
  }
}
