import { Request, Response } from 'express';
import { logger } from '../../../utils/common/logger';
import { CreateIngredientDTO, UpdateIngredientDTO } from '../models/ingredient';
import { ResponseHandler } from '../../../utils/response/responseHandler';
import prisma from '../../../lib/prisma';

export class IngredientsController {
  async getAllIngredients(req: Request, res: Response) {
    const user = (req as Request & { user: { outletId: string } }).user;

    try {
      const ingredients = await prisma.ingredient.findMany({
        where: { outletId: user.outletId },
        orderBy: {
          createdAt: 'asc',
        },
      });
      return ResponseHandler.success(res, {
        message: 'Ingredients retrieved successfully',
        data: ingredients,
      });
    } catch (error) {
      logger.error('Error getting ingredients:', error);
      return ResponseHandler.error(res, {
        message: 'Internal server error',
        statusCode: 500,
      });
    }
  }

  async getIngredientsById(req: Request, res: Response) {
    const user = (req as Request & { user: { outletId: string } }).user;
    const { id } = req.params;

    try {
      const ingredients = await prisma.ingredient.findUnique({
        where: { id, outletId: user.outletId },
      });
      if (!ingredients) {
        return ResponseHandler.error(res, {
          message: 'Ingredients not found',
          statusCode: 404,
        });
      }

      return ResponseHandler.success(res, {
        message: 'Ingredients retrieved successfully',
        data: ingredients,
      });
    } catch (error) {
      logger.error('Error getting ingredients:', error);
      return ResponseHandler.error(res, {
        message: 'Internal server error',
        statusCode: 500,
      });
    }
  }

  async createIngredients(req: Request, res: Response) {
    const user = (req as Request & { user: { outletId: string } }).user;
    const ingredientsData: CreateIngredientDTO = req.body;

    try {
      if (!user.outletId) {
        return ResponseHandler.error(res, {
          message: 'Outlet not found',
          statusCode: 404,
        });
      }

      const findIngredients = await prisma.ingredient.findFirst({
        where: {
          menuId: ingredientsData.menuId,
          stockId: ingredientsData.stockId,
          outletId: user.outletId,
        },
      });
      if (findIngredients) {
        return ResponseHandler.error(res, {
          message: 'Ingredients already exists',
          statusCode: 400,
        });
      }

      const findOutlet = await prisma.outlet.findUnique({
        where: { id: user.outletId },
      });
      if (!findOutlet) {
        return ResponseHandler.error(res, {
          message: 'Outlet not found',
          statusCode: 404,
        });
      }

      const findMenu = await prisma.menu.findUnique({
        where: { id: ingredientsData.menuId, outletId: user.outletId },
      });
      if (!findMenu) {
        return ResponseHandler.error(res, {
          message: 'Menu not found',
          statusCode: 404,
        });
      }

      const findStock = await prisma.stock.findUnique({
        where: { id: ingredientsData.stockId, outletId: user.outletId },
      });
      if (!findStock) {
        return ResponseHandler.error(res, {
          message: 'Stock not found',
          statusCode: 404,
        });
      }

      const ingredients = await prisma.ingredient.create({
        data: {
          outletId: user.outletId,
          menuId: ingredientsData.menuId,
          stockId: ingredientsData.stockId,
          value: ingredientsData.value,
          uom: ingredientsData.uom,
        },
      });

      return ResponseHandler.success(res, {
        message: 'Ingredients created successfully',
        data: ingredients,
      });
    } catch (error) {
      logger.error('Error creating ingredients:', error);
      return ResponseHandler.error(res, {
        message: 'Internal server error',
        statusCode: 500,
      });
    }
  }

  async updateIngredients(req: Request, res: Response) {
    const user = (req as Request & { user: { outletId: string } }).user;
    const { id } = req.params;
    const ingredientsData: UpdateIngredientDTO = req.body;

    try {
      if (!user.outletId) {
        return ResponseHandler.error(res, {
          message: 'Outlet not found',
          statusCode: 404,
        });
      }

      const findIngredients = await prisma.ingredient.findUnique({
        where: { id, outletId: user.outletId },
      });
      if (!findIngredients) {
        return ResponseHandler.error(res, {
          message: 'Ingredients not found',
          statusCode: 404,
        });
      }

      const findStock = await prisma.stock.findUnique({
        where: { id: ingredientsData.stockId, outletId: user.outletId },
      });
      if (!findStock) {
        return ResponseHandler.error(res, {
          message: 'Stock not found',
          statusCode: 404,
        });
      }

      const ingredients = await prisma.ingredient.update({
        where: { id, outletId: user.outletId },
        data: {
          stockId: ingredientsData.stockId,
          value: ingredientsData.value,
          uom: ingredientsData.uom,
        },
      });

      return ResponseHandler.success(res, {
        message: 'Ingredients updated successfully',
        data: ingredients,
      });
    } catch (error) {
      logger.error('Error updating ingredients:', error);
      return ResponseHandler.error(res, {
        message: 'Internal server error',
        statusCode: 500,
      });
    }
  }

  async deleteIngredients(req: Request, res: Response) {
    const user = (req as Request & { user: { outletId: string } }).user;
    const { id } = req.params;

    try {
      if (!user.outletId) {
        return ResponseHandler.error(res, {
          message: 'Outlet not found',
          statusCode: 404,
        });
      }

      const findIngredients = await prisma.ingredient.findUnique({
        where: { id, outletId: user.outletId },
      });
      if (!findIngredients) {
        return ResponseHandler.error(res, {
          message: 'Ingredients not found',
          statusCode: 404,
        });
      }

      const ingredients = await prisma.ingredient.delete({
        where: { id, outletId: user.outletId },
      });

      return ResponseHandler.success(res, {
        message: 'Ingredients deleted successfully',
        data: ingredients,
      });
    } catch (error) {
      logger.error('Error deleting ingredients:', error);
      return ResponseHandler.error(res, {
        message: 'Internal server error',
        statusCode: 500,
      });
    }
  }
}
