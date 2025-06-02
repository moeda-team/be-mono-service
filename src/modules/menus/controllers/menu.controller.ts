import { Request, Response } from 'express';
import { logger } from '../../../utils/common/logger';
import { CreateMenuDTO, UpdateMenuDTO } from '../models/menu';
import { ResponseHandler } from '../../../utils/response/responseHandler';
import prisma from '../../../lib/prisma';

export class MenuController {
  async getAllMenus(req: Request, res: Response) {
    const { outletId } = req.params;

    try {
      const menus = await prisma.menu.findMany({
        where: { outletId },
        orderBy: {
          createdAt: 'desc',
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

      return ResponseHandler.success(res, {
        message: 'Menu retrieved successfully',
        data: menu,
      });
    } catch (error) {
      logger.error('Error getting menu:', error);
      return ResponseHandler.error(res, {
        message: 'Internal server error',
        statusCode: 500,
      });
    }
  }

  async getMenusByCategory(req: Request, res: Response) {
    const { outletId, categoryId } = req.params;

    try {
      const menus = await prisma.menu.findMany({
        where: { categoryId, outletId },
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

  async createMenu(req: Request, res: Response) {
    const menuData: CreateMenuDTO = req.body;
    logger.info('Menu data:', menuData);

    const user = (req as Request & { user?: { outletId: string } }).user;
    const outletId = user?.outletId;

    try {
      const menu = await prisma.menu.create({
        data: {
          outletId,
          categoryId: menuData.categoryId,
          name: menuData.name,
          desc: menuData.desc,
          img: menuData.img,
          price: menuData.price,
          pdf: menuData.pdf,
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

  async getBestMenus(req: Request, res: Response) {
    const { outletId } = req.params;

    try {
      const menus = await prisma.menu.findMany({
        where: { outletId, isBest: true },
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
}
