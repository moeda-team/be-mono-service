import { Request, Response } from 'express';
import { logger } from '../../../utils/logger';
import { CreateTransactionDTO } from '../models/transaction';
import { ResponseHandler } from '../../../utils/response/responseHandler';
import prisma from '../../../lib/prisma';
import { generateOrderNumber, generatePaymentNumber } from '../../../utils/generate';
import { JwtPayload } from 'jsonwebtoken';
import { axiosGet } from '../../../utils/axios.custom';

export class TransactionController {
  async getAllTransactions(req: Request, res: Response) {
    const { user } = req as Request & { user?: { outletId: string } };
    const outletId = user?.outletId;

    try {
      const transactions = await prisma.transaction.findMany({
        where: {
          outletId,
        },
        orderBy: {
          createdAt: 'desc',
        },
      });
      return ResponseHandler.success(res, {
        message: 'Transactions retrieved successfully',
        data: transactions,
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
          subTransactions: await prisma.subTransaction.findMany({
            where: {
              transactionId: transaction.id,
            },
          }),
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
        const findUser = await axiosGet(
          req,
          res,
          `${process.env.USER_SERVICE_URL}/users/${user.userId}`,
        );
        if (findUser.status !== 'success') {
          return ResponseHandler.error(res, {
            message: 'User not found',
            statusCode: findUser.status,
          });
        }
      }

      const outlet = await axiosGet(
        req,
        res,
        `${process.env.OUTLET_SERVICE_URL}/outlets/${transactionData.outletId}`,
      );
      if (outlet.status !== 'success') {
        return ResponseHandler.error(res, {
          message: 'Outlet not found',
          statusCode: outlet.status,
        });
      }

      const orderNumber = await generateOrderNumber(transactionData.outletId);
      const paymentNumber = await generatePaymentNumber(transactionData.outletId);
      const subTotal = transactionData.cart.reduce((total, item) => total + item.subTotal, 0);
      const tax = subTotal * 0.11;
      const serviceCharge = Math.ceil((subTotal + tax) * 0.07 + 500);
      const total = subTotal + tax + serviceCharge - transactionData.discount;

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
          discount: transactionData.discount,
          total: total,
          additionalNote: transactionData.additionalNote,
          status: transactionData.status,
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
        data: transaction,
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
}
