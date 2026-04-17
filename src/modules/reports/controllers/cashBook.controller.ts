import { Request, Response } from 'express';
import { logger } from '../../../utils/common/logger';
import { ResponseHandler } from '../../../utils/response/responseHandler';
import { CashBookSummary } from '../models/cashBook';
import prisma from '../../../config/database';
import * as XLSX from 'xlsx';
import {
  cashBookTemplate,
  formatCashBookSummaryData,
  formatCashBookDetailsData,
} from '../../../templates/cash-book-templates';
import path from 'path';
import fs from 'fs';

export class CashBookController {
  async getCashBookReport(req: Request, res: Response) {
    const user = (req as Request & { user: { outletId: string } }).user;

    try {
      const cashBookId = req.params.cashBookId;
      const page = parseInt(req.query.page as string);
      const limit = parseInt(req.query.limit as string);
      const usePagination = !isNaN(page) && !isNaN(limit) && page > 0 && limit > 0;

      const cashBook = await prisma.cashBook.findFirst({
        where: {
          id: cashBookId,
          outletId: user.outletId,
        },
        include: {
          user: {
            select: { id: true, name: true },
          },
        },
      });

      if (!cashBook) {
        return ResponseHandler.error(res, {
          message: 'Cash book not found',
          statusCode: 404,
        });
      }

      const whereClause = {
        cashBookId,
        outletId: user.outletId,
        status: 'completed',
      };

      const [transactions, totalCount, todayStats, yesterdayStats] = await Promise.all([
        prisma.transaction.findMany({
          where: whereClause,
          select: {
            id: true,
            number: true,
            transactionType: true,
            paymentMethod: true,
            customerName: true,
            total: true,
            status: true,
            createdAt: true,
          },
          orderBy: { createdAt: 'desc' },
          ...(usePagination && {
            skip: (page - 1) * limit,
            take: limit,
          }),
        }),

        prisma.transaction.count({ where: whereClause }),

        prisma.transaction.aggregate({
          where: {
            ...whereClause,
          },
          _sum: { total: true },
          _count: { id: true },
        }),

        prisma.transaction.aggregate({
          where: {
            ...whereClause,
          },
          _sum: { total: true },
          _count: { id: true },
        }),
      ]);

      const totalRevenue = Number(todayStats._sum.total || 0);
      const totalTransactions = todayStats._count.id || 0;

      const avgOrder = totalTransactions ? totalRevenue / totalTransactions : 0;

      const yesterdayRevenue = Number(yesterdayStats._sum.total || 0);
      const yesterdayTransactions = yesterdayStats._count.id || 0;

      const yesterdayAvgOrder = yesterdayTransactions
        ? yesterdayRevenue / yesterdayTransactions
        : 0;

      const revenueGrowth = yesterdayRevenue
        ? ((totalRevenue - yesterdayRevenue) / yesterdayRevenue) * 100
        : 0;

      const transactionGrowth = yesterdayTransactions
        ? ((totalTransactions - yesterdayTransactions) / yesterdayTransactions) * 100
        : 0;

      const avgOrderGrowth = yesterdayAvgOrder
        ? ((avgOrder - yesterdayAvgOrder) / yesterdayAvgOrder) * 100
        : 0;

      const summary = {
        id: cashBook.id,
        openAt: cashBook.openAt,
        closeAt: cashBook.closeAt,
        status: cashBook.closeAt ? 'closed' : 'open',
        user: cashBook.user,

        totalRevenue,
        totalTransactions,
        avgOrder: Math.round(avgOrder),

        revenueGrowth: Math.round(revenueGrowth * 10) / 10,
        transactionGrowth: Math.round(transactionGrowth * 10) / 10,
        avgOrderGrowth: Math.round(avgOrderGrowth * 10) / 10,
      };

      const formattedTransactions = transactions.map(transaction => ({
        id: transaction.id,
        number: transaction.number,
        transactionType: transaction.transactionType,
        paymentMethod: transaction.paymentMethod,
        customerName: transaction.customerName,
        total: Number(transaction.total),
        status: transaction.status,
        createdAt: transaction.createdAt,
      }));

      const response: any = {
        summary,
        transactions: formattedTransactions,
      };

      return ResponseHandler.success(res, {
        message: 'Cash book report retrieved successfully',
        data: response,
        pagination: usePagination
          ? {
              page,
              limit,
              total: totalCount,
              totalPages: Math.ceil(totalCount / limit),
            }
          : undefined,
      });
    } catch (error) {
      logger.error('Error fetching cash book report:', error);
      return ResponseHandler.error(res, {
        message: 'Internal server error',
        statusCode: 500,
      });
    }
  }

