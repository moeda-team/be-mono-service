import { Request, Response } from 'express';
import { logger } from '../../../utils/common/logger';
import { CreateBestSellerMenuDTO } from '../models/best-seller-menu';
import { ResponseHandler } from '../../../utils/response/responseHandler';
import prisma from '../../../lib/prisma';
import { MenuService } from '../../../services/menu.service';

const menuService = new MenuService();

export class BestSellerMenuController {
  getAllBestSellerMenus = async (req: Request, res: Response) => {
    const outletId = req.headers.outletid as string;

    try {
      const now = new Date();

      const bestSellerMenus = await prisma.bestSellerMenu.findMany({
        where: {
          menu: {
            outletId,
          },
        },
        orderBy: {
          order: 'asc',
        },
        include: {
          menu: {
            include: {
              options: {
                orderBy: { order: 'asc' },
              },
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
            },
          },
        },
      });

      const structured = bestSellerMenus.map(item => ({
        ...item,
        menu: {
          ...item.menu,
          options: menuService.BuildOptionTree(item.menu.options),
        },
      }));

      return ResponseHandler.success(res, {
        message: 'Best seller menus retrieved successfully',
        data: structured,
      });
    } catch (error) {
      logger.error('Error getting best seller menus:', error);
      return ResponseHandler.error(res, {
        message: 'Internal server error',
        statusCode: 500,
      });
    }
  };
  getBestSellerMenuById = async (req: Request, res: Response) => {
    const { id } = req.params;
    const outletId = req.headers.outletid as string;

    try {
      const bestSellerMenu = await prisma.bestSellerMenu.findUnique({
        where: { id },
        include: {
          menu: {
            include: {
              options: {
                orderBy: { order: 'asc' },
              },
            },
          },
        },
      });

      if (!bestSellerMenu) {
        return ResponseHandler.error(res, {
          message: 'Best seller menu not found',
          statusCode: 404,
        });
      }

      if (bestSellerMenu.menu.outletId !== outletId) {
        return ResponseHandler.error(res, {
          message: 'Best seller menu not found',
          statusCode: 404,
        });
      }

      const structured = {
        ...bestSellerMenu,
        menu: {
          ...bestSellerMenu.menu,
          options: menuService.BuildOptionTree(bestSellerMenu.menu.options),
        },
      };

      return ResponseHandler.success(res, {
        message: 'Best seller menu retrieved successfully',
        data: structured,
      });
    } catch (error) {
      logger.error('Error getting best seller menu:', error);
      return ResponseHandler.error(res, {
        message: 'Internal server error',
        statusCode: 500,
      });
    }
  };

  async createBestSellerMenu(req: Request, res: Response) {
    const bestSellerMenuData: CreateBestSellerMenuDTO = req.body;
    const outletId = req.headers.Outletid as string;

    try {
      const menu = await prisma.menu.findUnique({
        where: { id: bestSellerMenuData.menuId, outletId },
      });

      if (!menu) {
        return ResponseHandler.error(res, {
          message: 'Menu not found',
          statusCode: 404,
        });
      }

      const existingBestSeller = await prisma.bestSellerMenu.findFirst({
        where: { menuId: bestSellerMenuData.menuId },
      });

      if (existingBestSeller) {
        return ResponseHandler.error(res, {
          message: 'Menu is already in best seller list',
          statusCode: 400,
        });
      }

      const maxOrder = await prisma.bestSellerMenu.findFirst({
        where: {
          menu: {
            outletId,
          },
        },
        orderBy: {
          order: 'desc',
        },
        select: {
          order: true,
        },
      });

      const order = bestSellerMenuData.order ?? (maxOrder ? maxOrder.order + 1 : 0);

      const bestSellerMenu = await prisma.bestSellerMenu.create({
        data: {
          menuId: bestSellerMenuData.menuId,
          order,
        },
        include: {
          menu: {
            select: {
              id: true,
              name: true,
              desc: true,
              img: true,
              price: true,
              isActive: true,
            },
          },
        },
      });

      return ResponseHandler.success(res, {
        message: 'Best seller menu created successfully',
        data: bestSellerMenu,
      });
    } catch (error) {
      logger.error('Error creating best seller menu:', error);
      return ResponseHandler.error(res, {
        message: 'Internal server error',
        statusCode: 500,
      });
    }
  }

  async deleteBestSellerMenu(req: Request, res: Response) {
    const { id } = req.params;
    const outletId = (req.headers.Outletid as string) || (req.headers.outletid as string);

    try {
      const bestSellerMenu = await prisma.bestSellerMenu.findUnique({
        where: { id },
        include: {
          menu: true,
        },
      });

      if (!bestSellerMenu) {
        return ResponseHandler.error(res, {
          message: 'Best seller menu not found',
          statusCode: 404,
        });
      }

      if (bestSellerMenu.menu.outletId !== outletId) {
        return ResponseHandler.error(res, {
          message: 'Best seller menu not found',
          statusCode: 404,
        });
      }

      await prisma.bestSellerMenu.delete({
        where: { id },
      });

      return ResponseHandler.success(res, {
        message: 'Best seller menu deleted successfully',
        data: null,
      });
    } catch (error) {
      if (error instanceof Error && 'code' in error && error.code === 'P2025') {
        return ResponseHandler.error(res, {
          message: 'Best seller menu not found',
          statusCode: 404,
        });
      }
      logger.error('Error deleting best seller menu:', error);
      return ResponseHandler.error(res, {
        message: 'Internal server error',
        statusCode: 500,
      });
    }
  }
}
