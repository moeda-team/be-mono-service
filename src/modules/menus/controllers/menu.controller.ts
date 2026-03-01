/* eslint-disable @typescript-eslint/no-explicit-any */
import { Request, Response } from 'express';
import { logger } from '../../../utils/common/logger';
import { CreateMenuDTO, UpdateMenuDTO } from '../models/menu';
import { ResponseHandler } from '../../../utils/response/responseHandler';
import { Prisma } from '@prisma/client';
import prisma from '../../../config/database';

export class MenuController {
  getMenuById = async (req: Request, res: Response) => {
    const { id } = req.params;

    try {
      const menu = await prisma.menu.findUnique({
        where: { id },
        include: {
          options: true,
          menuIngredients: {
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
          },
        },
      });

      if (!menu) {
        return ResponseHandler.error(res, {
          message: 'Menu not found',
          statusCode: 404,
        });
      }

      // Check if menu has sufficient ingredients
      const isAvailable = menu.menuIngredients.every(
        mi => mi.ingredient.currentStock >= mi.quantity,
      );

      return ResponseHandler.success(res, {
        message: 'Menu retrieved successfully',
        data: {
          ...menu,
          isAvailable,
        },
      });
    } catch (error) {
      logger.error('Error getting menu:', error);
      return ResponseHandler.error(res, {
        message: 'Internal server error',
        statusCode: 500,
      });
    }
  };

  getAllMenus = async (req: Request, res: Response) => {
    const outletId = req.headers.outletid as string;
    const { search, category } = req.query;
    const page = parseInt(req.query.page as string) || null;
    const limit = parseInt(req.query.limit as string) || null;

    const searchStr = typeof search === 'string' ? search : undefined;
    const categoryStr = typeof category === 'string' ? category : undefined;

    const skip = page && limit ? (page - 1) * limit : undefined;
    const take = limit || undefined;

    try {
      const whereClause: Prisma.MenuWhereInput = {
        outletId,
      };

      if (searchStr) {
        whereClause.name = {
          contains: searchStr,
          mode: 'insensitive',
        };
      }

      if (categoryStr) {
        whereClause.categoryId = categoryStr;
      }

      const now = new Date();

      const menus = await prisma.menu.findMany({
        where: whereClause,
        orderBy: {
          createdAt: 'desc',
        },
        include: {
          options: true,
          bestSellerMenus: true,
          discountMenus: {
            where: {
              discount: {
                NOT: {
                  OR: [
                    {
                      AND: [
                        { maxUsage: { gt: 0 } },
                        {
                          usage: {
                            gte: prisma.discount.fields.maxUsage,
                          },
                        },
                      ],
                    },
                    {
                      expiredAt: {
                        lte: now,
                      },
                    },
                  ],
                },
              },
            },
            select: {
              discountId: true,
              discount: {
                select: {
                  name: true,
                  discount: true,
                  type: true,
                  maxUsage: true,
                },
              },
            },
          },
          menuIngredients: {
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
          },
        },
        skip,
        take,
      });

      const structuredMenus = menus.map(menu => ({
        ...menu,
        isAvailable: menu.menuIngredients.every(mi => mi.ingredient.currentStock >= mi.quantity),
      }));

      if (page && limit) {
        const total = await prisma.menu.count({ where: whereClause });
        return ResponseHandler.success(res, {
          message: 'Menus retrieved successfully',
          data: structuredMenus,
          pagination: {
            page,
            limit,
            total,
            totalPages: Math.ceil(total / limit),
          },
        });
      }

      return ResponseHandler.success(res, {
        message: 'Menus retrieved successfully',
        data: structuredMenus,
      });
    } catch (error) {
      logger.error('Error getting menus:', error);
      return ResponseHandler.error(res, {
        message: 'Internal server error',
        statusCode: 500,
      });
    }
  };

