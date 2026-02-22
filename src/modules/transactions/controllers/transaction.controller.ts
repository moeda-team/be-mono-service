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
    const table = parseInt(req.query.table as string) || null;
    const month = parseInt(req.query.month as string) || null;
    const year = parseInt(req.query.year as string) || null;

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

      if (table) {
        whereClause.tableNumber = { equals: table };
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
          subTransactions: {
            include: {
              menu: true,
            },
            orderBy: {
              status: 'desc',
            },
          },
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
          ...(isNaN(Number(search)) ? [] : [{ tableNumber: { equals: Number(search) } }]),
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

    try {
      const transaction = await prisma.transaction.findUnique({
        where: { id },
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
              status: 'desc',
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
          logTableMove: true,
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

  async createTransaction(req: Request, res: Response) {
    const transactionData: CreateTransactionDTO = req.body;

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
      let voucherData;
      if (transactionData.voucher) {
        voucherData = await prisma.voucher.findFirst({
          where: {
            outletId: transactionData.outletId,
            name: transactionData.voucher,
          },
        });
        if (voucherData) {
          // Validate voucher usage based on VoucherMenu and allMenu
          if (!voucherData.allMenu) {
            // Get all menu IDs from the cart
            const cartMenuIds = transactionData.cart.map(item => item.menuId);

            // Get voucher menus for this voucher
            const voucherMenus = await prisma.voucherMenu.findMany({
              where: {
                voucherId: voucherData.id,
              },
              select: {
                menuId: true,
              },
            });

            const voucherMenuIds = voucherMenus.map(vm => vm.menuId);

            // Check if all cart items are in the voucher menu list
            const invalidItems = cartMenuIds.filter(menuId => !voucherMenuIds.includes(menuId));

            if (invalidItems.length > 0) {
              return ResponseHandler.error(res, {
                message:
                  'Voucher cannot be used with some items in cart. Voucher is only valid for specific menus.',
                statusCode: 400,
              });
            }
          }

          if (voucherData.type === 'percent' && Number(voucherData.discount) === 100) {
            const logVoucher = await prisma.logVoucher.findFirst({
              where: {
                voucherId: voucherData.id,
              },
              orderBy: {
                createdAt: 'desc',
              },
            });
            if (logVoucher) {
              return ResponseHandler.error(res, {
                message: 'This employee voucher has been used for today.',
                statusCode: 400,
              });
            }
          }
          if (Number(voucherData.usage) + 1 > Number(voucherData.maxUsage)) {
            return ResponseHandler.error(res, {
              message: 'This voucher has reached its usage limit.',
              statusCode: 400,
            });
          }
          if (voucherData?.expiredAt < new Date()) {
            return ResponseHandler.error(res, {
              message: 'This voucher has expired. Please try another one.',
              statusCode: 400,
            });
          }
        }

        if (!voucherData) {
          return ResponseHandler.error(res, {
            message: 'Invalid voucher code. Please check and try again.',
            statusCode: 404,
          });
        }
      }

      const orderNumber = await generateOrderNumber(transactionData.outletId);
      const paymentNumber = await generatePaymentNumber(transactionData.outletId);
      const subTotal = transactionData.cart.reduce((total, item) => total + item.subTotal, 0);

      let discountAmount = transactionData.discount ?? 0;
      if (voucherData) {
        if (voucherData.type === 'percent') {
          discountAmount = Math.floor((subTotal * Number(voucherData.discount)) / 100);
        } else {
          discountAmount = Number(voucherData.discount);
        }
      }

      discountAmount = Math.min(discountAmount, subTotal);
      const taxableAmount = subTotal - discountAmount;
      const tax = Math.floor(taxableAmount * 0.11);

      let serviceCharge = 0;
      if (voucherData?.type === 'percent' && Number(voucherData?.discount) === 100) {
        serviceCharge = 0;
      } else {
        const baseAmount = taxableAmount + tax;

        if (transactionData.paymentMethod === 'qris') {
          serviceCharge = Math.ceil(baseAmount * 0.007 + 500);
        } else if (transactionData.paymentMethod === 'gopay') {
          serviceCharge = Math.ceil(baseAmount * 0.02 + 500);
        } else {
          serviceCharge = 500;
        }
      }

      const totalBeforeRounding = taxableAmount + tax + serviceCharge;

      let rounding = 0;
      const remainder = totalBeforeRounding % 1000;

      if (remainder === 0) {
        rounding = 0;
      } else if (remainder <= 500) {
        rounding = 500 - remainder;
      } else {
        rounding = 1000 - remainder;
      }

      const total = totalBeforeRounding + rounding;

      let transactionStatus = 'pending';

      if (voucherData && total === 0) {
        transactionStatus = 'completed';
      } else if (transactionData.paymentMethod !== 'cash') {
        transactionStatus = transactionData.status;
      } else {
        transactionStatus = 'completed';
      }

      const itemDetails: any[] = [];

      // Cart items
      transactionData.cart.forEach(item => {
        itemDetails.push({
          id: item.id,
          price: item.price,
          quantity: item.quantity,
          name: item.menuName,
        });
      });

      // Tax
      if (tax > 0) {
        itemDetails.push({
          id: 'tax',
          price: tax,
          quantity: 1,
          name: 'Tax',
        });
      }

      // Service Charge
      if (serviceCharge > 0) {
        itemDetails.push({
          id: 'service_charge',
          price: serviceCharge,
          quantity: 1,
          name: 'Service Charge',
        });
      }

      // Rounding
      if (rounding > 0) {
        itemDetails.push({
          id: 'rounding',
          price: rounding,
          quantity: 1,
          name: 'Rounding',
        });
      }

      const sumItems = itemDetails.reduce((acc, item) => acc + item.price * item.quantity, 0);
      if (sumItems !== total) {
        throw new Error(
          `Midtrans validation error: item total (${sumItems}) does not match gross_amount (${total})`,
        );
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
          rounding: rounding,
          discount: discountAmount,
          tax: tax,
          total: total,
          additionalNote: transactionData.additionalNote,
          voucherId: voucherData?.id,
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

      if (voucherData) {
        await prisma.voucher.update({
          where: { id: voucherData.id },
          data: {
            usage: Number(voucherData.usage) + 1,
          },
        });
        await prisma.logVoucher.create({
          data: {
            outletId: transactionData.outletId,
            transactionId: transaction.id,
            voucherId: voucherData.id,
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
        message: error instanceof Error ? error.message : 'Internal server error',
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
          message: 'SubTransaction not found',
          statusCode: 404,
        });
      }

      await prisma.subTransaction.update({
        where: { id },
        data: { status },
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
    const { tableNumber, note } = req.body;

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

      const findLogTableMove = await prisma.logTableMove.findFirst({
        where: {
          transactionId: id,
          outletId: transaction.outletId,
          tableNumber: transaction.tableNumber,
        },
        orderBy: {
          createdAt: 'desc',
        },
      });

      const countLogTableMove = await prisma.logTableMove.count({
        where: {
          transactionId: id,
          outletId: transaction.outletId,
        },
        orderBy: {
          createdAt: 'desc',
        },
      });

      if (countLogTableMove > 2) {
        return ResponseHandler.error(res, {
          message: 'Transaction table move limit reached',
          statusCode: 400,
        });
      }

      const updateLogTableMove = await prisma.logTableMove.create({
        data: {
          outletId: transaction?.outletId,
          transactionId: transaction?.id,
          tableNumber: parseInt(tableNumber),
          prevTableId: findLogTableMove?.id,
          nextTableId: null,
          note: note,
        },
      });

      await prisma.logTableMove.update({
        where: { id: findLogTableMove?.id },
        data: {
          nextTableId: updateLogTableMove.id,
          note: note,
        },
      });

      await prisma.transaction.update({
        where: { id },
        data: {
          tableNumber: parseInt(tableNumber),
        },
      });

      return ResponseHandler.success(res, {
        message: 'Transaction table updated successfully',
        data: updateLogTableMove,
      });
    } catch (error) {
      if (error instanceof Error && 'code' in error && error.code === 'P2025') {
        return ResponseHandler.error(res, {
          message: 'Transaction not found',
          statusCode: 404,
        });
      }
      logger.error('Error updating transaction table:', error);
      return ResponseHandler.error(res, {
        message: 'Internal server error',
        statusCode: 500,
      });
    }
  }
}
