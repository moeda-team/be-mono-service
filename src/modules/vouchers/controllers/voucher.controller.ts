import { Request, Response } from 'express';
import { logger } from '../../../utils/common/logger';
import { CreateVoucherDTO } from '../models/voucher';
import { ResponseHandler } from '../../../utils/response/responseHandler';
import prisma from '../../../config/database';
import { Prisma } from '@prisma/client';

export class VoucherController {
  async getAllVouchers(req: Request, res: Response) {
    const user = (req as Request & { user: { outletId: string } }).user;

    const { search } = req.query as { search: string };
    const page = parseInt(req.query.page as string) || null;
    const limit = parseInt(req.query.limit as string) || null;

    const searchStr: string | undefined = typeof search === 'string' ? search : undefined;
    const skip = page && limit ? (page - 1) * limit : undefined;
    const take = limit || undefined;

    try {
      const whereClause: Prisma.VoucherWhereInput = {
        outletId: user.outletId,
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

      const vouchers = await prisma.voucher.findMany({
        where: whereClause,
        orderBy: {
          createdAt: 'asc',
        },
        include: {
          voucherMenus: {
            include: {
              menu: true,
            },
          },
        },
        skip,
        take,
      });

      if (page && limit) {
        const total = await prisma.voucher.count({ where: whereClause });
        return ResponseHandler.success(res, {
          message: 'Vouchers retrieved successfully',
          data: vouchers,
          pagination: {
            page,
            limit,
            total,
            totalPages: Math.ceil(total / limit),
          },
        });
      }

      return ResponseHandler.success(res, {
        message: 'Vouchers retrieved successfully',
        data: vouchers,
      });
    } catch (error) {
      logger.error('Error getting vouchers:', error);
      return ResponseHandler.error(res, {
        message: 'Internal server error',
        statusCode: 500,
      });
    }
  }

  async getVoucherByName(req: Request, res: Response) {
    const { code } = req.params;

    try {
      const voucher = await prisma.voucher.findFirst({
        where: { name: code },
      });
      if (!voucher) {
        return ResponseHandler.error(res, {
          message: 'Voucher not found',
          statusCode: 404,
        });
      }

      return ResponseHandler.success(res, {
        message: 'Voucher retrieved successfully',
        data: voucher,
      });
    } catch (error) {
      logger.error('Error getting voucher:', error);
      return ResponseHandler.error(res, {
        message: 'Internal server error',
        statusCode: 500,
      });
    }
  }

  async createVoucher(req: Request, res: Response) {
    const user = (req as Request & { user: { outletId: string } }).user;
    const voucherData: CreateVoucherDTO = req.body;

    try {
      if (!user.outletId) {
        return ResponseHandler.error(res, {
          message: 'Outlet not found',
          statusCode: 404,
        });
      }

      const findVoucher = await prisma.voucher.findFirst({
        where: { name: voucherData.name, outletId: user.outletId },
      });
      if (findVoucher) {
        return ResponseHandler.error(res, {
          message: 'Voucher already exists',
          statusCode: 400,
        });
      }

      const voucher = await prisma.voucher.create({
        data: {
          outletId: user.outletId,
          name: voucherData.name,
          description: voucherData.description,
          type: voucherData.type,
          discount: Number(voucherData.discount),
          usage: 0,
          maxUsage: Number(voucherData.maxUsage),
          allMenu: voucherData.allMenu,
          expiredAt: new Date(voucherData.expiredAt),
        },
      });

      return ResponseHandler.success(res, {
        message: 'Voucher created successfully',
        data: voucher,
      });
    } catch (error) {
      logger.error('Error creating voucher:', error);
      return ResponseHandler.error(res, {
        message: 'Internal server error',
        statusCode: 500,
      });
    }
  }

  async updateVoucher(req: Request, res: Response) {
    const user = (req as Request & { user: { outletId: string } }).user;
    const { id } = req.params;
    const voucherData: CreateVoucherDTO = req.body;

    try {
      if (!user.outletId) {
        return ResponseHandler.error(res, {
          message: 'Outlet not found',
          statusCode: 404,
        });
      }

      const findVoucher = await prisma.voucher.findUnique({
        where: { id, outletId: user.outletId },
      });
      if (!findVoucher) {
        return ResponseHandler.error(res, {
          message: 'Voucher not found',
          statusCode: 404,
        });
      }

      const voucher = await prisma.voucher.update({
        where: { id, outletId: user.outletId },
        data: {
          name: voucherData.name,
          type: voucherData.type,
          discount: Number(voucherData.discount),
          maxUsage: Number(voucherData.maxUsage),
          allMenu: voucherData.allMenu,
          expiredAt: new Date(voucherData.expiredAt),
        },
      });

      return ResponseHandler.success(res, {
        message: 'Voucher updated successfully',
        data: voucher,
      });
    } catch (error) {
      logger.error('Error updating voucher:', error);
      return ResponseHandler.error(res, {
        message: 'Internal server error',
        statusCode: 500,
      });
    }
  }

  async deleteVoucher(req: Request, res: Response) {
    const user = (req as Request & { user: { outletId: string } }).user;
    const { id } = req.params;

    try {
      if (!user.outletId) {
        return ResponseHandler.error(res, {
          message: 'Outlet not found',
          statusCode: 404,
        });
      }

      const findVoucher = await prisma.voucher.findUnique({
        where: { id, outletId: user.outletId },
      });
      if (!findVoucher) {
        return ResponseHandler.error(res, {
          message: 'Voucher not found',
          statusCode: 404,
        });
      }

      const voucher = await prisma.voucher.delete({
        where: { id, outletId: user.outletId },
      });

      return ResponseHandler.success(res, {
        message: 'Voucher deleted successfully',
        data: voucher,
      });
    } catch (error) {
      logger.error('Error deleting voucher:', error);
      return ResponseHandler.error(res, {
        message: 'Internal server error',
        statusCode: 500,
      });
    }
  }
}
