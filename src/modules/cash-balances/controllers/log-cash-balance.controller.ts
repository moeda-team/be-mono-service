import { Request, Response } from 'express';
import { logger } from '../../../utils/common/logger';
import { ResponseHandler } from '../../../utils/response/responseHandler';
import prisma from '../../../config/database';
import { Prisma } from '@prisma/client';
import { Decimal as DecimalClass } from '@prisma/client/runtime/library';
import { resolveOutletFilter } from '../../../utils/auth/outletAccess';

export class LogCashBalanceController {
  async getAllLogCashBalances(req: Request, res: Response) {
    const user = (req as Request & { user: { outletId?: string; role?: string } }).user;
    const outletId = resolveOutletFilter(user, req.query.outletId as string | undefined);

    const { search, type } = req.query as { search: string; type: string };
    const page = parseInt(req.query.page as string) || null;
    const limit = parseInt(req.query.limit as string) || null;

    const skip = page && limit ? (page - 1) * limit : undefined;
    const take = limit || undefined;

    try {
      const whereClause: Prisma.LogCashBalanceWhereInput = {
        outletId,
      };

      if (type) {
        whereClause.type = type;
      }

      if (search) {
        whereClause.OR = [
          {
            description: {
              contains: search,
              mode: 'insensitive',
            },
          },
        ];
      }

      const logs = await prisma.logCashBalance.findMany({
        where: whereClause,
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
        skip,
        take,
      });

      if (page && limit) {
        const total = await prisma.logCashBalance.count({ where: whereClause });
        return ResponseHandler.success(res, {
          message: 'Cash balance logs retrieved successfully',
          data: logs,
          pagination: {
            page,
            limit,
            total,
            totalPages: Math.ceil(total / limit),
          },
        });
      }

      return ResponseHandler.success(res, {
        message: 'Cash balance logs retrieved successfully',
        data: logs,
      });
    } catch (error) {
      logger.error('Error getting cash balance logs:', error);
      return ResponseHandler.error(res, {
        message: 'Internal server error',
        statusCode: 500,
      });
    }
  }

  async getLogCashBalanceById(req: Request, res: Response) {
    const user = (req as Request & { user: { outletId?: string; role?: string } }).user;
    const outletId = resolveOutletFilter(user, req.query.outletId as string | undefined);
    const { id } = req.params;

    try {
      const log = await prisma.logCashBalance.findFirst({
        where: { id, outletId },
        include: {
          user: {
            select: {
              id: true,
              name: true,
            },
          },
          cashBalance: true,
        },
      });

      if (!log) {
        return ResponseHandler.error(res, {
          message: 'Cash balance log not found',
          statusCode: 404,
        });
      }

      return ResponseHandler.success(res, {
        message: 'Cash balance log retrieved successfully',
        data: log,
      });
    } catch (error) {
      logger.error('Error getting cash balance log:', error);
      return ResponseHandler.error(res, {
        message: 'Internal server error',
        statusCode: 500,
      });
    }
  }

  async createLogCashBalance(req: Request, res: Response) {
    const user = (req as Request & { user: { outletId: string; id: string } }).user;
    const { amount, type, description, note } = req.body;

    try {
      if (!user.outletId) {
        return ResponseHandler.error(res, {
          message: 'Outlet not found',
          statusCode: 404,
        });
      }

      // Find the cash balance for this outlet
      const cashBalance = await prisma.cashBalance.findFirst({
        where: { outletId: user.outletId },
      });

      if (!cashBalance) {
        return ResponseHandler.error(res, {
          message: 'Cash balance not found for this outlet',
          statusCode: 404,
        });
      }

      // Calculate new balance based on transaction type
      let newAmount: DecimalClass;
      const amountNum = Number(amount);
      const currentBalanceNum = Number(cashBalance.amount);

      if (type === 'ADD') {
        newAmount = new DecimalClass(currentBalanceNum + amountNum);
      } else if (type === 'REDUCE') {
        newAmount = new DecimalClass(currentBalanceNum - amountNum);
        if (newAmount.toNumber() < 0) {
          return ResponseHandler.error(res, {
            message: 'Insufficient cash balance',
            statusCode: 400,
          });
        }
      } else {
        newAmount = cashBalance.amount;
      }

      // Create log entry
      const log = await prisma.logCashBalance.create({
        data: {
          cashBalanceId: cashBalance.id,
          outletId: user.outletId,
          userId: user.id,
          type,
          amount: Number(amount),
          previousAmount: cashBalance.amount,
          description,
        },
      });

      // Update cash balance
      await prisma.cashBalance.update({
        where: { id: cashBalance.id },
        data: { amount: newAmount },
      });

      return ResponseHandler.success(res, {
        message: 'Cash balance log created successfully',
        data: log,
      });
    } catch (error) {
      logger.error('Error creating cash balance log:', error);
      return ResponseHandler.error(res, {
        message: 'Internal server error',
        statusCode: 500,
      });
    }
  }

  async updateLogCashBalance(req: Request, res: Response) {
    const user = (req as Request & { user: { outletId: string } }).user;
    const { id } = req.params;
    const { cancelNote } = req.body;

    try {
      if (!user.outletId) {
        return ResponseHandler.error(res, {
          message: 'Outlet not found',
          statusCode: 404,
        });
      }

      const existingLog = await prisma.logCashBalance.findFirst({
        where: { id, outletId: user.outletId },
      });

      if (!existingLog) {
        return ResponseHandler.error(res, {
          message: 'Cash balance log not found',
          statusCode: 404,
        });
      }

      if (existingLog.status === 'cancelled') {
        return ResponseHandler.error(res, {
          message: 'Cash balance log is already cancelled',
          statusCode: 400,
        });
      }

      // Get current cash balance
      const cashBalance = await prisma.cashBalance.findFirst({
        where: { outletId: user.outletId },
      });

      if (!cashBalance) {
        return ResponseHandler.error(res, {
          message: 'Cash balance not found for this outlet',
          statusCode: 404,
        });
      }

      // Calculate new balance by reversing the original transaction
      let newAmount: DecimalClass;
      const currentBalanceNum = Number(cashBalance.amount);
      const logAmountNum = Number(existingLog.amount);

      if (existingLog.type === 'ADD') {
        // Reverse ADD operation: subtract the amount
        newAmount = new DecimalClass(currentBalanceNum - logAmountNum);
      } else if (existingLog.type === 'REDUCE') {
        // Reverse REDUCE operation: add the amount back
        newAmount = new DecimalClass(currentBalanceNum + logAmountNum);
      } else {
        newAmount = cashBalance.amount;
      }

      // Update the log status
      const updatedLog = await prisma.logCashBalance.update({
        where: { id },
        data: {
          status: 'cancelled',
          cancelNote,
        },
      });

      // Update cash balance
      await prisma.cashBalance.update({
        where: { id: cashBalance.id },
        data: { amount: newAmount },
      });

      return ResponseHandler.success(res, {
        message: 'Cash balance log cancelled successfully',
        data: updatedLog,
      });
    } catch (error) {
      logger.error('Error updating cash balance log:', error);
      return ResponseHandler.error(res, {
        message: 'Internal server error',
        statusCode: 500,
      });
    }
  }
}
