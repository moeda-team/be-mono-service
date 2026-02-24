import { Request, Response } from 'express';
import { BaseController } from './base.controller';
import { InventoryService } from '../services/inventory.service';
import { AddStockRequest, ReduceStockRequest } from '../models/inventory.types';

export class InventoryController extends BaseController {
  constructor(private inventoryService: InventoryService) {
    super();
  }

  async addStock(req: Request, res: Response): Promise<Response> {
    try {
      const outletId = req.headers['Outletid'] as string;
      const userId = req.headers['user-id'] as string;

      if (!outletId) {
        return this.sendError(res, {
          message: 'Outlet ID is required in headers',
          statusCode: 400,
          error: {
            code: 'OUTLET_ID_REQUIRED',
          },
        });
      }

      const { ingredientId, quantity, note }: AddStockRequest = req.body;

      await this.inventoryService.addStock(outletId, { ingredientId, quantity, note }, userId);

      return this.sendSuccess(res, {
        message: 'Stock added successfully',
        data: null,
      });
    } catch (error: any) {
      console.error('Error in addStock:', error);

      if (error.message.includes('not found') || error.message.includes('does not belong')) {
        return this.sendError(res, {
          message: error.message,
          statusCode: 404,
          error: {
            code: 'INGREDIENT_NOT_FOUND',
          },
        });
      } else if (error.message.includes('must be greater than 0')) {
        return this.sendError(res, {
          message: error.message,
          statusCode: 400,
          error: {
            code: 'INVALID_QUANTITY',
          },
        });
      } else {
        return this.sendError(res, {
          message: 'Internal server error',
          statusCode: 500,
          error: {
            code: 'INTERNAL_ERROR',
          },
        });
      }
    }
  }

  async reduceStock(req: Request, res: Response): Promise<Response> {
    try {
      const outletId = req.headers['Outletid'] as string;
      const userId = req.headers['user-id'] as string;

      if (!outletId) {
        return this.sendError(res, {
          message: 'Outlet ID is required in headers',
          statusCode: 400,
          error: {
            code: 'OUTLET_ID_REQUIRED',
          },
        });
      }

      const { ingredientId, quantity, note }: ReduceStockRequest = req.body;

      await this.inventoryService.reduceStock(outletId, { ingredientId, quantity, note }, userId);

      return this.sendSuccess(res, {
        message: 'Stock reduced successfully',
        data: null,
      });
    } catch (error: any) {
      console.error('Error in reduceStock:', error);

      if (error.message.includes('not found') || error.message.includes('does not belong')) {
        return this.sendError(res, {
          message: error.message,
          statusCode: 404,
          error: {
            code: 'INGREDIENT_NOT_FOUND',
          },
        });
      } else if (
        error.message.includes('Insufficient stock') ||
        error.message.includes('must be greater than 0')
      ) {
        return this.sendError(res, {
          message: error.message,
          statusCode: 400,
          error: {
            code: 'INSUFFICIENT_STOCK',
          },
        });
      } else {
        return this.sendError(res, {
          message: 'Internal server error',
          statusCode: 500,
          error: {
            code: 'INTERNAL_ERROR',
          },
        });
      }
    }
  }

  async getIngredients(req: Request, res: Response): Promise<Response> {
    try {
      const outletId = req.headers['Outletid'] as string;

      if (!outletId) {
        return this.sendError(res, {
          message: 'Outlet ID is required in headers',
          statusCode: 400,
          error: {
            code: 'OUTLET_ID_REQUIRED',
          },
        });
      }

      const ingredients = await this.inventoryService.getIngredients(outletId);

      return this.sendSuccess(res, {
        message: 'Ingredients retrieved successfully',
        data: ingredients,
      });
    } catch (error: any) {
      console.error('Error in getIngredients:', error);

      return this.sendError(res, {
        message: 'Internal server error',
        statusCode: 500,
        error: {
          code: 'INTERNAL_ERROR',
        },
      });
    }
  }

  async getActivity(req: Request, res: Response): Promise<Response> {
    try {
      const outletId = req.headers['Outletid'] as string;

      if (!outletId) {
        return this.sendError(res, {
          message: 'Outlet ID is required in headers',
          statusCode: 400,
          error: {
            code: 'OUTLET_ID_REQUIRED',
          },
        });
      }

      const activity = await this.inventoryService.getActivity(outletId);

      return this.sendSuccess(res, {
        message: 'Activity retrieved successfully',
        data: activity,
      });
    } catch (error: any) {
      console.error('Error in getActivity:', error);

      return this.sendError(res, {
        message: 'Internal server error',
        statusCode: 500,
        error: {
          code: 'INTERNAL_ERROR',
        },
      });
    }
  }
}
