/* eslint-disable @typescript-eslint/no-explicit-any */
import { Request, Response } from 'express';
import { logger } from '../../../utils/common/logger';
import { CreateMenuDTO, UpdateMenuDTO } from '../models/menu';
import { ResponseHandler } from '../../../utils/response/responseHandler';
import { Prisma } from '@prisma/client';
import prisma from '../../../lib/prisma';

export class MenuController {
  async getAllMenus(req: Request, res: Response) {
    const { outletId } = req.params;
    const { search, best, category } = req.query;

    const searchStr: string | undefined = typeof search === 'string' ? search : undefined;
    const categoryStr: string | undefined = typeof category === 'string' ? category : undefined;
    const bestFlag: boolean | undefined = typeof best === 'string' ? best === 'true' : undefined;

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

      if (bestFlag !== undefined) {
        whereClause.isBest = bestFlag;
      }

      if (categoryStr) {
        whereClause.categoryId = categoryStr;
      }

      const now = new Date();

      const menus = await prisma.menu.findMany({
        where: {
          outletId: '17832ff5-2965-4cda-ab08-16d1311a91d1',
        },
        orderBy: {
          createdAt: 'desc',
        },
        include: {
          vouchers: {
            where: {
              voucher: {
                NOT: {
                  OR: [
                    {
                      AND: [
                        { maxUsage: { gt: 0 } },
                        {
                          usage: {
                            gte: prisma.voucher.fields.maxUsage,
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
              voucherId: true,
              voucher: {
                select: {
                  name: true,
                  discount: true,
                  type: true,
                  maxUsage: true,
                },
              },
            },
          },
        },
      });

      return ResponseHandler.success(res, {
        message: 'Menus retrieved successfully',
        data: menus,
      });
    } catch (error) {
      logger.error('Error getting menus:', error);
      return ResponseHandler.error(res, {
        message: 'Internal server error',
        statusCode: 500,
      });
    }
  }

  async getMenuById(req: Request, res: Response) {
    const { id } = req.params;

    try {
      const menu = await prisma.menu.findUnique({
        where: { id },
      });
      if (!menu) {
        return ResponseHandler.error(res, {
          message: 'Menu not found',
          statusCode: 404,
        });
      }

      const options = menu.options;
      const listOption = await prisma.option.findMany({
        where: {
          id: {
            in: options,
          },
        },
        orderBy: {
          updatedAt: 'desc',
        },
        select: {
          id: true,
          name: true,
          value: true,
          addPrices: true,
        },
      });
      if (listOption.length !== options.length) {
        return ResponseHandler.error(res, {
          message: 'One or more options not found',
          statusCode: 404,
        });
      }
      const response = {
        ...menu,
        options: listOption,
      };

      return ResponseHandler.success(res, {
        message: 'Menu retrieved successfully',
        data: response,
      });
    } catch (error) {
      logger.error('Error getting menu:', error);
      return ResponseHandler.error(res, {
        message: 'Internal server error',
        statusCode: 500,
      });
    }
  }

  async createMenu(req: Request, res: Response) {
    const menuData: CreateMenuDTO = req.body;

    const user = (req as Request & { user?: { outletId: string } }).user;
    const outletId = user?.outletId;

    if ((prisma as any).option?.findUnique) {
      for (const option of menuData.options) {
        const checkOption = await (prisma as any).option.findUnique({
          where: { id: option },
        });
        if (!checkOption) {
          return ResponseHandler.error(res, {
            message: `Option ${option} not found, failed to create menu`,
            statusCode: 404,
          });
        }
      }
    }

    const sortedOptions = menuData.options.sort((a, b) => {
      const optionA = a.toLowerCase();
      const optionB = b.toLowerCase();
      if (optionA < optionB) return -1;
      if (optionA > optionB) return 1;
      return 0;
    });

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
          options: sortedOptions,
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

      const category = await prisma.category.findUnique({
        where: { id: menuData.categoryId },
      });
      if (!category) {
        return ResponseHandler.error(res, {
          message: 'Category not found',
          statusCode: 404,
        });
      }

      const updatedMenu = await prisma.menu.update({
        where: { id, outletId },
        data: {
          outletId,
          categoryId: menuData.categoryId,
          name: menuData.name,
          desc: menuData.desc,
          img: menuData.img,
          price: menuData.price,
          pdf: menuData.pdf,
          options: menuData.options,
          isActive: menuData.isActive,
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
