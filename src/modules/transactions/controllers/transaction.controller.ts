import { Request, Response } from 'express';
import { logger } from '../../../utils/common/logger';
import { CreateTransactionDTO } from '../models/transaction';
import { ResponseHandler } from '../../../utils/response/responseHandler';
import prisma from '../../../lib/prisma';
import {
  generateOrderNumber,
  generatePaymentNumber,
} from '../../../utils/generator/generate.number';
import { JwtPayload } from 'jsonwebtoken';
import { Prisma } from '@prisma/client';

export class TransactionController {
  async getAllTransactions(req: Request, res: Response) {
    const { user } = req as Request & { user?: { outletId: string } };
    const outletId = user?.outletId;

    const page = parseInt(req.query.page as string) || null;
    const limit = parseInt(req.query.limit as string) || null;
    const search = (req.query.search as string)?.trim() || null;
    const active = req.query.active === 'true';

    const skip = page && limit ? (page - 1) * limit : undefined;
    const take = limit || undefined;

    try {
      const whereClause: Prisma.TransactionWhereInput = {
        outletId,
      };

      const orFilters: Prisma.TransactionWhereInput[] = [];

      if (search) {
        orFilters.push({ customerName: { contains: search, mode: 'insensitive' } });
        const tableNumber = Number(search);
        if (!isNaN(tableNumber)) {
          orFilters.push({ tableNumber: { equals: tableNumber } });
        }

        whereClause.OR = orFilters;
      }

      if (active) {
        whereClause.subTransactions = {
          some: {
            status: {
              not: 'completed',
            },
          },
        };
      }

      const transactions = await prisma.transaction.findMany({
        where: whereClause,
        orderBy: { createdAt: 'desc' },
        include: {
          subTransactions: {
            orderBy: {
              status: 'desc',
            },
          },
        },

        skip,
        take,
      });

      const responseData: Record<string, unknown> = {
        transactions,
      };

      if (page && limit) {
        const total = await prisma.transaction.count({ where: whereClause });
        responseData.pagination = {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit),
        };
      }

      return ResponseHandler.success(res, {
        message: 'Transactions retrieved successfully',
        data: responseData,
      });
    } catch (error) {
      logger.error('Error getting transactions:', error);
      return ResponseHandler.error(res, {
        message: 'Internal server error',
        statusCode: 500,
      });
    }
  }

  async getTransactionById(req: Request, res: Response) {
    const { id } = req.params;

    try {
      const transaction = await prisma.transaction.findUnique({
        where: { id },
        include: {
          subTransactions: {
            include: {
              menu: true,
            },
          },
        },
      });
      if (!transaction) {
        return ResponseHandler.error(res, {
          message: 'Transaction not found',
          statusCode: 404,
        });
      }

      return ResponseHandler.success(res, {
        message: 'Transaction retrieved successfully',
        data: {
          ...transaction,
        },
      });
    } catch (error) {
      logger.error('Error getting transaction:', error);
      return ResponseHandler.error(res, {
        message: 'Internal server error',
        statusCode: 500,
      });
    }
  }

  async createTransaction(req: Request, res: Response) {
    const transactionData: CreateTransactionDTO = req.body;
    logger.info('Transaction data:', transactionData);

    try {
      const reqWithUser = req as Request & { user?: JwtPayload };
      const user = reqWithUser.user;

      if (user) {
        const findUser = await prisma.user.findUnique({
          where: {
            id: user.userId,
          },
        });
        if (!findUser) {
          return ResponseHandler.error(res, {
            message: 'User not found',
            statusCode: 404,
          });
        }
      }

      const outlet = await prisma.outlet.findUnique({
        where: {
          id: transactionData.outletId,
        },
      });
      if (!outlet) {
        return ResponseHandler.error(res, {
          message: 'Outlet not found',
          statusCode: 404,
        });
      }

      const orderNumber = await generateOrderNumber(transactionData.outletId);
      const paymentNumber = await generatePaymentNumber(transactionData.outletId);
      const subTotal = transactionData.cart.reduce((total, item) => total + item.subTotal, 0);
      const tax = subTotal * 0.11;

      let serviceCharge = 0;
      if (transactionData.paymentMethod === 'qris') {
        serviceCharge = Math.ceil((subTotal + tax) * 0.007 + 500);
      } else if (transactionData.paymentMethod === 'gopay') {
        serviceCharge = Math.ceil((subTotal + tax) * 0.02 + 500);
      } else {
        serviceCharge = 500;
      }

      const totalBeforeRounding = subTotal + tax + serviceCharge - transactionData.discount;
      let rounding = 0;
      const remainder = totalBeforeRounding % 1000;
      if (remainder === 0) {
        rounding = 0;
      } else if (remainder <= 500) {
        rounding = 500 - remainder;
      } else {
        rounding = 1000 - remainder;
      }

      const total = subTotal + tax + serviceCharge - transactionData.discount + rounding;

      let transactionStatus = 'pending';
      if (transactionData.paymentMethod !== 'cash') {
        transactionStatus = transactionData.status;
      } else if (transactionData.paymentMethod === 'cash') {
        transactionStatus = 'completed';
      }

      const transaction = await prisma.transaction.create({
        data: {
          userId: user?.userId,
          outletId: transactionData.outletId,
          number: orderNumber,
          transactionType: transactionData.transactionType,
          tableNumber: transactionData.tableNumber,
          paymentNumber: paymentNumber,
          paymentMethod: transactionData.paymentMethod,
          customerName: transactionData.customerName,
          totalSubTransaction: transactionData.cart.length,
          subTotal: subTotal,
          serviceCharge: serviceCharge,
          tax: tax,
          rounding: rounding,
          discount: transactionData.discount,
          total: total,
          additionalNote: transactionData.additionalNote,
          status: transactionStatus,
        },
      });

      for (const item of transactionData.cart) {
        await prisma.subTransaction.create({
          data: {
            transactionId: transaction.id,
            menuId: item.menuId,
            menuName: item.menuName,
            quantity: item.quantity,
            price: item.price,
            subTotal: item.subTotal,
            addOn: item.addOn,
            note: item.note,
            status: 'preparation',
          },
        });
      }
      return ResponseHandler.success(res, {
        message: 'Transaction created successfully',
        data: {
          ...transaction,
          details: await prisma.subTransaction.findMany({
            where: { transactionId: transaction.id },
          }),
        },
      });
    } catch (error) {
      logger.error('Error creating transaction:', error);
      return ResponseHandler.error(res, {
        message: 'Internal server error',
        statusCode: 500,
      });
    }
  }

  async deleteTransaction(req: Request, res: Response) {
    const { id } = req.params;

    try {
      const transaction = await prisma.transaction.findUnique({
        where: { id },
      });
      if (!transaction) {
        return ResponseHandler.error(res, {
          message: 'Transaction not found',
          statusCode: 404,
        });
      }

      await prisma.transaction.update({
        where: { id },
        data: {
          status: 'cancelled',
        },
      });

      return ResponseHandler.success(res, {
        message: 'Transaction deleted successfully',
        data: null,
      });
    } catch (error) {
      if (error instanceof Error && 'code' in error && error.code === 'P2025') {
        return ResponseHandler.error(res, {
          message: 'Transaction not found',
          statusCode: 404,
        });
      }
      logger.error('Error deleting transaction:', error);
      return ResponseHandler.error(res, {
        message: 'Internal server error',
        statusCode: 500,
      });
    }
  }

  async updateTransactionStatus(req: Request, res: Response) {
    const { id } = req.params;
    const { status } = req.body;

    try {
      const transaction = await prisma.subTransaction.findUnique({
        where: { id },
      });
      if (!transaction) {
        return ResponseHandler.error(res, {
          message: 'Transaction not found',
          statusCode: 404,
        });
      }

      await prisma.subTransaction.update({
        where: { id },
        data: {
          status,
        },
      });

      return ResponseHandler.success(res, {
        message: 'Transaction status updated successfully',
        data: null,
      });
    } catch (error) {
      if (error instanceof Error && 'code' in error && error.code === 'P2025') {
        return ResponseHandler.error(res, {
          message: 'Transaction not found',
          statusCode: 404,
        });
      }
      logger.error('Error updating transaction status:', error);
      return ResponseHandler.error(res, {
        message: 'Internal server error',
        statusCode: 500,
      });
    }
  }
}
