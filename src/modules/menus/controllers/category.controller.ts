import { Request, Response } from 'express';
import prisma from '../../../config/database';
import { CreateCategoryDTO, UpdateCategoryDTO } from '../models/category';
import { ResponseHandler } from '../../../utils/response/responseHandler';

export class CategoryController {
  async findAll(req: Request, res: Response) {
    const outletId = req.headers.Outletid as string;

    try {
      const categories = await prisma.category.findMany({
        where: {
          outletId,
        },
        orderBy: {
          createdAt: 'desc',
        },
      });
      return ResponseHandler.success(res, {
        message: 'Categories retrieved successfully',
        data: categories,
      });
    } catch (error) {
      return ResponseHandler.error(res, {
        message: 'Failed to fetch categories',
        statusCode: 500,
      });
    }
  }

  async findOne(req: Request, res: Response) {
    const { id } = req.params;
    const outletId = req.headers.Outletid as string;

    try {
      const category = await prisma.category.findUnique({
        where: { id, outletId },
      });
      if (!category) {
        return ResponseHandler.error(res, {
          message: 'Category not found',
          statusCode: 404,
        });
      }
      return ResponseHandler.success(res, {
        message: 'Category retrieved successfully',
        data: category,
      });
    } catch (error) {
      return ResponseHandler.error(res, {
        message: 'Failed to fetch category',
        statusCode: 500,
      });
    }
  }

  async create(
    req: Request<Record<string, never>, Record<string, never>, CreateCategoryDTO>,
    res: Response,
  ) {
    const { user } = req as Request & { user?: { outletId: string } };
    const outletId = user?.outletId;

    try {
      const existingCategory = await prisma.category.findFirst({
        where: {
          name: req.body.name,
          outletId,
        },
      });
      if (existingCategory) {
        return ResponseHandler.error(res, {
          message: 'Category already exists',
          statusCode: 400,
        });
      }
      const category = await prisma.category.create({
        data: {
          outletId,
          name: req.body.name,
          icon: req.body.icon,
        },
      });
      return ResponseHandler.success(res, {
        message: 'Category created successfully',
        data: category,
      });
    } catch (error) {
      return ResponseHandler.error(res, {
        message: 'Failed to create category',
        statusCode: 500,
      });
    }
  }

  async update(
    req: Request<{ id: string }, Record<string, never>, UpdateCategoryDTO>,
    res: Response,
  ) {
    const { user } = req as Request & { user?: { outletId: string } };
    const outletId = user?.outletId;

    try {
      const category = await prisma.category.findFirst({
        where: {
          id: { not: req.params.id },
          name: req.body.name,
          outletId,
        },
      });
      if (category) {
        return ResponseHandler.error(res, {
          message: 'Category already exists',
          statusCode: 400,
        });
      }
      const updatedCategory = await prisma.category.update({
        where: { id: req.params.id, outletId },
        data: {
          outletId,
          name: req.body.name,
          icon: req.body.icon,
        },
      });
      return ResponseHandler.success(res, {
        message: 'Category updated successfully',
        data: updatedCategory,
      });
    } catch (error) {
      return ResponseHandler.error(res, {
        message: 'Failed to update category',
        statusCode: 500,
      });
    }
  }

  async delete(req: Request<{ id: string }>, res: Response) {
    const { user } = req as Request & { user?: { outletId: string } };
    const outletId = user?.outletId;

    try {
      const category = await prisma.category.findFirst({
        where: { id: req.params.id, outletId },
      });
      if (!category) {
        return ResponseHandler.error(res, {
          message: 'Category not found',
          statusCode: 404,
        });
      }
      await prisma.category.delete({
        where: { id: req.params.id, outletId },
      });
      return ResponseHandler.success(res, {
        message: 'Category deleted successfully',
        data: null,
      });
    } catch (error) {
      return ResponseHandler.error(res, {
        message: 'Failed to delete category',
        statusCode: 500,
      });
    }
  }
}
