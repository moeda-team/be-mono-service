import { logger } from '../utils/common/logger';
import prisma from '../config/database';
import { StockStatus, StockTransactionType } from '@prisma/client';

export class IngredientService {
  static async reduceIngredientsAndLogActivity(transaction: any) {
    try {
      const findSystemUser = await prisma.user.findFirst({
        where: { email: 'system@example.com' },
      });

      // Get all sub-transactions with menu ingredients
      const subTransactionsWithIngredients = await prisma.subTransaction.findMany({
        where: {
          transactionId: transaction.id,
        },
        include: {
          menu: {
            include: {
              menuIngredients: {
                include: {
                  ingredient: true,
                },
              },
            },
          },
        },
      });

      for (const subTransaction of subTransactionsWithIngredients) {
        if (!subTransaction.menu?.menuIngredients.length) {
          continue;
        }

        for (const [index, menuIngredient] of subTransaction.menu.menuIngredients.entries()) {
          const ingredient = menuIngredient.ingredient;
          const quantityNeeded = Number(menuIngredient.quantity) * subTransaction.quantity;
          const currentStock = Number(ingredient.currentStock);

          if (currentStock >= quantityNeeded) {
            // Update ingredient stock
            await prisma.inventory.update({
              where: { id: ingredient.id },
              data: {
                currentStock: currentStock - quantityNeeded,
                status: this.calculateStockStatus(
                  currentStock - quantityNeeded,
                  Number(ingredient.minimumStock),
                ),
              },
            });

            // Log stock transaction (activity)
            await prisma.stockTransaction.create({
              data: {
                ingredientId: ingredient.id,
                outletId: transaction.outletId,
                type: StockTransactionType.REDUCE,
                quantity: quantityNeeded,
                note: `Reduced for menu "${subTransaction.menuName}" on order #${index + 1} in transaction #${transaction.paymentNumber}`,
                createdBy: findSystemUser?.id || '',
              },
            });

            logger.info(
              `Reduced ${quantityNeeded} ${ingredient.unit} of ${ingredient.name} for transaction ${transaction.paymentNumber} order #${index + 1}`,
            );
          } else {
            logger.warn(
              `Insufficient stock for ${ingredient.name}. Required: ${quantityNeeded}, Available: ${currentStock}`,
            );
          }
        }
      }
    } catch (error) {
      logger.error('Error reducing ingredients and logging activity:', error);
      // Don't throw error to avoid failing the transaction
    }
  }

  private static calculateStockStatus(currentStock: number, minimumStock: number): StockStatus {
    if (currentStock <= 0) {
      return StockStatus.OUT;
    } else if (currentStock <= minimumStock) {
      return StockStatus.LOW;
    } else {
      return StockStatus.SAFE;
    }
  }
}
