import { Request, Response } from 'express';
import { logger } from '../../../utils/common/logger';
import { CreateInventoryDTO, UpdateInventoryDTO, StockStatus } from '../models/inventory';
import { ResponseHandler } from '../../../utils/response/responseHandler';
import prisma from '../../../lib/prisma';

export class InventoryController {
  async getAllInventories(req: Request, res: Response) {
    try {
      const { outletId, status } = req.query;

      const where: any = {};
      if (outletId) where.outletId = outletId as string;
      if (status) where.status = status as StockStatus;

      const inventories = await prisma.inventory.findMany({
        where,
        include: {
          outlet: {
            select: {
              id: true,
              name: true,
            },
          },
        },
        orderBy: {
          createdAt: 'desc',
        },
      });

      return ResponseHandler.success(res, {
        message: 'Inventories retrieved successfully',
        data: inventories,
      });
    } catch (error) {
      logger.error('Error getting inventories:', error);
      return ResponseHandler.error(res, {
        message: 'Internal server error',
        statusCode: 500,
      });
    }
  }

  async getInventoryById(req: Request, res: Response) {
    const { id } = req.params;

    try {
      const inventory = await prisma.inventory.findUnique({
        where: { id },
        include: {
          outlet: {
            select: {
              id: true,
              name: true,
            },
          },
          stockTransactions: {
            orderBy: {
              createdAt: 'desc',
            },
            take: 10,
          },
        },
      });

      if (!inventory) {
        return ResponseHandler.error(res, {
          message: 'Inventory not found',
          statusCode: 404,
        });
      }

      return ResponseHandler.success(res, {
        message: 'Inventory retrieved successfully',
        data: inventory,
      });
    } catch (error) {
      logger.error('Error getting inventory:', error);
      return ResponseHandler.error(res, {
        message: 'Internal server error',
        statusCode: 500,
      });
    }
  }

  async createInventory(req: Request, res: Response) {
    const inventoryData: CreateInventoryDTO = {
      ...req.body,
      currentStock: parseFloat(req.body.currentStock),
      minimumStock: parseFloat(req.body.minimumStock),
    };

    try {
      const outlet = await prisma.outlet.findUnique({
        where: { id: inventoryData.outletId },
      });

      if (!outlet) {
        return ResponseHandler.error(res, {
          message: 'Outlet not found',
          statusCode: 404,
        });
      }

      const existingInventory = await prisma.inventory.findFirst({
        where: {
          outletId: inventoryData.outletId,
          name: inventoryData.name,
        },
      });

      if (existingInventory) {
        return ResponseHandler.error(res, {
          message: 'Inventory with this name already exists in the outlet',
          statusCode: 400,
        });
      }

      // Calculate status automatically based on stock levels
      let calculatedStatus: StockStatus;
      if (inventoryData.currentStock === 0) {
        calculatedStatus = StockStatus.OUT;
      } else if (inventoryData.currentStock <= inventoryData.minimumStock) {
        calculatedStatus = StockStatus.LOW;
      } else {
        calculatedStatus = StockStatus.SAFE;
      }

      const inventory = await prisma.inventory.create({
        data: {
          outletId: inventoryData.outletId,
          name: inventoryData.name,
          unit: inventoryData.unit,
          currentStock: inventoryData.currentStock,
          minimumStock: inventoryData.minimumStock,
          status: calculatedStatus,
        },
        include: {
          outlet: {
            select: {
              id: true,
              name: true,
            },
          },
        },
      });

      return ResponseHandler.success(res, {
        message: 'Inventory created successfully',
        data: inventory,
      });
    } catch (error) {
      logger.error('Error creating inventory:', error);
      return ResponseHandler.error(res, {
        message: 'Internal server error',
        statusCode: 500,
      });
    }
  }

  async updateInventory(req: Request, res: Response) {
    const { id } = req.params;

    const inventoryData: UpdateInventoryDTO = {
      ...req.body,
    };

    try {
      const inventory = await prisma.inventory.findUnique({
        where: { id },
      });

      if (!inventory) {
        return ResponseHandler.error(res, {
          message: 'Inventory not found',
          statusCode: 404,
        });
      }

      if (inventoryData.outletId) {
        const outlet = await prisma.outlet.findUnique({
          where: { id: inventoryData.outletId },
        });

        if (!outlet) {
          return ResponseHandler.error(res, {
            message: 'Outlet not found',
            statusCode: 404,
          });
        }
      }

      if (inventoryData.outletId && inventoryData.name) {
        const existingInventory = await prisma.inventory.findFirst({
          where: {
            outletId: inventoryData.outletId,
            name: inventoryData.name,
            id: { not: id },
          },
        });

        if (existingInventory) {
          return ResponseHandler.error(res, {
            message: 'Inventory with this name already exists in the outlet',
            statusCode: 400,
          });
        }
      }

      const updateData: any = { ...inventoryData };
      const updatedInventory = await prisma.inventory.update({
        where: { id },
        data: updateData,
        include: {
          outlet: {
            select: {
              id: true,
              name: true,
            },
          },
        },
      });

      return ResponseHandler.success(res, {
        message: 'Inventory updated successfully',
        data: updatedInventory,
      });
    } catch (error) {
      logger.error('Error updating inventory:', error);
      return ResponseHandler.error(res, {
        message: 'Internal server error',
        statusCode: 500,
      });
    }
  }

  async deleteInventory(req: Request, res: Response) {
    const { id } = req.params;

    try {
      const inventory = await prisma.inventory.findUnique({
        where: { id },
      });

      if (!inventory) {
        return ResponseHandler.error(res, {
          message: 'Inventory not found',
          statusCode: 404,
        });
      }

      await prisma.inventory.delete({
        where: { id },
      });

      return ResponseHandler.success(res, {
        message: 'Inventory deleted successfully',
        data: null,
      });
    } catch (error) {
      if (error instanceof Error && 'code' in error && error.code === 'P2025') {
        return ResponseHandler.error(res, {
          message: 'Inventory not found',
          statusCode: 404,
        });
      }
      logger.error('Error deleting inventory:', error);
      return ResponseHandler.error(res, {
        message: 'Internal server error',
        statusCode: 500,
      });
    }
  }

  async getLowStockInventories(req: Request, res: Response) {
    try {
      const { outletId } = req.query;

      const where: any = {
        OR: [
          {
            currentStock: {
              lte: prisma.inventory.fields.minimumStock,
            },
          },
          {
            status: StockStatus.LOW,
          },
          {
            status: StockStatus.OUT,
          },
        ],
      };

      if (outletId) where.outletId = outletId as string;

      const inventories = await prisma.inventory.findMany({
        where,
        include: {
          outlet: {
            select: {
              id: true,
              name: true,
            },
          },
        },
        orderBy: {
          currentStock: 'asc',
        },
      });

      return ResponseHandler.success(res, {
        message: 'Low stock inventories retrieved successfully',
        data: inventories,
      });
    } catch (error) {
      logger.error('Error getting low stock inventories:', error);
      return ResponseHandler.error(res, {
        message: 'Internal server error',
        statusCode: 500,
      });
    }
  }
}
