import { Request, Response } from 'express';
import { logger } from '../../../utils/common/logger';
import { CreateVoucherMenuDTO, UpdateVoucherMenuDTO } from '../models/voucher-menu';
import { ResponseHandler } from '../../../utils/response/responseHandler';
import prisma from '../../../config/database';

export class VoucherMenuController {
  async createVoucherMenu(req: Request, res: Response) {
    const user = (req as Request & { user: { outletId: string } }).user;
    const voucherMenuData: CreateVoucherMenuDTO = req.body;

    try {
      if (!user.outletId) {
        return ResponseHandler.error(res, {
          message: 'Outlet not found',
          statusCode: 404,
        });
      }

      // Check if voucher exists and belongs to user's outlet
      const voucher = await prisma.voucher.findUnique({
        where: { id: voucherMenuData.voucherId },
      });

      if (!voucher || voucher.outletId !== user.outletId) {
        return ResponseHandler.error(res, {
          message: 'Voucher not found or access denied',
          statusCode: 404,
        });
      }

      // Check if menus exist and belong to user's outlet
      const menus = await prisma.menu.findMany({
        where: {
          id: { in: voucherMenuData.menuId },
          outletId: user.outletId,
        },
      });

      if (menus.length !== voucherMenuData.menuId.length) {
        return ResponseHandler.error(res, {
          message: 'One or more menus not found or access denied',
          statusCode: 404,
        });
      }

      // Check if voucher menus already exist
      const existingVoucherMenus = await prisma.voucherMenu.findMany({
        where: {
          voucherId: voucherMenuData.voucherId,
          menuId: { in: voucherMenuData.menuId },
        },
      });

      if (existingVoucherMenus.length > 0) {
        return ResponseHandler.error(res, {
          message: 'One or more voucher menus already exist',
          statusCode: 400,
        });
      }

      // Create voucher menus for all menu IDs
      const voucherMenus = await prisma.voucherMenu.createMany({
        data: voucherMenuData.menuId.map(menuId => ({
          voucherId: voucherMenuData.voucherId,
          menuId,
        })),
      });

      // Fetch the created voucher menus with relations
      const createdVoucherMenus = await prisma.voucherMenu.findMany({
        where: {
          voucherId: voucherMenuData.voucherId,
          menuId: { in: voucherMenuData.menuId },
        },
        include: {
          voucher: {
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
        message: `${voucherMenus.count} voucher menu(s) created successfully`,
        data: createdVoucherMenus,
      });
    } catch (error) {
      logger.error('Error creating voucher menu:', error);
      return ResponseHandler.error(res, {
        message: 'Internal server error',
        statusCode: 500,
      });
    }
  }

  async deleteVoucherMenu(req: Request, res: Response) {
    const user = (req as Request & { user: { outletId: string } }).user;
    const { voucherId, menuId } = req.params;

    try {
      if (!user.outletId) {
        return ResponseHandler.error(res, {
          message: 'Outlet not found',
          statusCode: 404,
        });
      }

      const voucherMenu = await prisma.voucherMenu.findUnique({
        where: {
          voucherId_menuId: {
            voucherId,
            menuId,
          },
        },
        include: {
          voucher: true,
        },
      });

      if (!voucherMenu) {
        return ResponseHandler.error(res, {
          message: 'Voucher menu not found',
          statusCode: 404,
        });
      }

      if (voucherMenu.voucher?.outletId !== user.outletId) {
        return ResponseHandler.error(res, {
          message: 'Access denied',
          statusCode: 403,
        });
      }

      await prisma.voucherMenu.delete({
        where: {
          voucherId_menuId: {
            voucherId,
            menuId,
          },
        },
      });

      return ResponseHandler.success(res, {
        message: 'Voucher menu deleted successfully',
        data: voucherMenu,
      });
    } catch (error) {
      logger.error('Error deleting voucher menu:', error);
      return ResponseHandler.error(res, {
        message: 'Internal server error',
        statusCode: 500,
      });
    }
  }
}
