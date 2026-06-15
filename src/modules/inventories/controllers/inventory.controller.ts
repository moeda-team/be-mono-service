import { Request, Response } from 'express';
import { logger } from '../../../utils/common/logger';
import { CreateInventoryDTO, UpdateInventoryDTO, StockStatus } from '../models/inventory';
import { ResponseHandler } from '../../../utils/response/responseHandler';
import prisma from '../../../config/database';
import { Prisma } from '@prisma/client';
import {
  resolveOutletFilter,
  resolveOutletForWrite,
  isAllOutletRole,
} from '../../../utils/auth/outletAccess';

export class InventoryController {
  async getAllInventories(req: Request, res: Response) {
    try {
      const { user } = req as Request & { user?: { outletId?: string; role?: string } };
      const outletId = resolveOutletFilter(user, req.query.outletId as string | undefined);
      const { status } = req.query;
      const page = parseInt(req.query.page as string) || null;
      const limit = parseInt(req.query.limit as string) || null;
      const search = (req.query.search as string)?.trim() || null;

      const where: Prisma.InventoryWhereInput = {};
      if (outletId) where.outletId = outletId;
      if (status) where.status = status as StockStatus;

      if (search) {
        where.name = {
          contains: search,
          mode: 'insensitive',
        };
      }

      const skip = page && limit ? (page - 1) * limit : undefined;
      const take = limit || undefined;

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
        skip,
        take,
      });

      if (page && limit) {
        const total = await prisma.inventory.count({ where });
        return ResponseHandler.success(res, {
          message: 'Inventories retrieved successfully',
          data: inventories,
          pagination: {
            page,
            limit,
            total,
            totalPages: Math.ceil(total / limit),
          },
        });
      }

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
    const { user } = req as Request & { user?: { outletId?: string; role?: string } };
    const outletId = resolveOutletFilter(user, req.query.outletId as string | undefined);

    try {
      const inventory = await (outletId
        ? prisma.inventory.findFirst({
            where: { id, outletId },
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
          })
        : prisma.inventory.findUnique({
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
          }));

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
    const { user } = req as Request & { user?: { outletId?: string; role?: string } };
    const outletId = resolveOutletForWrite(user, req.body.outletId);
    const inventoryData: CreateInventoryDTO = {
      ...req.body,
      outletId,
      currentStock: parseFloat(req.body.currentStock),
      minimumStock: parseFloat(req.body.minimumStock),
    };

    try {
      const outlet = outletId
        ? await prisma.outlet.findUnique({
            where: { id: outletId },
          })
        : null;

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
    const { user } = req as Request & { user?: { outletId?: string; role?: string } };

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

      // Non-admin users can only modify inventory in their own outlet
      if (!isAllOutletRole(user?.role)) {
        if (inventory.outletId !== user?.outletId) {
          return ResponseHandler.error(res, {
            message: 'Access denied',
            statusCode: 403,
          });
        }
        // Prevent moving the inventory to a different outlet
        inventoryData.outletId = user?.outletId;
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
    const { user } = req as Request & { user?: { outletId?: string; role?: string } };

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

      // Non-admin users can only delete inventory in their own outlet
      if (!isAllOutletRole(user?.role) && inventory.outletId !== user?.outletId) {
        return ResponseHandler.error(res, {
          message: 'Access denied',
          statusCode: 403,
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

  async countByStatus(req: Request, res: Response) {
    try {
      const { user } = req as Request & { user?: { outletId?: string; role?: string } };
      const outletId = resolveOutletFilter(user, req.query.outletId as string | undefined);

      const where: any = {};
      if (outletId) where.outletId = outletId as string;

      const counts = await prisma.inventory.groupBy({
        by: ['status'],
        where,
        _count: {
          status: true,
        },
      });

      const result = {
        SAFE: 0,
        LOW: 0,
        OUT: 0,
        total: 0,
      };

      counts.forEach(count => {
        result[count.status as keyof typeof result] = count._count.status;
        result.total += count._count.status;
      });

      return ResponseHandler.success(res, {
        message: 'Inventory count by status retrieved successfully',
        data: result,
      });
    } catch (error) {
      logger.error('Error getting inventory count by status:', error);
      return ResponseHandler.error(res, {
        message: 'Internal server error',
        statusCode: 500,
      });
    }
  }
}
