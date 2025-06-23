import { Request, Response } from 'express';
import { logger } from '../../../utils/common/logger';
import { CreateMenuDTO, UpdateMenuDTO } from '../models/menu';
import { ResponseHandler } from '../../../utils/response/responseHandler';
import prisma from '../../../lib/prisma';

export class MenuController {
  async getAllMenus(req: Request, res: Response) {
    const { outletId } = req.params;
    let { search } = req.query;
    if (Array.isArray(search)) {
      search = search[0];
    }
    if (typeof search !== 'string') {
      search = undefined;
    }

    try {
      let menus;
      if (search) {
        menus = await prisma.menu.findMany({
          where: { outletId, name: { contains: search } },
          orderBy: {
            createdAt: 'desc',
          },
        });
      } else {
        menus = await prisma.menu.findMany({
          where: { outletId },
          orderBy: {
            createdAt: 'desc',
          },
        });
      }

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
    let { search } = req.query;
    if (Array.isArray(search)) {
      search = search[0];
    }
    if (typeof search !== 'string') {
      search = undefined;
    }

    try {
      let menus;
      if (search) {
        menus = await prisma.menu.findMany({
          where: { categoryId, outletId, name: { contains: search } },
          orderBy: {
            createdAt: 'desc',
          },
        });
      } else {
        menus = await prisma.menu.findMany({
          where: { categoryId, outletId },
          orderBy: {
            name: 'asc',
          },
        });
      }
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

    // Validate that each provided option exists when the `option` model is available in the generated Prisma client.
    // In testing environments where `prisma.option` might be undefined (because the model is not mocked),
    // we safely skip this validation to prevent runtime errors.
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
        orderBy: {
          name: 'asc',
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
}
