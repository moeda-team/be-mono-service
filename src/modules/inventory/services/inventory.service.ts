import { PrismaClient, StockStatus, StockTransactionType } from '@prisma/client';
import {
  AddStockRequest,
  ReduceStockRequest,
  IngredientResponse,
  ActivityResponse,
  ActivityItem,
} from '../models/inventory.types';

export class InventoryService {
  constructor(private prisma: PrismaClient) {}

  async addStock(outletId: string, data: AddStockRequest, userId?: string): Promise<void> {
    await this.prisma.$transaction(async tx => {
      // Validate ingredient exists and belongs to outlet
      const ingredient = await tx.ingredient.findFirst({
        where: {
          id: data.ingredientId,
          outletId,
        },
      });

      if (!ingredient) {
        throw new Error('Ingredient not found or does not belong to this outlet');
      }

      if (data.quantity <= 0) {
        throw new Error('Quantity must be greater than 0');
      }

      // Create stock transaction
      await tx.stockTransaction.create({
        data: {
          ingredientId: data.ingredientId,
          outletId,
          type: StockTransactionType.ADD,
          quantity: data.quantity,
          note: data.note,
          createdBy: userId,
        },
      });

      // Update ingredient current stock
      const newStock = Number(ingredient.currentStock) + data.quantity;
      const newStatus = this.calculateStockStatus(newStock, Number(ingredient.minimumStock));

      await tx.ingredient.update({
        where: { id: data.ingredientId },
        data: {
          currentStock: newStock,
          status: newStatus,
        },
      });
    });
  }

  async reduceStock(outletId: string, data: ReduceStockRequest, userId?: string): Promise<void> {
    await this.prisma.$transaction(async tx => {
      // Validate ingredient exists and belongs to outlet
      const ingredient = await tx.ingredient.findFirst({
        where: {
          id: data.ingredientId,
          outletId,
        },
      });

      if (!ingredient) {
        throw new Error('Ingredient not found or does not belong to this outlet');
      }

      if (data.quantity <= 0) {
        throw new Error('Quantity must be greater than 0');
      }

      // Check if sufficient stock is available
      if (Number(ingredient.currentStock) < data.quantity) {
        throw new Error(
          `Insufficient stock. Available: ${Number(ingredient.currentStock)}, Requested: ${data.quantity}`,
        );
      }

      // Create stock transaction
      await tx.stockTransaction.create({
        data: {
          ingredientId: data.ingredientId,
          outletId,
          type: StockTransactionType.REDUCE,
          quantity: data.quantity,
          note: data.note,
          createdBy: userId,
        },
      });

      // Update ingredient current stock
      const newStock = Number(ingredient.currentStock) - data.quantity;
      const newStatus = this.calculateStockStatus(newStock, Number(ingredient.minimumStock));

      await tx.ingredient.update({
        where: { id: data.ingredientId },
        data: {
          currentStock: newStock,
          status: newStatus,
        },
      });
    });
  }

  async getIngredients(outletId: string): Promise<IngredientResponse[]> {
    const ingredients = await this.prisma.ingredient.findMany({
      where: {
        outletId,
      },
      select: {
        id: true,
        name: true,
        unit: true,
        currentStock: true,
        minimumStock: true,
        status: true,
      },
      orderBy: {
        name: 'asc',
      },
    });

    return ingredients.map(ingredient => ({
      id: ingredient.id,
      name: ingredient.name,
      unit: ingredient.unit,
      currentStock: Number(ingredient.currentStock),
      status: ingredient.status,
    }));
  }

  async getActivity(outletId: string): Promise<ActivityResponse> {
    const transactions = await this.prisma.stockTransaction.findMany({
      where: {
        outletId,
      },
      include: {
        ingredient: {
          select: {
            name: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    const activityItems: ActivityItem[] = transactions.map(transaction => ({
      id: transaction.id,
      ingredientName: transaction.ingredient.name,
      type: transaction.type,
      quantity: Number(transaction.quantity),
      note: transaction.note || undefined,
      createdAt: transaction.createdAt,
    }));

    return this.groupActivityByDate(activityItems);
  }

  private calculateStockStatus(currentStock: number, minimumStock: number): StockStatus {
    if (currentStock <= 0) {
      return StockStatus.OUT;
    }
    if (currentStock <= minimumStock) {
      return StockStatus.LOW;
    }
    return StockStatus.SAFE;
  }

  private groupActivityByDate(items: ActivityItem[]): ActivityResponse {
    const grouped: ActivityResponse = {};
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    items.forEach(item => {
      const itemDate = new Date(item.createdAt);
      let dateKey: string;

      if (itemDate >= today) {
        dateKey = 'Today';
      } else if (itemDate >= yesterday && itemDate < today) {
        dateKey = 'Yesterday';
      } else {
        dateKey = itemDate.toLocaleDateString('en-US', {
          year: 'numeric',
          month: 'short',
          day: 'numeric',
        });
      }

      if (!grouped[dateKey]) {
        grouped[dateKey] = [];
      }

      grouped[dateKey].push(item);
    });

    return grouped;
  }
}