  async createMenu(req: Request, res: Response) {
    const menuData: CreateMenuDTO = req.body;

    const user = (req as Request & { user?: { outletId: string } }).user;
    const outletId = user?.outletId || menuData.outletId;

    try {
      const category = await prisma.category.findUnique({
        where: { id: menuData.categoryId },
      });
      if (!category) {
        return ResponseHandler.error(res, {
          message: 'Category not found',
          statusCode: 404,
        });
      }

      const menu = await prisma.menu.create({
        data: {
          outletId,
          categoryId: menuData.categoryId,
          name: menuData.name,
          desc: menuData.desc,
          img: menuData.img,
          price: menuData.price,
          pdf: menuData.pdf,
          isActive: menuData.isActive ?? true,
        },
      });
      return ResponseHandler.success(res, {
        message: 'Menu created successfully',
        data: menu,
      });
    } catch (error) {
      logger.error('Error creating menu:', error);
      return ResponseHandler.error(res, {
        message: 'Internal server error',
        statusCode: 500,
      });
    }
  }

  async updateMenu(req: Request, res: Response) {
    const { id } = req.params;
    const menuData: UpdateMenuDTO = req.body;

    const user = (req as Request & { user?: { outletId: string } }).user;
    const outletId = user?.outletId;

    try {
      const menu = await prisma.menu.findUnique({
        where: { id, outletId },
      });
      if (!menu) {
        return ResponseHandler.error(res, {
          message: 'Menu not found',
          statusCode: 404,
        });
      }

      if (menuData.categoryId) {
        const category = await prisma.category.findUnique({
          where: { id: menuData.categoryId },
        });
        if (!category) {
          return ResponseHandler.error(res, {
            message: 'Category not found',
            statusCode: 404,
          });
        }
      }

      const updatedMenu = await prisma.menu.update({
        where: { id, outletId },
        data: {
          ...(menuData.categoryId && { categoryId: menuData.categoryId }),
          ...(menuData.name && { name: menuData.name }),
          ...(menuData.desc !== undefined && { desc: menuData.desc }),
          ...(menuData.img && { img: menuData.img }),
          ...(menuData.price !== undefined && { price: menuData.price }),
          ...(menuData.pdf !== undefined && { pdf: menuData.pdf }),
          ...(menuData.isActive !== undefined && { isActive: menuData.isActive }),
        },
      });

      return ResponseHandler.success(res, {
        message: 'Menu updated successfully',
        data: updatedMenu,
      });
    } catch (error) {
      logger.error('Error updating menu:', error);
      return ResponseHandler.error(res, {
        message: 'Internal server error',
        statusCode: 500,
      });
    }
  }

  async deleteMenu(req: Request, res: Response) {
    const { id } = req.params;

    const user = (req as Request & { user?: { outletId: string } }).user;
    const outletId = user?.outletId;

    try {
      const menu = await prisma.menu.findUnique({
        where: { id, outletId },
      });
      if (!menu) {
        return ResponseHandler.error(res, {
          message: 'Menu not found',
          statusCode: 404,
        });
      }

      // Check if menu is being used in transactions
      const transactionCount = await prisma.subTransaction.count({
        where: {
          menuId: id,
          transaction: {
            outletId,
          },
        },
      });

      if (transactionCount > 0) {
        return ResponseHandler.error(res, {
          message: 'Cannot delete menu that is being used in transactions',
          statusCode: 400,
        });
      }

      await prisma.menu.delete({
        where: { id, outletId },
      });

      return ResponseHandler.success(res, {
        message: 'Menu deleted successfully',
        data: null,
      });
    } catch (error) {
      if (error instanceof Error && 'code' in error && error.code === 'P2025') {
        return ResponseHandler.error(res, {
          message: 'Menu not found',
          statusCode: 404,
        });
      }
      logger.error('Error deleting menu:', error);
      return ResponseHandler.error(res, {
        message: 'Internal server error',
        statusCode: 500,
      });
    }
  }
}
