import { Request, Response } from 'express';
import { logger } from '../../../utils/common/logger';
import { CreateDiscountDTO, UpdateDiscountDTO } from '../models/discount';
import { ResponseHandler } from '../../../utils/response/responseHandler';
import prisma from '../../../config/database';
import { Prisma } from '@prisma/client';
import { resolveOutletFilter, resolveOutletForWrite } from '../../../utils/auth/outletAccess';

export class DiscountController {
  async getAllDiscounts(req: Request, res: Response) {
    const user = (req as Request & { user: { outletId?: string; role?: string } }).user;
    const outletId = resolveOutletFilter(user, req.query.outletId as string | undefined);

    const { search } = req.query as { search: string };
    const page = parseInt(req.query.page as string) || null;
    const limit = parseInt(req.query.limit as string) || null;

    const searchStr: string | undefined = typeof search === 'string' ? search : undefined;
    const skip = page && limit ? (page - 1) * limit : undefined;
    const take = limit || undefined;

    try {
      const whereClause: Prisma.DiscountWhereInput = {
        outletId,
      };

      if (searchStr) {
        whereClause.OR = [
          {
            name: {
              contains: searchStr,
              mode: 'insensitive',
            },
          },
          {
            description: {
              contains: searchStr,
              mode: 'insensitive',
            },
          },
        ];
      }

      const discounts = await prisma.discount.findMany({
        where: whereClause,
        orderBy: {
          createdAt: 'asc',
        },
        include: {
          discountMenus: {
            include: {
              menu: true,
            },
          },
        },
        skip,
        take,
      });

      if (page && limit) {
        const total = await prisma.discount.count({ where: whereClause });
        return ResponseHandler.success(res, {
          message: 'Discounts retrieved successfully',
          data: discounts,
          pagination: {
            page,
            limit,
            total,
            totalPages: Math.ceil(total / limit),
          },
        });
      }

      return ResponseHandler.success(res, {
        message: 'Discounts retrieved successfully',
        data: discounts,
      });
    } catch (error) {
      logger.error('Error getting discounts:', error);
      return ResponseHandler.error(res, {
        message: 'Internal server error',
        statusCode: 500,
      });
    }
  }

  async getDiscountByName(req: Request, res: Response) {
    const { code } = req.params;
    const { user } = req as Request & { user?: { outletId?: string; role?: string } };
    const outletId = resolveOutletFilter(user, req.query.outletId as string | undefined);

    try {
      const discount = await prisma.discount.findFirst({
        where: { name: code, ...(outletId ? { outletId } : {}) },
      });
      if (!discount) {
        return ResponseHandler.error(res, {
          message: 'Discount not found',
          statusCode: 404,
        });
      }

      return ResponseHandler.success(res, {
        message: 'Discount retrieved successfully',
        data: discount,
      });
    } catch (error) {
      logger.error('Error getting discount:', error);
      return ResponseHandler.error(res, {
        message: 'Internal server error',
        statusCode: 500,
      });
    }
  }

  async createDiscount(req: Request, res: Response) {
    const user = (req as Request & { user: { outletId?: string; role?: string } }).user;
    const outletId = resolveOutletForWrite(user, req.query.outletId as string | undefined);
    const discountData: CreateDiscountDTO = req.body;

    try {
      if (!outletId) {
        return ResponseHandler.error(res, {
          message: 'Outlet not found',
          statusCode: 404,
        });
      }

      const findDiscount = await prisma.discount.findFirst({
        where: { name: discountData.name, outletId },
      });
      if (findDiscount) {
        return ResponseHandler.error(res, {
          message: 'Discount already exists',
          statusCode: 400,
        });
      }

      const discount = await prisma.discount.create({
        data: {
          outletId,
          name: discountData.name,
          description: discountData.description,
          type: discountData.type,
          discount: Number(discountData.discount),
          usage: 0,
          maxUsage: Number(discountData.maxUsage),
          allMenu: discountData.allMenu,
          expiredAt: new Date(discountData.expiredAt),
        },
      });

      return ResponseHandler.success(res, {
        message: 'Discount created successfully',
        data: discount,
      });
    } catch (error) {
      logger.error('Error creating discount:', error);
      return ResponseHandler.error(res, {
        message: 'Internal server error',
        statusCode: 500,
      });
    }
  }

  async updateDiscount(req: Request, res: Response) {
    const user = (req as Request & { user: { outletId?: string; role?: string } }).user;
    const outletId = resolveOutletForWrite(user, req.query.outletId as string | undefined);
    const { id } = req.params;
    const discountData: UpdateDiscountDTO = req.body;

    try {
      if (!outletId) {
        return ResponseHandler.error(res, {
          message: 'Outlet not found',
          statusCode: 404,
        });
      }

      const findDiscount = await prisma.discount.findUnique({
        where: { id, outletId },
      });
      if (!findDiscount) {
        return ResponseHandler.error(res, {
          message: 'Discount not found',
          statusCode: 404,
        });
      }

      const discount = await prisma.discount.update({
        where: { id, outletId },
        data: {
          name: discountData.name,
          description: discountData.description,
          type: discountData.type,
          discount: discountData.discount ? Number(discountData.discount) : undefined,
          maxUsage: discountData.maxUsage ? Number(discountData.maxUsage) : undefined,
          allMenu: discountData.allMenu,
          expiredAt: discountData.expiredAt ? new Date(discountData.expiredAt) : undefined,
        },
      });

      return ResponseHandler.success(res, {
        message: 'Discount updated successfully',
        data: discount,
      });
    } catch (error) {
      logger.error('Error updating discount:', error);
      return ResponseHandler.error(res, {
        message: 'Internal server error',
        statusCode: 500,
      });
    }
  }

  async deleteDiscount(req: Request, res: Response) {
    const user = (req as Request & { user: { outletId?: string; role?: string } }).user;
    const outletId = resolveOutletForWrite(user, req.query.outletId as string | undefined);
    const { id } = req.params;

    try {
      if (!outletId) {
        return ResponseHandler.error(res, {
          message: 'Outlet not found',
          statusCode: 404,
        });
      }

      const findDiscount = await prisma.discount.findUnique({
        where: { id, outletId },
      });
      if (!findDiscount) {
        return ResponseHandler.error(res, {
          message: 'Discount not found',
          statusCode: 404,
        });
      }

      const discount = await prisma.discount.delete({
        where: { id, outletId },
      });

      return ResponseHandler.success(res, {
        message: 'Discount deleted successfully',
        data: discount,
      });
    } catch (error) {
      logger.error('Error deleting discount:', error);
      return ResponseHandler.error(res, {
        message: 'Internal server error',
        statusCode: 500,
      });
    }
  }
}
