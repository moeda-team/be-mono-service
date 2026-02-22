import { Request, Response } from 'express';
import { logger } from '../../../utils/common/logger';
import { CreateDiscountMenuDTO, UpdateDiscountMenuDTO } from '../models/discount-menu';
import { ResponseHandler } from '../../../utils/response/responseHandler';
import prisma from '../../../lib/prisma';

export class DiscountMenuController {
  async createDiscountMenu(req: Request, res: Response) {
    const user = (req as Request & { user: { outletId: string } }).user;
    const discountMenuData: CreateDiscountMenuDTO = req.body;

    try {
      if (!user.outletId) {
        return ResponseHandler.error(res, {
          message: 'Outlet not found',
          statusCode: 404,
        });
      }

      // Check if discount exists and belongs to user's outlet
      const discount = await prisma.discount.findUnique({
        where: { id: discountMenuData.discountId },
      });

      if (!discount || discount.outletId !== user.outletId) {
        return ResponseHandler.error(res, {
          message: 'Discount not found or access denied',
          statusCode: 404,
        });
      }

      // Check if menus exist and belong to user's outlet
      const menus = await prisma.menu.findMany({
        where: {
          id: { in: discountMenuData.menuId },
          outletId: user.outletId,
        },
      });

      if (menus.length !== discountMenuData.menuId.length) {
        return ResponseHandler.error(res, {
          message: 'One or more menus not found or access denied',
          statusCode: 404,
        });
      }

      // Check if discount menus already exist
      const existingDiscountMenus = await prisma.discountMenu.findMany({
        where: {
          discountId: discountMenuData.discountId,
          menuId: { in: discountMenuData.menuId },
        },
      });

      if (existingDiscountMenus.length > 0) {
        return ResponseHandler.error(res, {
          message: 'One or more discount menus already exist',
          statusCode: 400,
        });
      }

      // Create discount menus for all menu IDs
      const discountMenus = await prisma.discountMenu.createMany({
        data: discountMenuData.menuId.map(menuId => ({
          discountId: discountMenuData.discountId,
          menuId,
        })),
      });

      // Fetch the created discount menus with relations
      const createdDiscountMenus = await prisma.discountMenu.findMany({
        where: {
          discountId: discountMenuData.discountId,
          menuId: { in: discountMenuData.menuId },
        },
        include: {
          discount: {
            select: {
              id: true,
              name: true,
              description: true,
              type: true,
              discount: true,
              usage: true,
              maxUsage: true,
              expiredAt: true,
              outletId: true,
            },
          },
          menu: {
            select: {
              id: true,
              name: true,
              price: true,
              categoryId: true,
            },
          },
        },
      });

      return ResponseHandler.success(res, {
        message: `${discountMenus.count} discount menu(s) created successfully`,
        data: createdDiscountMenus,
      });
    } catch (error) {
      logger.error('Error creating discount menu:', error);
      return ResponseHandler.error(res, {
        message: 'Internal server error',
        statusCode: 500,
      });
    }
  }

  async deleteDiscountMenu(req: Request, res: Response) {
    const user = (req as Request & { user: { outletId: string } }).user;
    const { discountId, menuId } = req.params;

    try {
      if (!user.outletId) {
        return ResponseHandler.error(res, {
          message: 'Outlet not found',
          statusCode: 404,
        });
      }

      const discountMenu = await prisma.discountMenu.findUnique({
        where: {
          discountId_menuId: {
            discountId,
            menuId,
          },
        },
        include: {
          discount: true,
        },
      });

      if (!discountMenu) {
        return ResponseHandler.error(res, {
          message: 'Discount menu not found',
          statusCode: 404,
        });
      }

      if (discountMenu.discount?.outletId !== user.outletId) {
        return ResponseHandler.error(res, {
          message: 'Access denied',
          statusCode: 403,
        });
      }

      await prisma.discountMenu.delete({
        where: {
          discountId_menuId: {
            discountId,
            menuId,
          },
        },
      });

      return ResponseHandler.success(res, {
        message: 'Discount menu deleted successfully',
        data: discountMenu,
      });
    } catch (error) {
      logger.error('Error deleting discount menu:', error);
      return ResponseHandler.error(res, {
        message: 'Internal server error',
        statusCode: 500,
      });
    }
  }
}
