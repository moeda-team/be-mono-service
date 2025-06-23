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
import { Category } from '../models/category';
import { SubTransactionGroup } from '../models/subTransaction';

export class SalesController {
  async getTransactionCountByCategory(req: Request, res: Response) {
    const user = req as Request & { user?: { outletId: string } };
    const outletId = user.user?.outletId;
    const { type } = req.params;
    const { start, end } = req.query;

    try {
      let startDate: Date;
      let endDate: Date;
      const now = new Date();

      switch (type) {
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
            return ResponseHandler.error(res, {
              message: 'Start and end date are required for type "range".',
              statusCode: 400,
            });
          }
          startDate = startOfDay(new Date(start as string));
          endDate = endOfDay(new Date(end as string));
          break;
        default:
          return ResponseHandler.error(res, {
            message:
              'Invalid type parameter. Must be one of: daily, weekly, monthly, annually, range.',
            statusCode: 400,
          });
      }

      const category = (await prisma.$queryRaw`
        SELECT id, name FROM menus."Category" WHERE "outletId" = ${outletId}
      `) as Category[];

      let dateGroup: { label: string; start: Date; end: Date }[];

      if (type === 'annually') {
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
        const categoryGroupForPeriod = category.map(item => ({
          id: item.id,
          name: item.name,
          count: 0,
        }));

        for (const cat of categoryGroupForPeriod) {
          const subTransaction = (await prisma.$queryRaw`
            SELECT st.id
            FROM transactions."SubTransaction" st
            INNER JOIN menus."Menu" m ON m.id = st."menuId"
            INNER JOIN menus."Category" c ON c.id = m."categoryId"
            WHERE st."createdAt" >= ${start} AND st."createdAt" <= ${end}
            AND c.id = ${cat.id}
          `) as SubTransactionGroup[];

          cat.count = subTransaction.length;
        }

        result.push({
          date: label,
          categoryGroup: categoryGroupForPeriod,
        });
      }

      result.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

      return ResponseHandler.success(res, {
        message: 'Transaction count by category retrieved successfully',
        data: result,
      });
    } catch (error) {
      logger.error('Error getting transaction count by category:', error);
      return ResponseHandler.error(res, {
        message: 'Internal server error',
        statusCode: 500,
      });
    }
  }

  async getTransactionCountByPaymentMethod(req: Request, res: Response) {
    const user = req as Request & { user?: { outletId: string } };
    const outletId = user.user?.outletId;
    const { type } = req.params;
    const { start, end } = req.query;

    try {
      let startDate: Date;
      let endDate: Date;
      const now = new Date();

      switch (type) {
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
            return ResponseHandler.error(res, {
              message: 'Start and end date are required for type "range".',
              statusCode: 400,
            });
          }
          startDate = startOfDay(new Date(start as string));
          endDate = endOfDay(new Date(end as string));
          break;
        default:
          return ResponseHandler.error(res, {
            message:
              'Invalid type parameter. Must be one of: daily, weekly, monthly, annually, range.',
            statusCode: 400,
          });
      }

      const distinctPaymentMethods = await prisma.transaction.findMany({
        distinct: ['paymentMethod'],
        select: {
          paymentMethod: true,
        },
      });

      let dateGroup: { label: string; start: Date; end: Date }[];

      if (type === 'annually') {
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
              tax: true,
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

      return ResponseHandler.success(res, {
        message: 'Transaction count by category retrieved successfully',
        data: result,
      });
    } catch (error) {
      logger.error('Error getting transaction cashflow:', error);
      return ResponseHandler.error(res, {
        message: 'Internal server error',
        statusCode: 500,
      });
    }
  }

  async getTransactionCashflow(req: Request, res: Response) {
    const user = req as Request & { user?: { outletId: string } };
    const outletId = user.user?.outletId;
    const { type } = req.params;
    const { start, end } = req.query;

    try {
      let startDate: Date;
      let endDate: Date;
      const now = new Date();

      switch (type) {
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
            return ResponseHandler.error(res, {
              message: 'Start and end date are required for type "range".',
              statusCode: 400,
            });
          }
          startDate = startOfDay(new Date(start as string));
          endDate = endOfDay(new Date(end as string));
          break;
        default:
          return ResponseHandler.error(res, {
            message:
              'Invalid type parameter. Must be one of: daily, weekly, monthly, annually, range.',
            statusCode: 400,
          });
      }

      const distinctPaymentMethods = await prisma.transaction.findMany({
        distinct: ['paymentMethod'],
        select: {
          paymentMethod: true,
        },
        where: {
          outletId,
        },
      });

      let dateGroup: { label: string; start: Date; end: Date }[];

      if (type === 'annually') {
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
            total: 0,
          }),
        );

        for (const paymentMethod of paymentMethodGroupForPeriod) {
          const totalCash = await prisma.transaction.aggregate({
            _sum: {
              total: true,
            },
            where: {
              createdAt: {
                gt: start,
                lt: end,
              },
              outletId,
              paymentMethod: paymentMethod.name,
            },
          });

          paymentMethod.total = totalCash._sum.total ? Number(totalCash._sum.total) : 0;
        }

        result.push({
          date: label,
          paymentMethodGroup: paymentMethodGroupForPeriod,
        });
      }

      result.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

      return ResponseHandler.success(res, {
        message: 'Transaction count by category retrieved successfully',
        data: result,
      });
    } catch (error) {
      logger.error('Error getting transaction cashflow:', error);
      return ResponseHandler.error(res, {
        message: 'Internal server error',
        statusCode: 500,
      });
    }
  }
}
