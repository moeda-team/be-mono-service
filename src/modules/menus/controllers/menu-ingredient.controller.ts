import { Request, Response } from 'express';
import { logger } from '../../../utils/common/logger';
import { UpsertMenuIngredientDTO } from '../models/menu-ingredient.model';
import { ResponseHandler } from '../../../utils/response/responseHandler';
import { JwtPayload } from '../../../utils/auth/jwt';
import prisma from '../../../lib/prisma';

interface AuthenticatedRequest extends Request {
  user?: JwtPayload;
}

export class MenuIngredientController {
  upsertMenuIngredient = async (req: AuthenticatedRequest, res: Response) => {
    const { menuId } = req.body;
    const ingredients = req.body.ingredients || [req.body];

    try {
      // Check if menu exists
      const menu = await prisma.menu.findUnique({
        where: { id: menuId },
      });

      if (!menu) {
        return ResponseHandler.error(res, {
          message: 'Menu not found',
          statusCode: 404,
        });
      }

      // Handle both single ingredient and array of ingredients
      const ingredientsArray = Array.isArray(ingredients) ? ingredients : [req.body];

      // Validate all ingredients exist and get their units
      const ingredientIds = ingredientsArray.map((ing: any) => ing.ingredientId);
      const existingIngredients = await prisma.inventory.findMany({
        where: { id: { in: ingredientIds } },
      });

      if (existingIngredients.length !== ingredientIds.length) {
        return ResponseHandler.error(res, {
          message: 'One or more ingredients not found',
          statusCode: 404,
        });
      }

      // Process each ingredient
      const results = [];
      for (const ingredientData of ingredientsArray) {
        // Get unit from ingredient data if not provided
        const ingredient = existingIngredients.find(ing => ing.id === ingredientData.ingredientId);
        const unit = ingredientData.unit || ingredient?.unit || 'pcs';

        // Check if relationship exists
        const existingMenuIngredient = await prisma.menuIngredient.findFirst({
          where: {
            menuId: menuId,
            ingredientId: ingredientData.ingredientId,
          },
        });

        let menuIngredient;
        if (existingMenuIngredient) {
          // Update existing
          menuIngredient = await prisma.menuIngredient.update({
            where: { id: existingMenuIngredient.id },
            data: {
              quantity: ingredientData.quantity,
              unit: unit,
            },
            include: {
              menu: {
                select: { id: true, name: true },
              },
              ingredient: {
                select: { id: true, name: true, unit: true },
              },
            },
          });
        } else {
          // Create new
          menuIngredient = await prisma.menuIngredient.create({
            data: {
              menuId: menuId,
              ingredientId: ingredientData.ingredientId,
              quantity: ingredientData.quantity,
              unit: unit,
            },
            include: {
              menu: {
                select: { id: true, name: true },
              },
              ingredient: {
                select: { id: true, name: true, unit: true },
              },
            },
          });
        }
        results.push(menuIngredient);
      }

      return ResponseHandler.success(res, {
        message: 'Menu ingredients upserted successfully',
        data: Array.isArray(ingredients) ? results : results[0],
      });
    } catch (error) {
      logger.error('Error upserting menu ingredients:', error);
      return ResponseHandler.error(res, {
        message: 'Internal server error',
        statusCode: 500,
      });
    }
  };

  getMenuIngredients = async (req: AuthenticatedRequest, res: Response) => {
    const { menuId } = req.params;

    try {
      const menu = await prisma.menu.findUnique({
        where: { id: menuId },
      });

      if (!menu) {
        return ResponseHandler.error(res, {
          message: 'Menu not found',
          statusCode: 404,
        });
      }

      const menuIngredients = await prisma.menuIngredient.findMany({
        where: { menuId },
        include: {
          ingredient: {
            select: {
              id: true,
              name: true,
              unit: true,
              currentStock: true,
              minimumStock: true,
              status: true,
            },
          },
        },
        orderBy: {
          createdAt: 'desc',
        },
      });

      return ResponseHandler.success(res, {
        message: 'Menu ingredients retrieved successfully',
        data: menuIngredients,
      });
    } catch (error) {
      logger.error('Error getting menu ingredients:', error);
      return ResponseHandler.error(res, {
        message: 'Internal server error',
        statusCode: 500,
      });
    }
  };

  removeIngredientFromMenu = async (req: AuthenticatedRequest, res: Response) => {
    const { menuId, ingredientId } = req.params;

    try {
      const menuIngredient = await prisma.menuIngredient.findFirst({
        where: {
          menuId,
          ingredientId,
        },
      });

      if (!menuIngredient) {
        return ResponseHandler.error(res, {
          message: 'Menu ingredient not found',
          statusCode: 404,
        });
      }

      await prisma.menuIngredient.deleteMany({
        where: {
          menuId,
          ingredientId,
        },
      });

      return ResponseHandler.success(res, {
        message: 'Ingredient removed from menu successfully',
        data: null,
      });
    } catch (error) {
      logger.error('Error removing ingredient from menu:', error);
      return ResponseHandler.error(res, {
        message: 'Internal server error',
        statusCode: 500,
      });
    }
  };
}
