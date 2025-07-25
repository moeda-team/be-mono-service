import { Request, Response } from 'express';
import { logger } from '../../../utils/common/logger';
import { ResponseHandler } from '../../../utils/response/responseHandler';
import prisma from '../../../lib/prisma';

import {
  startOfDay,
  startOfWeek,
  startOfMonth,
  startOfYear,
  endOfDay,
  endOfWeek,
  endOfMonth,
  endOfYear,
  format,
} from 'date-fns';

export class SalesController {
  getTransactionCount = async (req: Request, res: Response) => {
    const user = req as Request & { user?: { outletId: string } };
    const outletId = user.user?.outletId;
    const { type } = req.params;
    const { method, start, end } = req.query;

    try {
      switch (type) {
        case 'category': {
          const result = await this.getTransactionCountByCategory(
            outletId as string,
            method as string,
            start as string,
            end as string,
          );
          return ResponseHandler.success(res, {
            message: 'Transaction count by category retrieved successfully',
            data: result,
          });
        }
        case 'payment_method': {
          const result = await this.getTransactionCountByPaymentMethod(
            outletId as string,
            method as string,
            start as string,
            end as string,
          );
          return ResponseHandler.success(res, {
            message: 'Transaction count by payment method retrieved successfully',
            data: result,
          });
        }
        case 'cashflow': {
          const result = await this.getTransactionCashflow(
            outletId as string,
            method as string,
            start as string,
            end as string,
          );
          return ResponseHandler.success(res, {
            message: 'Transaction cashflow retrieved successfully',
            data: result,
          });
        }
      }
    } catch (error) {
      logger.error('Error getting transaction count by category:', error);
      return ResponseHandler.error(res, {
        message: 'Internal server error',
        statusCode: 500,
      });
    }
  };

  async getTransactionCountByCategory(
    outletId: string,
    method: string,
    start: string,
    end: string,
  ) {
    try {
      const now = new Date();
      let startDate: Date, endDate: Date;

      switch (method) {
        case 'daily':
          startDate = startOfDay(now);
          endDate = endOfDay(now);
          break;
        case 'weekly':
          startDate = startOfWeek(now, { weekStartsOn: 1 });
          endDate = endOfWeek(now, { weekStartsOn: 1 });
          break;
        case 'monthly':
          startDate = startOfMonth(now);
          endDate = endOfMonth(now);
          break;
        case 'annually':
          startDate = startOfYear(now);
          endDate = endOfYear(now);
          break;
        case 'range':
          if (!start || !end) {
            return {
              message: 'Start and end date are required for method "range".',
              statusCode: 400,
            };
          }
          startDate = startOfDay(new Date(start));
          endDate = endOfDay(new Date(end));
          break;
        default:
          return {
            message:
              'Invalid method parameter. Must be one of: daily, weekly, monthly, annually, range.',
            statusCode: 400,
          };
      }

      const categories = await prisma.category.findMany({
        where: { outletId },
        select: { id: true, name: true },
      });

      let dateGroups: { label: string; start: Date; end: Date }[];

      if (method === 'annually') {
        dateGroups = Array.from({ length: 12 }).map((_, i) => {
          const month = new Date(now.getFullYear(), i, 1);
          return {
            label: format(month, 'MMMM'),
            start: startOfMonth(month),
            end: endOfMonth(month),
          };
        });
      } else {
        const totalDays = Math.ceil(
          (endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24),
        );
        dateGroups = Array.from({ length: totalDays }).map((_, i) => {
          const date = new Date(startDate.getTime() + i * 24 * 60 * 60 * 1000);
          return {
            label: format(date, 'yyyy-MM-dd'),
            start: startOfDay(date),
            end: endOfDay(date),
          };
        });
      }

      const result = [];

      for (const { label, start, end } of dateGroups) {
        const subTransactionCounts = await prisma.subTransaction.groupBy({
          by: ['menuId'],
          where: {
            createdAt: {
              gte: start,
              lte: end,
            },
            menu: {
              category: {
                outletId,
              },
            },
          },
          _count: {
            id: true,
          },
        });

        const menuWithCategory = await prisma.menu.findMany({
          where: {
            category: {
              outletId,
            },
          },
          select: {
            id: true,
            categoryId: true,
          },
        });

        const menuMap = new Map(menuWithCategory.map(m => [m.id, m.categoryId]));

        const categoryCountMap: Record<string, number> = {};

        subTransactionCounts.forEach(tx => {
          const categoryId = menuMap.get(tx.menuId);
          if (categoryId) {
            categoryCountMap[categoryId] = (categoryCountMap[categoryId] || 0) + tx._count.id;
          }
        });

        const categoryGroup = categories.map(cat => ({
          id: cat.id,
          name: cat.name,
          count: categoryCountMap[cat.id] || 0,
        }));

        result.push({
          date: label,
          categoryGroup,
        });
      }

      return {
        message: 'Transaction count by category retrieved successfully',
        data: result,
      };
    } catch (error) {
      logger.error('Error getting transaction count by category:', error);
      return {
        message: 'Internal server error',
        statusCode: 500,
      };
    }
  }

