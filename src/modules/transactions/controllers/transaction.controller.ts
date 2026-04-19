import { Request, Response } from 'express';
import { logger } from '../../../utils/common/logger';
import { CreateTransactionDTO } from '../models/transaction';
import { ResponseHandler } from '../../../utils/response/responseHandler';
import prisma from '../../../config/database';
import {
  generateOrderNumber,
  generatePaymentNumber,
} from '../../../utils/generator/generate.number';
import { JwtPayload } from 'jsonwebtoken';
import { Prisma } from '@prisma/client';
import { getWebSocketService } from '../../../services/websocket.service';
import { IngredientService } from '../../../services/ingredient.service';

export class TransactionController {
  async getAllTransactions(req: Request, res: Response) {
    const { user } = req as Request & { user?: { outletId: string } };
    const outletId = user?.outletId;

    const page = parseInt(req.query.page as string) || null;
    const limit = parseInt(req.query.limit as string) || null;
    const search = (req.query.search as string)?.trim() || null;
    const table = (req.query.table as string)?.trim() || null;
    const month = parseInt(req.query.month as string) || null;
    const year = parseInt(req.query.year as string) || null;
    const status = (req.query.status as string)?.trim() || null;
    const paymentStatus = (req.query.paymentStatus as string)?.trim() || null;

    const skip = page && limit ? (page - 1) * limit : undefined;
    const take = limit || undefined;

    try {
      const whereClause: Prisma.TransactionWhereInput = {
        outletId,
      };

      const orFilters: Prisma.TransactionWhereInput[] = [];

      if (search) {
        orFilters.push({ customerName: { contains: search, mode: 'insensitive' } });
        whereClause.OR = orFilters;
      }

      if (status === 'active') {
        whereClause.subTransactions = {
          some: {
            status: {
              not: 'completed',
            },
          },
        };
      } else if (status === 'completed') {
        whereClause.subTransactions = {
          every: {
            status: 'completed',
          },
        };
      }

      if (paymentStatus) {
        whereClause.status = paymentStatus;
      }

      if (table) {
        whereClause.tableId = { equals: table };
      }

      if (month && year) {
        whereClause.createdAt = {
          gte: new Date(year, month - 1, 1),
          lt: new Date(year, month, 1),
        };
      }

      const transactions = await prisma.transaction.findMany({
        where: whereClause,
        orderBy: { createdAt: 'desc' },
        include: {
          logTableMove: {
            orderBy: {
              createdAt: 'asc',
            },
          },
          table: true,
          subTransactions: {
            include: {
              menu: true,
            },
            orderBy: {
              status: 'desc',
            },
          },
          voucher: true,
        },
        skip,
        take,
      });

      const transactionsWithStatus = transactions.map(transaction => {
        const firstSub = transaction.subTransactions[0];
        return {
          ...transaction,
          status: firstSub?.status || 'unknown',
        };
      });

      const responseData: Record<string, unknown> = {
        transactions: transactionsWithStatus,
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

  async getAllActiveTransactions(req: Request, res: Response) {
    const { user } = req as Request & { user?: { outletId: string } };
    const outletId = user?.outletId;

    try {
      const search = (req.query.search as string)?.trim() || null;

      const whereClause: Prisma.TransactionWhereInput = {
        outletId,
        status: 'completed',
        subTransactions: {
          some: {
            status: 'preparation',
          },
        },
      };

      if (search) {
        whereClause.OR = [
          { customerName: { contains: search, mode: 'insensitive' } },
          // Note: Table search by number is no longer available since we use tableId (UUID)
        ];
      }

      const transactions = await prisma.transaction.findMany({
        where: whereClause,
        orderBy: { createdAt: 'asc' },
        include: {
          logTableMove: {
            orderBy: {
              createdAt: 'asc',
            },
          },
          subTransactions: {
            include: {
              menu: true,
            },
            orderBy: {
              status: 'asc',
            },
          },
        },
      });

      const responseData: Record<string, unknown> = {
        transactions,
      };

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
    const { user } = req as Request & { user?: { outletId?: string } };
    const outletId = user?.outletId;

    try {
      const transaction = await (outletId
        ? prisma.transaction.findFirst({
            where: { id, outletId },
            include: {
              logTableMove: {
                orderBy: {
                  createdAt: 'asc',
                },
              },
              table: true,
              subTransactions: {
                include: {
                  menu: true,
                },
                orderBy: {
                  status: 'desc',
                },
              },
              voucher: true,
            },
          })
        : prisma.transaction.findUnique({
            where: { id },
            include: {
              logTableMove: {
                orderBy: {
                  createdAt: 'asc',
                },
              },
              table: true,
              subTransactions: {
                include: {
                  menu: true,
                },
                orderBy: {
                  status: 'desc',
                },
              },
              voucher: true,
            },
          }));
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

  async checkTransactionStatus(req: Request, res: Response) {
    const { orderIds } = req.body;

    try {
      const transactions = await prisma.transaction.findMany({
        where: {
          id: {
            in: orderIds,
          },
          subTransactions: {
            some: {
              status: {
                not: 'completed',
              },
            },
          },
        },
        include: {
          subTransactions: {
            include: {
              menu: true,
            },
          },
          logTableMove: {
            include: {
              nextTable: true,
              prevTable: true,
            },
          },
          table: true,
        },
      });

      return ResponseHandler.success(res, {
        message: 'Transaction status checked successfully',
        data: transactions,
      });
    } catch (error) {
      logger.error('Error checking transaction status:', error);
      return ResponseHandler.error(res, {
        message: 'Internal server error',
        statusCode: 500,
      });
    }
  }

  async calculateTransaction(req: Request, res: Response) {
    const { total, discount = 0, paymentMethod, discountMenu = 0 } = req.body;

    try {
      if (typeof total !== 'number' || total < 0) {
        return ResponseHandler.error(res, {
          message: 'Total must be a positive number',
          statusCode: 400,
        });
      }

      if (typeof discount !== 'number' || discount < 0) {
        return ResponseHandler.error(res, {
          message: 'Discount must be a positive number',
          statusCode: 400,
        });
      }

      if (typeof discountMenu !== 'number' || discountMenu < 0) {
        return ResponseHandler.error(res, {
          message: 'Discount menu must be a positive number',
          statusCode: 400,
        });
      }

      if (!paymentMethod) {
        return ResponseHandler.error(res, {
          message: 'Payment method is required',
          statusCode: 400,
        });
      }

      const subTotal = total;

      // 🔥 Samakan dengan createTransaction
      const totalDiscountAmount = Math.min(subTotal, discount + discountMenu);
      const taxableAmount = subTotal - totalDiscountAmount;

      const taxRate = 0.11;
      const tax = paymentMethod === 'qris' ? Math.floor(taxableAmount * taxRate) : 0;

      const serviceCharge = 0;
      const rounding = 0;

      const finalTotal = taxableAmount + tax + serviceCharge + rounding;

      return ResponseHandler.success(res, {
        message: 'Transaction calculated successfully',
        data: {
          subTotal,
          discount: discountMenu,
          discountVoucher: discount,
          tax,
          serviceCharge,
          rounding,
          total: finalTotal,
        },
      });
    } catch (error) {
      logger.error('Error calculating transaction:', error);
      return ResponseHandler.error(res, {
        message: 'Internal server error',
        statusCode: 500,
      });
    }
  }

  async createTransaction(req: Request, res: Response) {
    const transactionData: CreateTransactionDTO = req.body;

    try {
      const reqWithUser = req as Request & { user?: JwtPayload };
      const user = reqWithUser.user;

      if (user && 'outletId' in user && user.outletId) {
        transactionData.outletId = String(user.outletId);
      }

      if (!transactionData.cart?.length) {
        return ResponseHandler.error(res, {
          message: 'Cart cannot be empty',
          statusCode: 400,
        });
      }

      const allowedPaymentMethods = ['cash', 'debit', 'qris'] as const;
      if (!allowedPaymentMethods.includes(transactionData.paymentMethod as any)) {
        return ResponseHandler.error(res, {
          message: 'Invalid payment method',
          statusCode: 400,
        });
      }

      const outlet = await prisma.outlet.findUnique({
        where: { id: transactionData.outletId },
      });

      if (!outlet) {
        return ResponseHandler.error(res, {
          message: 'Outlet not found',
          statusCode: 404,
        });
      }

      if (user) {
        const findUser = await prisma.user.findUnique({
          where: { id: user.userId },
        });
        if (!findUser) {
          return ResponseHandler.error(res, {
            message: 'User not found',
            statusCode: 404,
          });
        }
      }

      const menuIds = [...new Set(transactionData.cart.map(i => i.menuId))];

      const menus = await prisma.menu.findMany({
        where: {
          id: { in: menuIds },
          outletId: transactionData.outletId,
        },
      });

      if (menus.length !== menuIds.length) {
        return ResponseHandler.error(res, {
          message: 'Invalid menu detected in cart',
          statusCode: 400,
        });
      }

      const menuMap = new Map(menus.map(m => [m.id, m]));

      let subTotal = 0;
      const cartWithPrices = transactionData.cart.map(item => {
        const menu = menuMap.get(item.menuId);
        if (!menu) throw new Error('Menu not found');

        if (item.quantity <= 0) {
          throw new Error('Invalid quantity');
        }

        const basePrice = Number(menu.price);
        const addOnPrice = Number(item.addOnPrice || 0);

        const itemTotal = (basePrice + addOnPrice) * item.quantity;
        subTotal += itemTotal;

        return {
          menuId: menu.id,
          menuName: menu.name,
          quantity: item.quantity,
          price: basePrice,
          addOnPrice,
          subTotal: itemTotal,
          addOn: item.addOn,
          note: item.note,
        };
      });

      let voucherData: any = null;
      let voucherDiscountAmount = 0;

      if (transactionData.voucher) {
        voucherData = await prisma.voucher.findFirst({
          where: {
            outletId: transactionData.outletId,
            name: transactionData.voucher,
          },
        });

        if (!voucherData) {
          return ResponseHandler.error(res, {
            message: 'Invalid voucher code',
            statusCode: 404,
          });
        }

        if (voucherData.expiredAt < new Date()) {
          return ResponseHandler.error(res, {
            message: 'Voucher expired',
            statusCode: 400,
          });
        }

        if (Number(voucherData.usage.toFixed(2)) >= Number(voucherData.maxUsage.toFixed(2))) {
          return ResponseHandler.error(res, {
            message: 'Voucher usage limit reached',
            statusCode: 400,
          });
        }

        voucherDiscountAmount =
          voucherData.type === 'percent'
            ? Math.floor((subTotal * Number(voucherData.discount)) / 100)
            : Number(voucherData.discount);

        voucherDiscountAmount = Math.min(voucherDiscountAmount, subTotal);
      }

      const clientDiscountAmount = Math.max(0, Number(transactionData.discount || 0));

      const totalDiscountAmount = Math.min(subTotal, voucherDiscountAmount + clientDiscountAmount);

      const taxableAmount = subTotal - totalDiscountAmount;

      const taxRate = 0.11;
      const tax =
        transactionData.paymentMethod === 'qris' ? Math.floor(taxableAmount * taxRate) : 0;

      const serviceCharge = 0;
      const rounding = 0;

      const total = taxableAmount + tax + serviceCharge + rounding;

      if (total < 0) {
        throw new Error('Invalid total calculation');
      }

      const isAutoComplete = total === 0;

      let transactionStatus: 'pending' | 'completed' = 'pending';

      if (isAutoComplete) {
        transactionStatus = 'completed';
      } else if (
        transactionData.paymentMethod === 'cash' ||
        transactionData.paymentMethod === 'debit'
      ) {
        transactionStatus = 'completed';
      }

      const orderNumber = await generateOrderNumber(transactionData.outletId);
      const paymentNumber = await generatePaymentNumber(transactionData.outletId);

      const result = await prisma.$transaction(async tx => {
        const transaction = await tx.transaction.create({
          data: {
            userId: user?.userId,
            outletId: transactionData.outletId,
            number: orderNumber,
            transactionType: transactionData.transactionType,
            tableId: transactionData.tableId,
            paymentNumber,
            paymentMethod: transactionData.paymentMethod,
            customerName: transactionData.customerName,
            totalSubTransaction: cartWithPrices.length,
            subTotal,
            serviceCharge,
            rounding,
            discount: totalDiscountAmount,
            tax,
            total,
            additionalNote: transactionData.additionalNote,
            voucherId: voucherData?.id,
            status: transactionStatus,
          },
        });

        await tx.subTransaction.createMany({
          data: cartWithPrices.map(item => ({
            transactionId: transaction.id,
            menuId: item.menuId,
            menuName: item.menuName,
            quantity: item.quantity,
            price: item.price,
            subTotal: item.subTotal,
            addOn: item.addOn,
            addOnPrice: item.addOnPrice,
            note: item.note,
            status: 'preparation',
          })),
        });

        if (voucherData) {
          const updated = await tx.voucher.updateMany({
            where: {
              id: voucherData.id,
              usage: { lt: voucherData.maxUsage },
            },
            data: {
              usage: { increment: 1 },
            },
          });

          if (updated.count === 0) {
            throw new Error('Voucher usage exceeded');
          }

          await tx.logVoucher.create({
            data: {
              outletId: transactionData.outletId,
              transactionId: transaction.id,
              voucherId: voucherData.id,
            },
          });
        }

        return transaction;
      });

      // Reduce ingredients and log activity for auto-complete transactions
      if (
        isAutoComplete ||
        transactionData.paymentMethod === 'cash' ||
        transactionData.paymentMethod === 'debit'
      ) {
        await IngredientService.reduceIngredientsAndLogActivity(result);
      }

      return ResponseHandler.success(res, {
        message: 'Transaction created successfully',
        data: result,
      });
    } catch (error) {
      logger.error('Error creating transaction:', error);

      return ResponseHandler.error(res, {
        message: error instanceof Error ? error.message : 'Internal server error',
        statusCode: 500,
      });
    }
  }

  async deleteTransaction(req: Request, res: Response) {
    const { id } = req.params;
    const { user } = req as Request & { user?: { outletId?: string } };
    const outletId = user?.outletId;

    try {
      const transaction = await (outletId
        ? prisma.transaction.findFirst({
            where: { id, outletId },
          })
        : prisma.transaction.findUnique({
            where: { id },
          }));
      if (!transaction) {
        return ResponseHandler.error(res, {
          message: 'Transaction not found',
          statusCode: 404,
        });
      }

      await prisma.transaction.update({
        where: { id: transaction.id },
        data: {
          status: 'cancelled',
        },
      });

      // Emit WebSocket event for transaction deletion
      try {
        if (transaction.outletId) {
          const wsService = getWebSocketService();
          wsService.emitTransactionDeleted(transaction.outletId, transaction.id);
        }
      } catch (wsError) {
        logger.error('Error emitting WebSocket deletion event:', wsError);
        // Don't fail the transaction if WebSocket fails
      }

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
    const { user } = req as Request & { user?: { outletId?: string } };
    const outletId = user?.outletId;

    try {
      const transaction = await (outletId
        ? prisma.subTransaction.findFirst({
            where: {
              id,
              transaction: {
                outletId,
              },
            },
          })
        : prisma.subTransaction.findUnique({
            where: { id },
          }));

      if (!transaction) {
        return ResponseHandler.error(res, {
          message: 'SubTransaction not found',
          statusCode: 404,
        });
      }

      await prisma.subTransaction.update({
        where: { id },
        data: { status },
      });

      // Get transaction details for WebSocket emission
      const updatedSubTransaction = await prisma.subTransaction.findUnique({
        where: { id },
        include: {
          transaction: {
            select: {
              id: true,
              outletId: true,
            },
          },
        },
      });

      const subTransactions = await prisma.subTransaction.findMany({
        where: { transactionId: transaction.transactionId },
        select: { status: true },
      });

      const allComplete = subTransactions.every(sub => sub.status === 'complete');

      if (allComplete) {
        await prisma.transaction.update({
          where: { id: transaction.transactionId },
          data: { status: 'complete' },
        });
      }

      // Emit WebSocket event for status update
      try {
        if (updatedSubTransaction && updatedSubTransaction.transaction.outletId) {
          const wsService = getWebSocketService();
          wsService.emitTransactionStatusUpdated(
            updatedSubTransaction.transaction.outletId,
            transaction.transactionId,
            status,
            id,
          );
        }
      } catch (wsError) {
        logger.error('Error emitting WebSocket status update event:', wsError);
        // Don't fail the transaction if WebSocket fails
      }

      return ResponseHandler.success(res, {
        message: 'Transaction status updated successfully',
        data: null,
      });
    } catch (error: unknown) {
      if (
        typeof error === 'object' &&
        error !== null &&
        'code' in error &&
        (error as { code: string }).code === 'P2025'
      ) {
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

  async updateTransactionTable(req: Request, res: Response) {
    const { id } = req.params;
    const { tableId, note } = req.body;
    const { user } = req as Request & { user?: { outletId?: string } };
    const outletId = user?.outletId;

    try {
      const transaction = await (outletId
        ? prisma.transaction.findFirst({
            where: { id, outletId },
          })
        : prisma.transaction.findUnique({
            where: { id },
          }));

      if (!transaction) {
        return ResponseHandler.error(res, {
          message: 'Transaction not found',
          statusCode: 404,
        });
      }

      await prisma.$transaction(async tx => {
        await tx.logTableMove.create({
          data: {
            outletId: transaction.outletId,
            transactionId: transaction.id,
            prevTableId: transaction.tableId,
            nextTableId: tableId,
            note,
          },
        });

        await tx.transaction.update({
          where: { id },
          data: { tableId },
        });
      });

      // Emit WebSocket event for table update
      try {
        if (transaction.outletId) {
          const wsService = getWebSocketService();
          wsService.emitTransactionTableUpdated(
            transaction.outletId,
            transaction.id,
            tableId,
            transaction.tableId || undefined,
          );
        }
      } catch (wsError) {
        logger.error('Error emitting WebSocket table update event:', wsError);
        // Don't fail the transaction if WebSocket fails
      }

      return ResponseHandler.success(res, {
        message: 'Transaction table updated successfully',
        data: null,
      });
    } catch (error) {
      logger.error('Error updating transaction table:', error);
      return ResponseHandler.error(res, {
        message: 'Internal server error',
        statusCode: 500,
      });
    }
  }
}
