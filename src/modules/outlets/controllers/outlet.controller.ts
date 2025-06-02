import { Request, Response } from 'express';
import { logger } from '../../../utils/common/logger';
import { CreateOutletDTO, UpdateOutletDTO } from '../models/outlet';
import { ResponseHandler } from '../../../utils/response/responseHandler';
import prisma from '../../../lib/prisma';

export class OutletController {
  async getAllOutlets(req: Request, res: Response) {
    try {
      const outlets = await prisma.outlet.findMany({
        orderBy: {
          createdAt: 'desc',
        },
      });
      return ResponseHandler.success(res, {
        message: 'Outlets retrieved successfully',
        data: outlets,
      });
    } catch (error) {
      logger.error('Error getting outlets:', error);
      return ResponseHandler.error(res, {
        message: 'Internal server error',
        statusCode: 500,
      });
    }
  }

  async getOutletById(req: Request, res: Response) {
    const { id } = req.params;

    try {
      const outlet = await prisma.outlet.findUnique({
        where: { id },
      });
      if (!outlet) {
        return ResponseHandler.error(res, {
          message: 'Outlet not found',
          statusCode: 404,
        });
      }

      return ResponseHandler.success(res, {
        message: 'Outlet retrieved successfully',
        data: outlet,
      });
    } catch (error) {
      logger.error('Error getting outlet:', error);
      return ResponseHandler.error(res, {
        message: 'Internal server error',
        statusCode: 500,
      });
    }
  }

  async createOutlet(req: Request, res: Response) {
    const outletData: CreateOutletDTO = req.body;
    logger.info('Outlet data:', outletData);

    try {
      const existingOutlet = await prisma.outlet.findFirst({
        where: {
          OR: [{ name: outletData.name }],
        },
      });
      if (existingOutlet) {
        return ResponseHandler.error(res, {
          message: 'Outlet already exists',
          statusCode: 400,
        });
      }

      const outlet = await prisma.outlet.create({
        data: {
          name: outletData.name,
          outletType: outletData.outletType,
          address: outletData.address,
          number: outletData.number,
          province: outletData.province,
          city: outletData.city,
          postalCode: outletData.postalCode,
          status: outletData.status,
        },
      });
      return ResponseHandler.success(res, {
        message: 'Outlet created successfully',
        data: outlet,
      });
    } catch (error) {
      logger.error('Error creating outlet:', error);
      return ResponseHandler.error(res, {
        message: 'Internal server error',
        statusCode: 500,
      });
    }
  }

  async updateOutlet(req: Request, res: Response) {
    const { id } = req.params;
    const outletData: UpdateOutletDTO = req.body;

    try {
      const outlet = await prisma.outlet.findUnique({
        where: { id },
      });
      if (!outlet) {
        return ResponseHandler.error(res, {
          message: 'Outlet not found',
          statusCode: 404,
        });
      }

      const existingOutlet = await prisma.outlet.findFirst({
        where: {
          OR: [{ name: outletData.name }],
          AND: [{ id: { not: id } }],
        },
      });
      if (existingOutlet) {
        return ResponseHandler.error(res, {
          message: 'Outlet already exists',
          statusCode: 400,
        });
      }

      const updatedOutlet = await prisma.outlet.update({
        where: { id },
        data: {
          name: outletData.name,
          outletType: outletData.outletType,
          address: outletData.address,
          number: outletData.number,
          province: outletData.province,
          city: outletData.city,
          postalCode: outletData.postalCode,
          status: outletData.status,
        },
      });

      return ResponseHandler.success(res, {
        message: 'Outlet updated successfully',
        data: updatedOutlet,
      });
    } catch (error) {
      logger.error('Error updating outlet:', error);
      return ResponseHandler.error(res, {
        message: 'Internal server error',
        statusCode: 500,
      });
    }
  }

  async deleteOutlet(req: Request, res: Response) {
    const { id } = req.params;

    try {
      const outlet = await prisma.outlet.findUnique({
        where: { id },
      });
      if (!outlet) {
        return ResponseHandler.error(res, {
          message: 'Outlet not found',
          statusCode: 404,
        });
      }

      await prisma.outlet.delete({
        where: { id },
      });

      return ResponseHandler.success(res, {
        message: 'Outlet deleted successfully',
        data: null,
      });
    } catch (error) {
      if (error instanceof Error && 'code' in error && error.code === 'P2025') {
        return ResponseHandler.error(res, {
          message: 'Outlet not found',
          statusCode: 404,
        });
      }
      logger.error('Error deleting outlet:', error);
      return ResponseHandler.error(res, {
        message: 'Internal server error',
        statusCode: 500,
      });
    }
  }
}
