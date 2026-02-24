import { Request, Response } from 'express';
import prisma from '../../../lib/prisma';
import { CreateOptionDTO, UpdateOptionDTO } from '../models/option';
import { ResponseHandler } from '../../../utils/response/responseHandler';

export class OptionController {
  async findAll(req: Request, res: Response) {
    try {
      const options = await prisma.option.findMany({
        orderBy: {
          createdAt: 'desc',
        },
      });
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
    const { id } = req.params;

    try {
      const option = await prisma.option.findUnique({
        where: { id },
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

  async create(
    req: Request<Record<string, never>, Record<string, never>, CreateOptionDTO>,
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

      const option = await prisma.option.create({
        data: {
          menuId,
          data: data || [],
        },
      });
      return ResponseHandler.success(res, {
        message: 'Option created successfully',
        data: option,
      });
    } catch (error) {
      return ResponseHandler.error(res, {
        message: 'Failed to create option',
        statusCode: 500,
      });
    }
  }

  async update(
    req: Request<{ id: string }, Record<string, never>, UpdateOptionDTO>,
    res: Response,
  ) {
    try {
      const { menuId, data } = req.body;

      const updatedOption = await prisma.option.update({
        where: { id: req.params.id },
        data: {
          ...(menuId && { menuId }),
          ...(data !== undefined && { data }),
        },
      });
      return ResponseHandler.success(res, {
        message: 'Option updated successfully',
        data: updatedOption,
      });
    } catch (error) {
      return ResponseHandler.error(res, {
        message: 'Failed to update option',
        statusCode: 500,
      });
    }
  }

  async delete(req: Request<{ id: string }>, res: Response) {
    try {
      const option = await prisma.option.findFirst({
        where: { id: req.params.id },
      });
      if (!option) {
        return ResponseHandler.error(res, {
          message: 'Option not found',
          statusCode: 404,
        });
      }
      await prisma.option.delete({
        where: { id: req.params.id },
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
