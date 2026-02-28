import { Request, Response } from 'express';
import prisma from '../../../config/database';
import { UpsertOptionDTO } from '../models/option';
import { ResponseHandler } from '../../../utils/response/responseHandler';

export class OptionController {
  async findAll(req: Request, res: Response) {
    const page = parseInt(req.query.page as string) || null;
    const limit = parseInt(req.query.limit as string) || null;

    const skip = page && limit ? (page - 1) * limit : undefined;
    const take = limit || undefined;

    try {
      const options = await prisma.option.findMany({
        orderBy: {
          createdAt: 'desc',
        },
        skip,
        take,
      });

      const responseData: Record<string, unknown> = {
        options,
      };

      if (page && limit) {
        const total = await prisma.option.count();
        responseData.pagination = {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit),
        };
      }

      return ResponseHandler.success(res, {
        message: 'Options retrieved successfully',
        data: responseData,
      });
    } catch (error) {
      return ResponseHandler.error(res, {
        message: 'Failed to fetch options',
        statusCode: 500,
      });
    }
  }

  async findOne(req: Request, res: Response) {
    const { menuId } = req.params;

    try {
      const option = await prisma.option.findUnique({
        where: { menuId },
      });
      if (!option) {
        return ResponseHandler.error(res, {
          message: 'Option not found',
          statusCode: 404,
        });
      }
      return ResponseHandler.success(res, {
        message: 'Option retrieved successfully',
        data: option,
      });
    } catch (error) {
      return ResponseHandler.error(res, {
        message: 'Failed to fetch option',
        statusCode: 500,
      });
    }
  }

  async upsert(
    req: Request<Record<string, never>, Record<string, never>, UpsertOptionDTO>,
    res: Response,
  ) {
    try {
      const { menuId, data } = req.body;

      if (!menuId) {
        return ResponseHandler.error(res, {
          message: 'menuId is required',
          statusCode: 400,
        });
      }

      const option = await prisma.option.upsert({
        where: { menuId },
        update: {
          data: data !== undefined ? data : undefined,
        },
        create: {
          menuId,
          data: data || [],
        },
      });
      return ResponseHandler.success(res, {
        message: 'Option upserted successfully',
        data: option,
      });
    } catch (error) {
      return ResponseHandler.error(res, {
        message: 'Failed to upsert option',
        statusCode: 500,
      });
    }
  }

  async delete(req: Request<{ menuId: string }>, res: Response) {
    try {
      const option = await prisma.option.findUnique({
        where: { menuId: req.params.menuId },
      });
      if (!option) {
        return ResponseHandler.error(res, {
          message: 'Option not found',
          statusCode: 404,
        });
      }
      await prisma.option.delete({
        where: { menuId: req.params.menuId },
      });
      return ResponseHandler.success(res, {
        message: 'Option deleted successfully',
        data: null,
      });
    } catch (error) {
      return ResponseHandler.error(res, {
        message: 'Failed to delete option',
        statusCode: 500,
      });
    }
  }
}