  async getTransactionCountByPaymentMethod(
    outletId: string,
    method: string,
    start: string,
    end: string,
  ) {
    try {
      let startDate: Date;
      let endDate: Date;
      const now = new Date();

      switch (method) {
        case 'daily':
          startDate = startOfDay(now);
          endDate = endOfDay(now);
          break;
        case 'weekly':
          startDate = startOfWeek(now, { weekStartsOn: 1 });
          endDate = endOfWeek(now, { weekStartsOn: 1 });
          break;
        case 'monthly':
          startDate = startOfMonth(now);
          endDate = endOfMonth(now);
          break;
        case 'annually':
          startDate = startOfYear(now);
          endDate = endOfYear(now);
          break;
        case 'range':
          if (!start || !end) {
            return {
              message: 'Start and end date are required for method "range".',
              statusCode: 400,
            };
          }
          startDate = startOfDay(new Date(start as string));
          endDate = endOfDay(new Date(end as string));
          break;
        default:
          return {
            message:
              'Invalid method parameter. Must be one of: daily, weekly, monthly, annually, range.',
            statusCode: 400,
          };
      }

      const distinctPaymentMethods = await prisma.transaction.findMany({
        distinct: ['paymentMethod'],
        select: {
          paymentMethod: true,
        },
      });

      let dateGroup: { label: string; start: Date; end: Date }[];

      if (method === 'annually') {
        dateGroup = Array.from({ length: 12 }).map((_, i) => {
          const monthDate = new Date(now.getFullYear(), i, 1);
          return {
            label: format(monthDate, 'MMMM'),
            start: startOfMonth(monthDate),
            end: endOfMonth(monthDate),
          };
        });
      } else {
        const totalDays = Math.ceil(
          (endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24),
        );
        dateGroup = Array.from({ length: totalDays }).map((_, i) => {
          const date = new Date(startDate.getTime() + i * 24 * 60 * 60 * 1000);
          return {
            label: format(date, 'yyyy-MM-dd'),
            start: startOfDay(date),
            end: endOfDay(date),
          };
        });
      }

      const result = [];

      for (const { label, start, end } of dateGroup) {
        const paymentMethodGroupForPeriod = distinctPaymentMethods.map(
          (item: { paymentMethod: string }) => ({
            name: item.paymentMethod,
            count: 0,
          }),
        );

        for (const paymentMethod of paymentMethodGroupForPeriod) {
          const transactions = await prisma.transaction.findMany({
            where: {
              outletId,
              createdAt: {
                gte: start,
                lt: end,
              },
              paymentMethod: paymentMethod.name,
            },
            select: {
              id: true,
              subTotal: true,
              discount: true,
              serviceCharge: true,
              total: true,
              paymentMethod: true,
              createdAt: true,
            },
          });

          paymentMethod.count = transactions.length;
        }

        result.push({
          date: label,
          paymentMethodGroup: paymentMethodGroupForPeriod,
        });
      }

      result.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

      return {
        message: 'Transaction count by payment method retrieved successfully',
        data: result,
      };
    } catch (error) {
      logger.error('Error getting transaction cashflow:', error);
      return {
        message: 'Internal server error',
        statusCode: 500,
      };
    }
  }

  async getTransactionCashflow(outletId: string, method: string, start: string, end: string) {
    try {
      const now = new Date();
      let startDate: Date;
      let endDate: Date;

      switch (method) {
        case 'daily':
          startDate = startOfDay(now);
          endDate = endOfDay(now);
          break;
        case 'weekly':
          startDate = startOfWeek(now, { weekStartsOn: 1 });
          endDate = endOfWeek(now, { weekStartsOn: 1 });
          break;
        case 'monthly':
          startDate = startOfMonth(now);
          endDate = endOfMonth(now);
          break;
        case 'annually':
          startDate = startOfYear(now);
          endDate = endOfYear(now);
          break;
        case 'range':
          if (!start || !end) {
            return {
              message: 'Start and end date are required for method "range".',
              statusCode: 400,
            };
          }
          startDate = startOfDay(new Date(start));
          endDate = endOfDay(new Date(end));
          break;
        default:
          return {
            message:
              'Invalid method parameter. Must be one of: daily, weekly, monthly, annually, range.',
            statusCode: 400,
          };
      }

      const paymentMethods = await prisma.transaction.findMany({
        distinct: ['paymentMethod'],
        select: { paymentMethod: true },
        where: { outletId },
      });
      const methodList = paymentMethods.map(pm => pm.paymentMethod);

      let dateGroups: { label: string; start: Date; end: Date }[];

      if (method === 'annually') {
        dateGroups = Array.from({ length: 12 }).map((_, i) => {
          const date = new Date(now.getFullYear(), i, 1);
          return {
            label: format(date, 'MMMM'),
            start: startOfMonth(date),
            end: endOfMonth(date),
          };
        });
      } else {
        const totalDays = Math.ceil(
          (endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24),
        );
        dateGroups = Array.from({ length: totalDays }).map((_, i) => {
          const date = new Date(startDate.getTime() + i * 24 * 60 * 60 * 1000);
          return {
            label: format(date, 'yyyy-MM-dd'),
            start: startOfDay(date),
            end: endOfDay(date),
          };
        });
      }

      const result: { date: string; paymentMethodGroup: { name: string; total: number }[] }[] = [];

      for (const { label, start, end } of dateGroups) {
        const cashTotals = await prisma.transaction.groupBy({
          by: ['paymentMethod'],
          _sum: { total: true },
          where: {
            outletId,
            createdAt: { gte: start, lte: end },
          },
        });

        const paymentMethodGroup = methodList.map(paymentMethod => {
          const found = cashTotals.find(ct => ct.paymentMethod === paymentMethod);
          return {
            name: paymentMethod,
            total: Number(found?._sum.total ?? 0),
          };
        });

        result.push({
          date: label,
          paymentMethodGroup,
        });
      }

      return {
        message: 'Transaction cashflow retrieved successfully',
        data: result,
      };
    } catch (error) {
      logger.error('Error getting transaction cashflow:', error);
      return {
        message: 'Internal server error',
        statusCode: 500,
      };
    }
  }
}