  async getClosingReport(req: Request, res: Response) {
    const user = (req as Request & { user: { outletId: string } }).user;

    try {
      const cashBookId = req.params.cashBookId;

      const cashBook = await prisma.cashBook.findFirst({
        where: {
          id: cashBookId,
          outletId: user.outletId,
        },
        include: {
          user: {
            select: { id: true, name: true },
          },
          outlet: {
            select: { id: true, name: true, address: true },
          },
        },
      });

      if (!cashBook) {
        return ResponseHandler.error(res, {
          message: 'Cash book not found',
          statusCode: 404,
        });
      }

      // Get initial capital from the first logCashBalance entry (opening balance)
      const openingBalance = await prisma.logCashBalance.findFirst({
        where: {
          outletId: user.outletId,
          type: 'open',
          createdAt: {
            gte: cashBook.openAt,
            lte: cashBook.closeAt || new Date(),
          },
        },
        orderBy: { createdAt: 'asc' },
      });

      const initialCapital = Number(openingBalance?.amount || 0);

      // Get all completed transactions for this cash book
      const completedTransactions = await prisma.transaction.findMany({
        where: {
          cashBookId,
          outletId: user.outletId,
          status: 'completed',
        },
        select: {
          id: true,
          paymentMethod: true,
          subTotal: true,
          discount: true,
          tax: true,
          serviceCharge: true,
          rounding: true,
          total: true,
        },
      });

      // Calculate payment breakdown
      const paymentBreakdown: Record<string, number> = {};
      let cashTotal = 0;
      let transferTotal = 0;
      let totalTax = 0;
      let totalServiceCharge = 0;
      let totalRounding = 0;

      for (const transaction of completedTransactions) {
        const method = transaction.paymentMethod.toLowerCase();
        // Calculate actual amount received: subTotal - discount + tax + serviceCharge + rounding
        const amount =
          Number(transaction.subTotal) -
          Number(transaction.discount) +
          Number(transaction.tax) +
          Number(transaction.serviceCharge) +
          Number(transaction.rounding);

        totalTax += Number(transaction.tax);
        totalServiceCharge += Number(transaction.serviceCharge);
        totalRounding += Number(transaction.rounding);

        if (method === 'cash') {
          cashTotal += amount;
        } else if (
          method.includes('transfer') ||
          method.includes('debit') ||
          method.includes('bank')
        ) {
          transferTotal += amount;
          // Track specific transfer methods
          const bankName = method
            .replace('transfer_', '')
            .replace('transfer', 'transfer')
            .toUpperCase();
          paymentBreakdown[bankName] = (paymentBreakdown[bankName] || 0) + amount;
        } else {
          paymentBreakdown[method] = (paymentBreakdown[method] || 0) + amount;
        }
      }

      const totalRevenue = cashTotal + transferTotal;

      // Count completed and pending transactions
      const completedCount = await prisma.transaction.count({
        where: {
          cashBookId,
          outletId: user.outletId,
          status: 'completed',
        },
      });

      const pendingCount = await prisma.transaction.count({
        where: {
          cashBookId,
          outletId: user.outletId,
          status: 'pending',
        },
      });

      // Calculate final balance (initial capital + total revenue)
      const finalBalance = initialCapital + totalRevenue;

      // Get menu sales data
      const menuSales = await prisma.subTransaction.groupBy({
        by: ['menuName'],
        where: {
          transaction: {
            cashBookId,
            outletId: user.outletId,
            status: 'completed',
          },
        },
        _sum: {
          quantity: true,
          subTotal: true,
        },
        orderBy: {
          _sum: {
            quantity: 'desc',
          },
        },
      });

      const formattedMenuSales = menuSales.map(item => ({
        menuName: item.menuName,
        quantity: item._sum.quantity || 0,
        totalAmount: Number(item._sum.subTotal || 0),
      }));

      // Build response matching receipt structure
      const response = {
        storeInfo: {
          name: cashBook.outlet?.name || 'Moeda Coffee',
          address: cashBook.outlet?.address || 'Jl. Raya Bekasi No 27, Kota Bekasi',
        },
        reportInfo: {
          title: 'LAPORAN TUTUP KASIR',
          cashierName: cashBook.user?.name || 'Unknown',
          openAt: cashBook.openAt,
          closeAt: cashBook.closeAt,
        },
        salesTransactionReport: {
          title: 'TRANSAKSI PENJUALAN',
          initialCapital,
          paymentMethods: {
            cash: cashTotal,
            transfer: transferTotal,
            transferDetails: paymentBreakdown,
          },
          totalRevenue,
          finalBalance,
          transactionCounts: {
            completed: completedCount,
            unpaid: pendingCount,
          },
          adjustments: {
            totalTax,
            totalServiceCharge,
            totalRounding,
          },
        },
        menuSalesReport: {
          title: 'PENJUALAN MENU',
          items: formattedMenuSales,
          totalItemsSold: formattedMenuSales.reduce((sum, item) => sum + item.quantity, 0),
          totalMenuRevenue: formattedMenuSales.reduce((sum, item) => sum + item.totalAmount, 0),
        },
      };

      return ResponseHandler.success(res, {
        message: 'Closing report retrieved successfully',
        data: response,
      });
    } catch (error) {
      logger.error('Error fetching closing report:', error);
      return ResponseHandler.error(res, {
        message: 'Internal server error',
        statusCode: 500,
      });
    }
  }

