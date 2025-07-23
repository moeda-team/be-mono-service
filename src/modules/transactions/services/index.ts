import { convertValue } from '../../../utils/common/convert_uom';
import { Unit } from 'convert-units';
import { logger } from '../../../utils/common/logger';
import prisma from '../../../lib/prisma';

export async function updateStockAndLogStock(
  ingredients: any,
  transaction: any,
  subTransaction: any,
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
