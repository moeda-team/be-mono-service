import { Request, Response } from 'express';
import prisma from '../../../config/database';
import { UpsertOptionDTO } from '../models/option';
import { ResponseHandler } from '../../../utils/response/responseHandler';
import { resolveOutletFilter } from '../../../utils/auth/outletAccess';

export class OptionController {
  async findAll(req: Request, res: Response) {
    const { user } = req as Request & { user?: { outletId?: string; role?: string } };
    const outletId = resolveOutletFilter(user, req.query.outletId as string | undefined);
    const page = parseInt(req.query.page as string) || null;
    const limit = parseInt(req.query.limit as string) || null;

    const skip = page && limit ? (page - 1) * limit : undefined;
    const take = limit || undefined;

    try {
      const options = await prisma.option.findMany({
        ...(outletId
          ? {
              where: {
                menu: {
                  outletId,
                },
              },
            }
          : {}),
        orderBy: {
          createdAt: 'desc',
        },
        skip,
        take,
      });

      if (page && limit) {
        const total = await prisma.option.count(
          outletId
            ? {
                where: {
                  menu: {
                    outletId,
                  },
                },
              }
            : undefined,
        );
        return ResponseHandler.success(res, {
          message: 'Options retrieved successfully',
          data: options,
          pagination: {
            page,
            limit,
            total,
            totalPages: Math.ceil(total / limit),
          },
        });
      }

      return ResponseHandler.success(res, {
        message: 'Options retrieved successfully',
        data: options,
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
    const { user } = req as Request & { user?: { outletId?: string; role?: string } };
    const outletId = resolveOutletFilter(user, req.query.outletId as string | undefined);

    try {
      const option = await (outletId
        ? prisma.option.findFirst({
            where: {
              menuId,
              menu: {
                outletId,
              },
            },
          })
        : prisma.option.findUnique({
            where: { menuId },
          }));
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