  async downloadCashBookReport(req: Request, res: Response) {
    const user = (req as Request & { user: { outletId: string } }).user;

    try {
      const cashBookId = req.params.cashBookId;

      const cashBook = await prisma.cashBook.findFirst({
        where: {
          id: cashBookId,
          outletId: user.outletId,
        },
        include: {
          user: {
            select: { id: true, name: true },
          },
        },
      });

      if (!cashBook) {
        return ResponseHandler.error(res, {
          message: 'Cash book not found',
          statusCode: 404,
        });
      }

      const whereClause = {
        cashBookId,
        outletId: user.outletId,
        status: 'completed',
      };

      const [transactions, totalCount, todayStats] = await Promise.all([
        prisma.transaction.findMany({
          where: whereClause,
          select: {
            id: true,
            number: true,
            transactionType: true,
            paymentMethod: true,
            customerName: true,
            total: true,
            status: true,
            createdAt: true,
          },
          orderBy: { createdAt: 'desc' },
          take: 100,
        }),

        prisma.transaction.count({ where: whereClause }),

        prisma.transaction.aggregate({
          where: whereClause,
          _sum: { total: true },
          _count: { id: true },
        }),
      ]);

      const totalRevenue = Number(todayStats._sum.total || 0);
      const totalTransactions = todayStats._count.id || 0;
      const avgOrder = totalTransactions ? totalRevenue / totalTransactions : 0;

      const summary = {
        id: cashBook.id,
        openAt: cashBook.openAt,
        closeAt: cashBook.closeAt,
        status: cashBook.closeAt ? 'closed' : 'open',
        user: cashBook.user,
        totalRevenue,
        totalTransactions,
        avgOrder: Math.round(avgOrder),
      };

      const formattedTransactions = transactions.map(transaction => ({
        id: transaction.id,
        number: transaction.number,
        transactionType: transaction.transactionType,
        paymentMethod: transaction.paymentMethod,
        customerName: transaction.customerName,
        total: Number(transaction.total),
        status: transaction.status,
        createdAt: transaction.createdAt,
      }));

      // Create workbook
      const workbook = XLSX.utils.book_new();

      // Create summary worksheet using cash book template
      const summaryData = formatCashBookSummaryData(
        cashBookTemplate,
        summary.id,
        summary.status,
        summary.totalRevenue,
        summary.totalTransactions,
        summary.avgOrder,
      );

      const summaryWorksheet = XLSX.utils.aoa_to_sheet(summaryData);

      // Set column widths from template
      summaryWorksheet['!cols'] = cashBookTemplate.summary.columnWidths.map(width => ({
        wch: width,
      }));

      XLSX.utils.book_append_sheet(workbook, summaryWorksheet, 'Summary');

      // Create details worksheet using cash book template
      const detailsData = formatCashBookDetailsData(cashBookTemplate, formattedTransactions);

      const detailsWorksheet = XLSX.utils.aoa_to_sheet(detailsData);

      // Set column widths from template
      detailsWorksheet['!cols'] = cashBookTemplate.details.columnWidths.map(width => ({
        wch: width,
      }));

      XLSX.utils.book_append_sheet(workbook, detailsWorksheet, 'Details');

      const excelBuffer = XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' });
      const filename = `cash-book-report-${cashBookId}.xlsx`;

      // Write file to output directory
      // const outputPath = path.join(process.cwd(), 'output', filename);
      // fs.writeFileSync(outputPath, excelBuffer);
      // logger.info(`Cash book report saved to output directory: ${outputPath}`);

      // Set response headers for blob download
      res.setHeader(
        'Content-Type',
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      );
      res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
      res.setHeader('Content-Length', excelBuffer.length);

      return res.send(excelBuffer);
    } catch (error) {
      logger.error('Error generating cash book report download:', error);
      return ResponseHandler.error(res, {
        message: 'Internal server error',
        statusCode: 500,
      });
    }
  }

