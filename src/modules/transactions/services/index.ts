import { convertValue } from '../../../utils/common/convert_uom';
import { Unit } from 'convert-units';
import { logger } from '../../../utils/common/logger';
import prisma from '../../../lib/prisma';
import { Prisma } from '@prisma/client';

type Decimal = Prisma.Decimal;

interface Ingredient {
  id: string;
  outletId: string;
  menuId: string;
  stockId: string;
  value: number | string | Decimal;
  uom: string;
  stock: {
    id: string;
    outletId: string;
    name: string;
    qty: Decimal;
    uom: string;
    minQty: Decimal;
    createdAt: Date;
    updatedAt: Date;
  } | null;
}

interface SubTransactionItem {
  id: string;
  menuId: string;
  menuName: string;
  status: string;
  price: Prisma.Decimal;
  quantity: number;
  subTotal: Prisma.Decimal;
  transactionId: string;
  addOn: string;
  note: string;
  createdAt: Date;
  updatedAt: Date;
}

interface Transaction {
  id: string;
  outletId: string | null;
  userId: string | null;
  paymentNumber: string;
  subTransactions: SubTransactionItem[];
}

interface SubTransaction {
  menuId: string;
  menuName: string;
}

export async function updateStockAndLogStock(
  ingredients: Ingredient[],
  transaction: Transaction,
  subTransaction: SubTransaction,
) {
  for (const ingredient of ingredients) {
    let qtyConverted;
    try {
      qtyConverted = convertValue(
        Number(ingredient.value),
        ingredient.uom as Unit,
        ingredient.stock?.uom as Unit,
      );
    } catch (error) {
      logger.error('Error converting uom:', error);
      return new Error(
        'Invalid unit conversion from ' + ingredient.uom + ' to ' + ingredient.stock?.uom,
      );
    }

    await prisma.stock.update({
      where: { id: ingredient.stockId },
      data: {
        qty: ingredient.stock?.qty.minus(qtyConverted),
      },
    });

    await prisma.logStock.create({
      data: {
        outletId: transaction.outletId || '',
        stockId: ingredient.stockId,
        qty: ingredient.value,
        type: 'outbound',
        uom: ingredient.uom,
        note:
          'Outbound from menu ' +
          subTransaction.menuName +
          ' in payment transaction ' +
          transaction.id +
          ' with payment number ' +
          transaction.paymentNumber,
        menuId: subTransaction.menuId,
        userId: transaction.userId,
      },
    });
  }
  return true;
}
