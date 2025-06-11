import { Request, Response } from 'express';
import { logger } from '../../../utils/common/logger';
import { ResponseHandler } from '../../../utils/response/responseHandler';
import prisma from '../../../lib/prisma';

export class OrderController {
  async getOrderByTransactionId(req: Request, res: Response) {
    const user = req as Request & { user?: { outletId: string } };
    const outletId = user.user?.outletId;

    try {
      const transactions = await prisma.transaction.findMany({
        where: {
          outletId,
          subTransactions: {
            some: {
              status: {
                not: 'completed',
              },
            },
          },
        },
        orderBy: {
          number: 'desc',
        },
        include: {
          subTransactions: true,
        },
      });

      if (!transactions || transactions.length === 0) {
        return ResponseHandler.error(res, {
          message: 'Transaction not found',
          statusCode: 404,
        });
      }

      const statusOrder = ['preparation', 'completed'];

      const result = [];

      for (const tx of transactions) {
        const orders = tx.subTransactions;

        orders.sort((a: { status: string }, b: { status: string }) => {
          return statusOrder.indexOf(a.status) - statusOrder.indexOf(b.status);
        });

        result.push({
          id: tx.id,
          number: tx.number,
          tableNumber: tx.tableNumber,
          customerName: tx.customerName,
          note: tx.additionalNote,
          orders,
        });
      }

      return ResponseHandler.success(res, {
        message: 'Orders grouped by transaction',
        data: result,
      });
    } catch (error) {
      if (error instanceof Error && 'code' in error && error.code === 'P2025') {
        return ResponseHandler.error(res, {
          message: 'Order not found',
          statusCode: 404,
        });
      }
      logger.error('Error getting order:', error);
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

  async getTransaction(req: Request, res: Response) {
    const { id } = req.params;

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

      return ResponseHandler.success(res, {
        message: 'Retrieved transaction successfully',
        data: transaction,
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
