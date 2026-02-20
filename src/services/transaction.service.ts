import { BaseService } from './base.service';
import { AppError, ErrorCode } from '../utils/errors/custom.errors';
import { Decimal } from '@prisma/client/runtime/library';
import { generateOrderNumber, generatePaymentNumber } from '../utils/generator/generate.number';
import {
  CreateTransactionDTO,
  TransactionQueryParams,
  TransactionStatus,
} from '../types/transaction.types';

export class TransactionService extends BaseService {
  async getAllTransactions(params: TransactionQueryParams & { outletId?: string }) {
    const { outletId, page, limit, search, active, table, month, year } = params;

    const { skip, take } = this.paginate(page, limit);

    const whereClause: any = {
      outletId,
    };

    if (search) {
      const orFilters: any[] = [];
      orFilters.push({
        customerName: {
          contains: search,
          mode: 'insensitive',
        },
      });

      const tableNumber = Number(search);
      if (!isNaN(tableNumber)) {
        orFilters.push({
          tableNumber: { equals: tableNumber },
        });
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

    try {
      const transactions = await this.prisma.transaction.findMany({
        where: whereClause,
        orderBy: { createdAt: 'desc' },
        include: {
          logTableMove: {
            orderBy: { createdAt: 'asc' },
          },
          subTransactions: {
            include: { menu: true },
            orderBy: { status: 'desc' },
          },
        },
        skip,
        take,
      });

      const transactionsWithStatus = transactions.map(transaction => ({
        ...transaction,
        status: transaction.subTransactions[0]?.status || 'unknown',
      }));

      const responseData: any = {
        transactions: transactionsWithStatus,
      };

      if (page && limit) {
        const total = await this.prisma.transaction.count({
          where: whereClause,
        });
        responseData.pagination = {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit),
        };
      }

      return responseData;
    } catch (error) {
      this.handleDatabaseError(error);
    }
  }

  async getTransactionById(id: string) {
    await this.checkEntityExists(this.prisma.transaction, id, 'Transaction');

    try {
      return await this.prisma.transaction.findUnique({
        where: { id },
        include: {
          logTableMove: {
            orderBy: { createdAt: 'asc' },
          },
          subTransactions: {
            include: { menu: true },
            orderBy: { status: 'desc' },
          },
        },
      });
    } catch (error) {
      this.handleDatabaseError(error);
    }
  }

  async createTransaction(data: CreateTransactionDTO, userId?: string) {
    this.validateRequiredFields(data, [
      'outletId',
      'transactionType',
      'tableNumber',
      'paymentMethod',
      'cart',
    ]);

    if (!Array.isArray(data.cart) || data.cart.length === 0) {
      throw AppError.badRequest('Cart must contain at least one item', ErrorCode.INVALID_INPUT);
    }

    return await this.executeWithTransaction(async tx => {
      // Validate outlet exists
      const outlet = await tx.outlet.findUnique({
        where: { id: data.outletId },
      });

      if (!outlet) {
        throw AppError.notFound('Outlet not found', ErrorCode.OUTLET_NOT_FOUND);
      }

      // Validate user if provided
      if (userId) {
        const user = await tx.user.findUnique({
          where: { id: userId },
        });

        if (!user) {
          throw AppError.notFound('User not found', ErrorCode.USER_NOT_FOUND);
        }
      }

      // Process voucher if provided
      let voucherData = null;
      if (data.voucher) {
        voucherData = await this.validateVoucher(tx, data.voucher, data.outletId);
      }

      // Calculate totals
      const calculations = this.calculateTransactionTotals(
        data.cart,
        voucherData,
        data.paymentMethod,
      );

      // Generate numbers
      const orderNumber = await generateOrderNumber(data.outletId);
      const paymentNumber = await generatePaymentNumber(data.outletId);

      // Determine transaction status
      const transactionStatus = this.determineTransactionStatus(
        calculations.total,
        voucherData,
        data.paymentMethod,
        data.status,
      );

      // Create transaction
      const transaction = await tx.transaction.create({
        data: {
          userId,
          outletId: data.outletId,
          number: orderNumber,
          transactionType: data.transactionType,
          tableNumber: data.tableNumber,
          paymentNumber,
          paymentMethod: data.paymentMethod,
          customerName: data.customerName,
          totalSubTransaction: data.cart.length,
          subTotal: calculations.subTotal,
          serviceCharge: calculations.serviceCharge,
          rounding: calculations.rounding,
          discount: calculations.discountAmount,
          total: calculations.total,
          additionalNote: data.additionalNote,
          voucherId: voucherData?.id,
          status: transactionStatus,
        },
      });

      // Create sub-transactions
      for (const item of data.cart) {
        await tx.subTransaction.create({
          data: {
            transactionId: transaction.id,
            menuId: item.menuId,
            menuName: item.menuName,
            quantity: item.quantity,
            price: item.price,
            subTotal: item.subTotal,
            addOn: item.addOn || '',
            note: item.note || '',
            status: 'preparation',
          },
        });
      }

      // Update voucher usage if applicable
      if (voucherData) {
        await tx.voucher.update({
          where: { id: voucherData.id },
          data: {
            usage: Number(voucherData.usage) + 1,
          },
        });

        await tx.logVoucher.create({
          data: {
            outletId: data.outletId,
            transactionId: transaction.id,
            voucherId: voucherData.id,
          },
        });
      }

      return {
        ...transaction,
        details: await tx.subTransaction.findMany({
          where: { transactionId: transaction.id },
        }),
      };
    });
  }

  async updateTransactionStatus(transactionId: string, status: TransactionStatus) {
    return await this.executeWithTransaction(async tx => {
      const subTransaction = await tx.subTransaction.findUnique({
        where: { id: transactionId },
      });

      if (!subTransaction) {
        throw AppError.notFound('SubTransaction not found', ErrorCode.NOT_FOUND);
      }

      await tx.subTransaction.update({
        where: { id: transactionId },
        data: { status },
      });

      const subTransactions = await tx.subTransaction.findMany({
        where: { transactionId: subTransaction.transactionId },
        select: { status: true },
      });

      const allComplete = subTransactions.every(sub => sub.status === 'complete');

      if (allComplete) {
        await tx.transaction.update({
          where: { id: subTransaction.transactionId },
          data: { status: 'complete' },
        });
      }
    });
  }

  private async validateVoucher(tx: any, voucherName: string, outletId: string) {
    const voucherData = await tx.voucher.findFirst({
      where: {
        outletId,
        name: voucherName,
      },
    });

    if (!voucherData) {
      throw AppError.notFound(
        'Invalid voucher code. Please check and try again.',
        ErrorCode.VOUCHER_NOT_FOUND,
      );
    }

    // Check if voucher is expired
    if (voucherData.expiredAt < new Date()) {
      throw AppError.badRequest(
        'This voucher has expired. Please try another one.',
        ErrorCode.VOUCHER_EXPIRED,
      );
    }

    // Check usage limit
    if (Number(voucherData.usage) + 1 > Number(voucherData.maxUsage)) {
      throw AppError.badRequest(
        'This voucher has reached its usage limit.',
        ErrorCode.VOUCHER_LIMIT_REACHED,
      );
    }

    // Special check for 100% employee vouchers
    if (voucherData.type === 'percent' && Number(voucherData.discount) === 100) {
      const logVoucher = await tx.logVoucher.findFirst({
        where: {
          voucherId: voucherData.id,
        },
        orderBy: {
          createdAt: 'desc',
        },
      });

      if (logVoucher) {
        throw AppError.badRequest(
          'This employee voucher has been used for today.',
          ErrorCode.VOUCHER_LIMIT_REACHED,
        );
      }
    }

    return voucherData;
  }

  private calculateTransactionTotals(cart: any[], voucherData: any, paymentMethod: string) {
    const subTotal = cart.reduce((total, item) => total + item.subTotal, 0);

    let discountAmount = 0;
    if (voucherData) {
      if (voucherData.type === 'percent') {
        discountAmount = (subTotal * Number(voucherData.discount)) / 100;
      } else {
        discountAmount = Number(voucherData.discount);
      }
    }

    let serviceCharge = 0;
    if (voucherData?.type === 'percent' && Number(voucherData?.discount) === 100) {
      serviceCharge = 0;
    } else {
      if (paymentMethod === 'qris') {
        serviceCharge = Math.ceil((subTotal - discountAmount) * 0.007 + 500);
      } else if (paymentMethod === 'gopay') {
        serviceCharge = Math.ceil((subTotal - discountAmount) * 0.02 + 500);
      } else {
        serviceCharge = 500;
      }
    }

    const totalBeforeRounding = subTotal - discountAmount + serviceCharge;
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

    return {
      subTotal,
      discountAmount,
      serviceCharge,
      rounding,
      total,
    };
  }

  private determineTransactionStatus(
    total: number,
    voucherData: any,
    paymentMethod: string,
    providedStatus?: string,
  ): string {
    if (voucherData && total === 0) {
      return 'completed';
    }

    if (paymentMethod !== 'cash') {
      return providedStatus || 'pending';
    }

    return 'completed';
  }
}
