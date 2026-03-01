import { Request, Response } from 'express';
import { logger } from '../../../utils/common/logger';
import { ResponseHandler } from '../../../utils/response/responseHandler';
import { addDays, format } from 'date-fns';
import { DailyReportDetail, DailyReportResponse } from '../models/report';
import prisma from '../../../config/database';

export class ReportController {
  async dailyReport(req: Request, res: Response) {
    const user = (req as Request & { user: { outletId: string } }).user;

    try {
      const date = (req.query.date as string) || format(new Date(), 'yyyy-MM-dd');
      const yesterdayDate = format(addDays(new Date(), -1), 'yyyy-MM-dd');
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 10;

      // Fetch all transactions and log cash balances from database
      const [transactions, logCashBalances] = await Promise.all([
        prisma.transaction.findMany({
          where: {
            outletId: user.outletId,
            createdAt: {
              gte: new Date(`${date}T00:00:00Z`),
              lt: new Date(`${date}T23:59:59Z`),
            },
          },
          include: {
            subTransactions: true,
          },
        }),
        prisma.logCashBalance.findMany({
          where: {
            outletId: user.outletId,
            createdAt: {
              gte: new Date(`${date}T00:00:00Z`),
              lt: new Date(`${date}T23:59:59Z`),
            },
          },
          include: {
            user: {
              select: {
                id: true,
                name: true,
              },
            },
          },
        }),
      ]);

      // Transform transactions into DailyReportDetail format
      const transactionDetails: DailyReportDetail[] = transactions.map(transaction => ({
        orderId: transaction.id,
        orderName: `Transaction ${transaction.number}`,
        description: transaction.additionalNote || `${transaction.totalSubTransaction} items`,
        qty: transaction.totalSubTransaction,
        total: Number(transaction.total),
        paymentMethod: transaction.paymentMethod.toLowerCase() as 'cash' | 'qris' | string,
        status: transaction.status as 'pending' | 'cancelled' | 'completed' | string,
        createdAt: transaction.createdAt,
      }));

      // Transform log cash balances into DailyReportDetail format
      const logCashBalanceDetails: DailyReportDetail[] = logCashBalances.map(log => ({
        orderId: log.id,
        orderName: `Cash Balance ${log.type}`,
        description:
          log.status === 'cancelled'
            ? log.cancelNote
            : log.description || `${log.type} transaction`,
        qty: 1,
        total: Number(log.amount),
        paymentMethod: 'cash' as const,
        status: log.status === 'cancelled' ? 'cancelled' : 'completed',
        createdAt: log.createdAt,
      }));

      // Combine and sort by date (newest first)
      const allDetails: DailyReportDetail[] = [
        ...transactionDetails,
        ...logCashBalanceDetails,
      ].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

      // Apply pagination to details
      const startIndex = (page - 1) * limit;
      const endIndex = startIndex + limit;
      const details = allDetails.slice(startIndex, endIndex);
      const totalCount = allDetails.length;

      // Calculate summary from all transactions
      const completedTransactions = allDetails.filter(t => t.status === 'completed');
      const totalRevenue = completedTransactions.reduce((sum, t) => sum + t.total, 0);
      const totalTransactions = completedTransactions.length;
      const avgOrder = totalTransactions > 0 ? totalRevenue / totalTransactions : 0;

      // Fetch yesterday's transactions for growth calculation
      const yesterdayTransactions = await prisma.transaction.findMany({
        where: {
          outletId: user.outletId,
          createdAt: {
            gte: new Date(`${yesterdayDate}T00:00:00Z`),
            lt: new Date(`${yesterdayDate}T23:59:59Z`),
          },
          status: 'completed',
        },
      });

      const yesterdayRevenue = yesterdayTransactions.reduce((sum, t) => sum + Number(t.total), 0);
      const yesterdayTransactionCount = yesterdayTransactions.length;
      const yesterdayAvgOrder =
        yesterdayTransactionCount > 0 ? yesterdayRevenue / yesterdayTransactionCount : 0;

      const revenueGrowth =
        yesterdayRevenue > 0 ? ((totalRevenue - yesterdayRevenue) / yesterdayRevenue) * 100 : 0;
      const transactionGrowth =
        yesterdayTransactionCount > 0
          ? ((totalTransactions - yesterdayTransactionCount) / yesterdayTransactionCount) * 100
          : 0;
      const avgOrderGrowth =
        yesterdayAvgOrder > 0 ? ((avgOrder - yesterdayAvgOrder) / yesterdayAvgOrder) * 100 : 0;

      const response: DailyReportResponse = {
        summary: {
          date,
          yesterdayDate,
          totalRevenue,
          totalTransactions,
          avgOrder: Math.round(avgOrder),
          revenueGrowth: Math.round(revenueGrowth * 10) / 10,
          transactionGrowth: Math.round(transactionGrowth * 10) / 10,
          avgOrderGrowth: Math.round(avgOrderGrowth * 10) / 10,
        },
        details,
        pagination: {
          page,
          limit,
          total: totalCount,
          totalPages: Math.ceil(totalCount / limit),
        },
      };

      return ResponseHandler.success(res, {
        message: 'Daily report retrieved successfully',
        data: response,
      });
    } catch (error) {
      logger.error('Error getting daily report:', error);
      return ResponseHandler.error(res, {
        message: 'Internal server error',
        statusCode: 500,
      });
    }
  }
}
