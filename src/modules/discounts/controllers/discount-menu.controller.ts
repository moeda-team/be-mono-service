import { Request, Response } from 'express';
import { logger } from '../../../utils/common/logger';
import { CreateDiscountMenuDTO, UpdateDiscountMenuDTO } from '../models/discount-menu';
import { ResponseHandler } from '../../../utils/response/responseHandler';
import prisma from '../../../config/database';
import { resolveOutletForWrite } from '../../../utils/auth/outletAccess';

export class DiscountMenuController {
  async createDiscountMenu(req: Request, res: Response) {
    const user = (req as Request & { user: { outletId?: string; role?: string } }).user;
    const outletId = resolveOutletForWrite(user, req.query.outletId as string | undefined);
    const discountMenuData: CreateDiscountMenuDTO = req.body;

    try {
      if (!outletId) {
        return ResponseHandler.error(res, {
          message: 'Outlet not found',
          statusCode: 404,
        });
      }

      // Check if discount exists and belongs to user's outlet
      const discount = await prisma.discount.findFirst({
        where: { id: discountMenuData.discountId, outletId },
      });

      if (!discount) {
        return ResponseHandler.error(res, {
          message: 'Discount not found or access denied',
          statusCode: 404,
        });
      }

      // Check if menus exist and belong to user's outlet
      const menus = await prisma.menu.findMany({
        where: {
          id: { in: discountMenuData.menuId },
          outletId,
        },
      });

      if (menus.length !== discountMenuData.menuId.length) {
        return ResponseHandler.error(res, {
          message: 'One or more menus not found or access denied',
          statusCode: 404,
        });
      }

      // Check for existing discount menus
      const existingDiscountMenus = await prisma.discountMenu.findMany({
        where: {
          discountId: discountMenuData.discountId,
          menuId: { in: discountMenuData.menuId },
        },
      });

      // Separate new and existing menus
      const existingMenuIds: string[] = existingDiscountMenus.map(dm => dm.menuId);
      const newMenuIds: string[] = discountMenuData.menuId.filter(
        menuId => !existingMenuIds.includes(menuId),
      );

      let createdDiscountMenus: any[] = [];
      let updatedDiscountMenus: any[] = [];

      // Create new discount menus
      if (newMenuIds.length > 0) {
        await prisma.discountMenu.createMany({
          data: newMenuIds.map(menuId => ({
            discountId: discountMenuData.discountId,
            menuId,
          })),
        });

        // Fetch the created discount menus with relations
        createdDiscountMenus = await prisma.discountMenu.findMany({
          where: {
            discountId: discountMenuData.discountId,
            menuId: { in: newMenuIds },
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
      }

      // Fetch existing discount menus with relations
      if (existingMenuIds.length > 0) {
        updatedDiscountMenus = await prisma.discountMenu.findMany({
          where: {
            discountId: discountMenuData.discountId,
            menuId: { in: existingMenuIds },
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
      }

      const message =
        newMenuIds.length > 0
          ? `${newMenuIds.length} discount menu(s) created successfully${existingMenuIds.length > 0 ? `, ${existingMenuIds.length} already existed` : ''}`
          : `All discount menus already exist`;

      return ResponseHandler.success(res, {
        message,
        data: {
          created: createdDiscountMenus,
          existing: updatedDiscountMenus,
          total: discountMenuData.menuId.length,
        },
      });
    } catch (error) {
      logger.error('Error creating discount menu:', error);
      return ResponseHandler.error(res, {
        message: 'Internal server error',
        statusCode: 500,
      });
    }
  }

  async updateDiscountMenu(req: Request, res: Response) {
    const user = (req as Request & { user: { outletId?: string; role?: string } }).user;
    const outletId = resolveOutletForWrite(user, req.query.outletId as string | undefined);
    const { discountId, menuId } = req.params;
    const discountMenuData: UpdateDiscountMenuDTO = req.body;

    try {
      if (!outletId) {
        return ResponseHandler.error(res, {
          message: 'Outlet not found',
          statusCode: 404,
        });
      }

      // Find existing discount menu
      const existingDiscountMenu = await prisma.discountMenu.findUnique({
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

      if (!existingDiscountMenu) {
        return ResponseHandler.error(res, {
          message: 'Discount menu not found',
          statusCode: 404,
        });
      }

      if (existingDiscountMenu.discount?.outletId !== outletId) {
        return ResponseHandler.error(res, {
          message: 'Access denied',
          statusCode: 403,
        });
      }

      // Validate new discountId if provided
      if (discountMenuData.discountId) {
        const newDiscount = await prisma.discount.findFirst({
          where: { id: discountMenuData.discountId, outletId },
        });

        if (!newDiscount) {
          return ResponseHandler.error(res, {
            message: 'New discount not found or access denied',
            statusCode: 404,
          });
        }
      }

      // Validate new menuId if provided
      if (discountMenuData.menuId && discountMenuData.menuId.length > 0) {
        const menus = await prisma.menu.findMany({
          where: {
            id: { in: discountMenuData.menuId },
            outletId,
          },
        });

        if (menus.length !== discountMenuData.menuId.length) {
          return ResponseHandler.error(res, {
            message: 'One or more menus not found or access denied',
            statusCode: 404,
          });
        }
      }

      // Delete the existing discount menu
      await prisma.discountMenu.delete({
        where: {
          discountId_menuId: {
            discountId,
            menuId,
          },
        },
      });

      // Create new discount menu associations if menuId array is provided
      let updatedDiscountMenus: any[] = [];
      if (discountMenuData.menuId && discountMenuData.menuId.length > 0) {
        const newDiscountId = discountMenuData.discountId || discountId;

        await prisma.discountMenu.createMany({
          data: discountMenuData.menuId.map(newMenuId => ({
            discountId: newDiscountId,
            menuId: newMenuId,
          })),
        });

        // Fetch the created discount menus with relations
        updatedDiscountMenus = await prisma.discountMenu.findMany({
          where: {
            discountId: newDiscountId,
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
      }

      return ResponseHandler.success(res, {
        message: 'Discount menu updated successfully',
        data: {
          deleted: existingDiscountMenu,
          created: updatedDiscountMenus,
        },
      });
    } catch (error) {
      logger.error('Error updating discount menu:', error);
      return ResponseHandler.error(res, {
        message: 'Internal server error',
        statusCode: 500,
      });
    }
  }

  async deleteDiscountMenu(req: Request, res: Response) {
    const user = (req as Request & { user: { outletId?: string; role?: string } }).user;
    const outletId = resolveOutletForWrite(user, req.query.outletId as string | undefined);
    const { discountId, menuId } = req.params;

    try {
      if (!outletId) {
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

      if (discountMenu.discount?.outletId !== outletId) {
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
