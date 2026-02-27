import { Request, Response } from 'express';
import { logger } from '../../../utils/common/logger';
import { CreateActivityDTO, UpdateActivityDTO, ActivityType } from '../models/activity';
import { StockStatus } from '../models/inventory';
import { ResponseHandler } from '../../../utils/response/responseHandler';
import prisma from '../../../lib/prisma';

export class ActivityController {
  async getAllActivities(req: Request, res: Response) {
    try {
      const { inventoryId, type } = req.query;

      const where: any = {};
      if (inventoryId) where.ingredientId = inventoryId as string;
      if (type) where.type = type as ActivityType;

      const activities = await prisma.stockTransaction.findMany({
        where,
        include: {
          inventory: {
            include: {
              outlet: {
                select: {
                  id: true,
                  name: true,
                },
              },
            },
          },
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
        message: 'Activities retrieved successfully',
        data: activities,
      });
    } catch (error) {
      logger.error('Error getting activities:', error);
      return ResponseHandler.error(res, {
        message: 'Internal server error',
        statusCode: 500,
      });
    }
  }

  async getActivityById(req: Request, res: Response) {
    const { id } = req.params;

    try {
      const activity = await prisma.stockTransaction.findUnique({
        where: { id },
        include: {
          inventory: {
            include: {
              outlet: {
                select: {
                  id: true,
                  name: true,
                },
              },
            },
          },
          outlet: {
            select: {
              id: true,
              name: true,
            },
          },
        },
      });

      if (!activity) {
        return ResponseHandler.error(res, {
          message: 'Activity not found',
          statusCode: 404,
        });
      }

      return ResponseHandler.success(res, {
        message: 'Activity retrieved successfully',
        data: activity,
      });
    } catch (error) {
      logger.error('Error getting activity:', error);
      return ResponseHandler.error(res, {
        message: 'Internal server error',
        statusCode: 500,
      });
    }
  }

  async createActivity(req: Request, res: Response) {
    const activityData: CreateActivityDTO = {
      ...req.body,
      quantity: parseFloat(req.body.quantity),
    };

    try {
      const inventory = await prisma.inventory.findUnique({
        where: { id: activityData.inventoryId },
      });

      if (!inventory) {
        return ResponseHandler.error(res, {
          message: 'Inventory not found',
          statusCode: 404,
        });
      }

      // Calculate new stock based on activity type
      let newStock: number;
      switch (activityData.type) {
        case ActivityType.ADD:
          newStock = Number(inventory.currentStock) + activityData.quantity;
          break;
        case ActivityType.REDUCE:
          newStock = Number(inventory.currentStock) - activityData.quantity;
          if (newStock < 0) {
            return ResponseHandler.error(res, {
              message: 'Insufficient stock for reduce transaction',
              statusCode: 400,
            });
          }
          break;
        case ActivityType.ADJUST:
          // For adjustment, quantity represents the new stock level
          newStock = activityData.quantity;
          break;
        default:
          return ResponseHandler.error(res, {
            message: 'Invalid activity type',
            statusCode: 400,
          });
      }

      // Calculate new status
      let newStatus: StockStatus;
      if (newStock === 0) {
        newStatus = StockStatus.OUT;
      } else if (newStock <= Number(inventory.minimumStock)) {
        newStatus = StockStatus.LOW;
      } else {
        newStatus = StockStatus.SAFE;
      }

      // Use a transaction to ensure data consistency
      const result = await prisma.$transaction(async tx => {
        // Create the activity record
        const activity = await tx.stockTransaction.create({
          data: {
            ingredientId: activityData.inventoryId,
            type: activityData.type,
            quantity: activityData.quantity,
            note: activityData.notes,
            outletId: inventory.outletId,
          },
          include: {
            inventory: {
              include: {
                outlet: {
                  select: {
                    id: true,
                    name: true,
                  },
                },
              },
            },
          },
        });

        // Update inventory stock and status
        const updatedInventory = await tx.inventory.update({
          where: { id: activityData.inventoryId },
          data: {
            currentStock: newStock,
            status: newStatus,
          },
        });

        return { activity, updatedInventory };
      });

      return ResponseHandler.success(res, {
        message: 'Activity created successfully',
        data: result.activity,
      });
    } catch (error) {
      logger.error('Error creating activity:', error);
      return ResponseHandler.error(res, {
        message: 'Internal server error',
        statusCode: 500,
      });
    }
  }

  async deleteActivity(req: Request, res: Response) {
    const { id } = req.params;

    try {
      const activity = await prisma.stockTransaction.findUnique({
        where: { id },
        include: {
          inventory: true,
        },
      });

      if (!activity) {
        return ResponseHandler.error(res, {
          message: 'Activity not found',
          statusCode: 404,
        });
      }

      // Prevent deletion of ADJUST activities as they set absolute stock levels
      if (activity.type === 'ADJUST') {
        return ResponseHandler.error(res, {
          message: 'ADJUST activities cannot be deleted to maintain data integrity',
          statusCode: 400,
        });
      }

      // Use a transaction to reverse the stock changes
      await prisma.$transaction(async tx => {
        // Calculate the reverse stock change
        let stockChange: number;
        if (activity.type === 'ADD') {
          stockChange = -Number(activity.quantity); // Reverse the addition
        } else if (activity.type === 'REDUCE') {
          stockChange = Number(activity.quantity); // Reverse the reduction
        } else {
          throw new Error('Invalid activity type for deletion');
        }

        // Update inventory stock
        const newStock = Number(activity.inventory.currentStock) + stockChange;
        if (newStock < 0) {
          throw new Error('Cannot delete activity: would result in negative stock');
        }

        // Calculate new status
        let newStatus: StockStatus;
        if (newStock === 0) {
          newStatus = StockStatus.OUT;
        } else if (newStock <= Number(activity.inventory.minimumStock)) {
          newStatus = StockStatus.LOW;
        } else {
          newStatus = StockStatus.SAFE;
        }

        // Update inventory
        await tx.inventory.update({
          where: { id: activity.ingredientId },
          data: {
            currentStock: newStock,
            status: newStatus,
          },
        });

        // Delete the activity
        await tx.stockTransaction.delete({
          where: { id },
        });
      });

      return ResponseHandler.success(res, {
        message: 'Activity deleted successfully and stock reversed',
        data: null,
      });
    } catch (error) {
      logger.error('Error deleting activity:', error);
      return ResponseHandler.error(res, {
        message: error instanceof Error ? error.message : 'Internal server error',
        statusCode: 500,
      });
    }
  }
}