  async getCashBooks(req: Request, res: Response) {
    const user = (req as Request & { user: { outletId: string } }).user;

    try {
      const page = parseInt(req.query.page as string);
      const limit = parseInt(req.query.limit as string);
      const status = req.query.status as string;
      const usePagination = !isNaN(page) && !isNaN(limit) && page > 0 && limit > 0;

      const whereClause: any = {
        outletId: user.outletId,
      };

      if (status === 'open') {
        whereClause.closeAt = null;
      } else if (status === 'closed') {
        whereClause.closeAt = { not: null };
      }

      const [cashBooks, totalCount] = await Promise.all([
        prisma.cashBook.findMany({
          where: whereClause,
          include: {
            user: {
              select: {
                id: true,
                name: true,
              },
            },
            _count: {
              select: {
                transactions: {
                  where: {
                    status: 'completed',
                  },
                },
              },
            },
          },
          orderBy: {
            openAt: 'desc',
          },
          ...(usePagination && {
            skip: (page - 1) * limit,
            take: limit,
          }),
        }),
        prisma.cashBook.count({
          where: whereClause,
        }),
      ]);

      const cashBooksWithStats: CashBookSummary[] = await Promise.all(
        cashBooks.map(async (cashBook: any) => {
          const [todayStats] = await Promise.all([
            prisma.transaction.aggregate({
              where: {
                cashBookId: cashBook.id,
                outletId: user.outletId,
                status: 'completed',
              },
              _sum: { total: true },
              _count: { id: true },
            }),
          ]);

          const totalRevenue = Number(todayStats._sum.total || 0);
          const totalTransactions = todayStats._count.id || 0;

          return {
            id: cashBook.id,
            openAt: cashBook.openAt,
            closeAt: cashBook.closeAt,
            totalTransactions: totalTransactions,
            totalRevenue: Number(totalRevenue),
            status: cashBook.closeAt ? 'closed' : ('open' as 'open' | 'closed'),
            user: cashBook.user,
          };
        }),
      );

      const response = cashBooksWithStats;

      return ResponseHandler.success(res, {
        message: 'Cash books retrieved successfully',
        data: response,
        pagination: usePagination
          ? {
              page,
              limit,
              total: totalCount,
              totalPages: Math.ceil(totalCount / limit),
            }
          : undefined,
      });
    } catch (error) {
      logger.error('Error fetching cash books:', error);
      return ResponseHandler.error(res, {
        message: 'Internal server error',
        statusCode: 500,
        error: {
          code: 'INTERNAL_SERVER_ERROR',
        },
      });
    }
  }

