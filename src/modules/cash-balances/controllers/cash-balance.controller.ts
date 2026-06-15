import { Request, Response } from 'express';
import { logger } from '../../../utils/common/logger';
import { ResponseHandler } from '../../../utils/response/responseHandler';
import prisma from '../../../config/database';
import { Prisma } from '@prisma/client';
import { resolveOutletFilter } from '../../../utils/auth/outletAccess';

export class CashBalanceController {
  async getAllCashBalances(req: Request, res: Response) {
    const user = (req as Request & { user: { outletId?: string; role?: string } }).user;
    const outletId = resolveOutletFilter(user, req.query.outletId as string | undefined);

    const { search } = req.query as { search: string };
    const page = parseInt(req.query.page as string) || null;
    const limit = parseInt(req.query.limit as string) || null;

    const searchStr: string | undefined = typeof search === 'string' ? search : undefined;
    const skip = page && limit ? (page - 1) * limit : undefined;
    const take = limit || undefined;

    try {
      const whereClause: Prisma.CashBalanceWhereInput = {
        outletId,
      };

      const cashBalances = await prisma.cashBalance.findMany({
        where: whereClause,
        orderBy: {
          createdAt: 'desc',
        },
        include: {
          logCashBalances: {
            orderBy: {
              createdAt: 'desc',
            },
          },
        },
        skip,
        take,
      });

      if (page && limit) {
        const total = await prisma.cashBalance.count({ where: whereClause });
        return ResponseHandler.success(res, {
          message: 'Cash balances retrieved successfully',
          data: cashBalances,
          pagination: {
            page,
            limit,
            total,
            totalPages: Math.ceil(total / limit),
          },
        });
      }

      return ResponseHandler.success(res, {
        message: 'Cash balances retrieved successfully',
        data: cashBalances,
      });
    } catch (error) {
      logger.error('Error getting cash balances:', error);
      return ResponseHandler.error(res, {
        message: 'Internal server error',
        statusCode: 500,
      });
    }
  }

  async getCashBalanceCurrent(req: Request, res: Response) {
    const user = (req as Request & { user: { outletId?: string; role?: string } }).user;
    const outletId = resolveOutletFilter(user, req.query.outletId as string | undefined);

    try {
      const cashBalance = await prisma.cashBalance.findFirst({
        where: { outletId },
        include: {
          logCashBalances: {
            orderBy: {
              createdAt: 'desc',
            },
            include: {
              user: {
                select: {
                  id: true,
                  name: true,
                },
              },
            },
          },
        },
      });

      if (!cashBalance) {
        return ResponseHandler.error(res, {
          message: 'Cash balance not found',
          statusCode: 404,
        });
      }

      return ResponseHandler.success(res, {
        message: 'Cash balance retrieved successfully',
        data: cashBalance,
      });
    } catch (error) {
      logger.error('Error getting cash balance:', error);
      return ResponseHandler.error(res, {
        message: 'Internal server error',
        statusCode: 500,
      });
    }
  }
}
