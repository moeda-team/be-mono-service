import { Request, Response } from 'express';
import { logger } from '../../../utils/common/logger';
import { ResponseHandler } from '../../../utils/response/responseHandler';
import { addDays, format, subDays } from 'date-fns';
import { DailyReportDetail, DailyReportResponse } from '../models/report';
import prisma from '../../../config/database';
import * as XLSX from 'xlsx';
import * as fs from 'fs';
import * as path from 'path';
import {
  dailyReportTemplate,
  formatSummaryData,
  formatDetailsData,
} from '../../../templates/daily-templates';

export class ReportController {
  async dailyReport(req: Request, res: Response) {
    const user = (req as Request & { user: { outletId: string } }).user;

    try {
      const date = (req.query.date as string) || format(new Date(), 'yyyy-MM-dd');
      const yesterdayDate = format(addDays(new Date(date), -1), 'yyyy-MM-dd');
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
      const transactionsWithStatus = transactions.map(transaction => ({
        ...transaction,
        statusOrder: transaction.subTransactions.every(sub => sub.status === 'completed')
          ? 'completed'
          : 'pending',
      }));

      // Transform transactions into DailyReportDetail format
      const transactionDetails: DailyReportDetail[] = transactionsWithStatus.map(transaction => ({
        orderId: transaction.id,
        orderName: `Transaction ${transaction.number}`,
        description: transaction.additionalNote || `${transaction.totalSubTransaction} items`,
        qty: transaction.totalSubTransaction,
        total: Number(transaction.total),
        paymentMethod: transaction.paymentMethod.toLowerCase() as
          | 'cash'
          | 'debit'
          | 'qris'
          | string,
        status: transaction.status as 'pending' | 'cancelled' | 'completed' | string,
        statusOrder: transaction.statusOrder,
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
        statusOrder: '',
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

      // Calculate summary from transactions only (exclude log cash balances)
      const completedTransactions = transactionDetails.filter(t => t.status === 'completed');
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

  async dailyReportDownload(req: Request, res: Response) {
    const user = (req as Request & { user: { outletId: string } }).user;

    try {
      const date = (req.query.date as string) || format(new Date(), 'yyyy-MM-dd');
      const yesterdayDate = format(addDays(new Date(date), -1), 'yyyy-MM-dd');

      // Fetch all transactions and log cash balances from database (same as dailyReport)
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

      const transactionsWithStatus = transactions.map(transaction => ({
        ...transaction,
        statusOrder: transaction.subTransactions.every(sub => sub.status === 'completed')
          ? 'completed'
          : 'pending',
      }));

      // Transform transactions into DailyReportDetail format
      const transactionDetails: DailyReportDetail[] = transactionsWithStatus.map(transaction => ({
        orderId: transaction.id,
        orderName: `Transaction ${transaction.number}`,
        description: transaction.additionalNote || `${transaction.totalSubTransaction} items`,
        qty: transaction.totalSubTransaction,
        total: Number(transaction.total),
        paymentMethod: transaction.paymentMethod.toLowerCase() as
          | 'cash'
          | 'debit'
          | 'qris'
          | string,
        status: transaction.status as 'pending' | 'cancelled' | 'completed' | string,
        statusOrder: transaction.statusOrder,
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
        statusOrder: '',
        createdAt: log.createdAt,
      }));

      // Combine and sort by date (newest first)
      const allDetails: DailyReportDetail[] = [
        ...transactionDetails,
        ...logCashBalanceDetails,
      ].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

      // Calculate summary from transactions only (exclude log cash balances)
      const completedTransactions = transactionDetails.filter(t => t.status === 'completed');
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

      // Create workbook
      const workbook = XLSX.utils.book_new();

      // Create summary worksheet using template
      const summaryData = formatSummaryData(
        dailyReportTemplate,
        date,
        yesterdayDate,
        totalRevenue,
        totalTransactions,
        avgOrder,
        yesterdayRevenue,
        yesterdayTransactionCount,
        yesterdayAvgOrder,
        revenueGrowth,
        transactionGrowth,
        avgOrderGrowth,
      );

      const summaryWorksheet = XLSX.utils.aoa_to_sheet(summaryData);

      // Set column widths from template
      summaryWorksheet['!cols'] = dailyReportTemplate.summary.columnWidths.map(width => ({
        wch: width,
      }));

      XLSX.utils.book_append_sheet(workbook, summaryWorksheet, 'Summary');

      // Create details worksheet using template (without Order ID)
      const detailsData = formatDetailsData(dailyReportTemplate, allDetails);

      const detailsWorksheet = XLSX.utils.aoa_to_sheet(detailsData);

      // Set column widths from template
      detailsWorksheet['!cols'] = dailyReportTemplate.details.columnWidths.map(width => ({
        wch: width,
      }));

      XLSX.utils.book_append_sheet(workbook, detailsWorksheet, 'Details');

      const excelBuffer = XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' });
      const base64Data = excelBuffer.toString('base64');
      const filename = `daily-report-${date}.xlsx`;

      // Write file to output directory
      // const outputPath = path.join(process.cwd(), 'output', filename);
      // fs.writeFileSync(outputPath, excelBuffer);
      // logger.info(`Daily report saved to output directory: ${outputPath}`);

      return res.send(base64Data);
    } catch (error) {
      logger.error('Error generating daily report download:', error);
      return ResponseHandler.error(res, {
        message: 'Internal server error',
        statusCode: 500,
      });
    }
  }

  async salesAnalytics(req: Request, res: Response) {
    const user = (req as Request & { user: { outletId: string } }).user;

    try {
      // Indonesian day names mapping
      const dayNames = ['Min', 'Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab'];

      // Generate data for past 7 days including today
      const salesData = [];
      const today = new Date();

      for (let i = 6; i >= 0; i--) {
        const date = subDays(today, i);
        const dateStr = format(date, 'yyyy-MM-dd');
        const dayName = dayNames[date.getDay()];
        const day = format(date, 'dd');
        const formattedDate = `${day} ${dayName}`;

        // Fetch transactions for this date
        const transactions = await prisma.transaction.findMany({
          where: {
            outletId: user.outletId,
            status: 'completed',
            createdAt: {
              gte: new Date(`${dateStr}T00:00:00Z`),
              lt: new Date(`${dateStr}T23:59:59Z`),
            },
          },
        });

        // Calculate total sales for the day
        const salesAmount = transactions.reduce(
          (sum, transaction) => sum + Number(transaction.total),
          0,
        );

        // Count transactions by payment method
        const cashCount = transactions.filter(t => t.paymentMethod.toLowerCase() === 'cash').length;
        const debitCount = transactions.filter(
          t => t.paymentMethod.toLowerCase() === 'debit',
        ).length;
        const qrisCount = transactions.filter(t => t.paymentMethod.toLowerCase() === 'qris').length;

        salesData.push({
          date: formattedDate,
          transactions_amount: salesAmount,
          transactions_count: transactions.length,
          cash_count: cashCount,
          debitCount: debitCount,
          qris_count: qrisCount,
        });
      }

      return ResponseHandler.success(res, {
        message: 'Sales analytics retrieved successfully',
        data: salesData,
      });
    } catch (error) {
      logger.error('Error getting sales analytics:', error);
      return ResponseHandler.error(res, {
        message: 'Internal server error',
        statusCode: 500,
      });
    }
  }

  async topSellingMenu(req: Request, res: Response) {
    const user = (req as Request & { user: { outletId: string } }).user;

    try {
      // Get date from one week ago
      const oneWeekAgo = subDays(new Date(), 7);

      // Fetch completed transactions from the past week
      const transactions = await prisma.transaction.findMany({
        where: {
          outletId: user.outletId,
          status: 'completed',
          createdAt: {
            gte: oneWeekAgo,
          },
        },
        include: {
          subTransactions: true,
        },
      });

      // Aggregate menu quantities from all sub-transactions
      const menuQuantities = new Map<string, number>();

      transactions.forEach(transaction => {
        transaction.subTransactions.forEach(subTransaction => {
          const currentQuantity = menuQuantities.get(subTransaction.menuName) || 0;
          menuQuantities.set(subTransaction.menuName, currentQuantity + subTransaction.quantity);
        });
      });

      // Convert to array and sort by quantity sold (descending)
      const topSellingData = Array.from(menuQuantities.entries())
        .map(([menu_name, quantity_sold]) => ({
          menu_name,
          quantity_sold,
        }))
        .sort((a, b) => b.quantity_sold - a.quantity_sold)
        .slice(0, 10);

      return ResponseHandler.success(res, {
        message: 'Top selling menu retrieved successfully',
        data: topSellingData,
      });
    } catch (error) {
      logger.error('Error getting top selling menu:', error);
      return ResponseHandler.error(res, {
        message: 'Internal server error',
        statusCode: 500,
      });
    }
  }
}