  async createCashBook(req: Request, res: Response) {
    const user = (req as Request & { user: { userId: string; outletId: string } }).user;

    try {
      // Check if there's already an open cash book for this outlet
      const existingOpenCashBook = await prisma.cashBook.findFirst({
        where: {
          outletId: user.outletId,
          closeAt: null,
        },
      });

      if (existingOpenCashBook) {
        return ResponseHandler.error(res, {
          message: 'There is already an open cash book for this outlet',
          statusCode: 400,
        });
      }

      const cashBook = await prisma.cashBook.create({
        data: {
          outletId: user.outletId,
          userId: user.userId,
          openAt: new Date(),
        },
        include: {
          user: {
            select: {
              id: true,
              name: true,
            },
          },
        },
      });

      return ResponseHandler.success(res, {
        message: 'Cash book created successfully',
        data: cashBook,
      });
    } catch (error) {
      logger.error('Error creating cash book:', error);
      return ResponseHandler.error(res, {
        message: 'Internal server error',
        statusCode: 500,
      });
    }
  }

  async checkOpenCashBook(req: Request, res: Response) {
    const user = (req as Request & { user: { outletId: string } }).user;

    try {
      const outletId = user?.outletId || (req?.headers['outletid'] as string);
      if (!outletId) {
        return ResponseHandler.error(res, {
          message: 'Outlet ID not found',
          statusCode: 400,
        });
      }

      const cashBook = await prisma.cashBook.findFirst({
        where: {
          outletId: outletId,
          closeAt: null,
        },
      });

      if (!cashBook) {
        return ResponseHandler.success(res, {
          message: 'No open cash book found',
          data: false,
        });
      }

      return ResponseHandler.success(res, {
        message: 'Open cash book found',
        data: true,
      });
    } catch (error) {
      logger.error('Error checking open cash book:', error);
      return ResponseHandler.error(res, {
        message: 'Internal server error',
        statusCode: 500,
      });
    }
  }

  async closeCashBook(req: Request, res: Response) {
    const user = (req as Request & { user: { outletId: string } }).user;

    try {
      const cashBook = await prisma.cashBook.findFirst({
        where: {
          outletId: user.outletId,
          closeAt: null,
        },
      });

      if (!cashBook) {
        return ResponseHandler.error(res, {
          message: 'Open cash book not found',
          statusCode: 404,
        });
      }

      const updatedCashBook = await prisma.cashBook.update({
        where: {
          id: cashBook.id,
        },
        data: {
          closeAt: new Date(),
        },
        include: {
          user: {
            select: {
              id: true,
              name: true,
            },
          },
        },
      });

      await prisma.transaction.updateMany({
        where: {
          cashBookId: null,
          outletId: user.outletId,
        },
        data: {
          cashBookId: cashBook.id,
        },
      });

      return ResponseHandler.success(res, {
        message: 'Cash book closed successfully',
        data: updatedCashBook,
      });
    } catch (error) {
      logger.error('Error closing cash book:', error);
      return ResponseHandler.error(res, {
        message: 'Internal server error',
        statusCode: 500,
      });
    }
  }
}
