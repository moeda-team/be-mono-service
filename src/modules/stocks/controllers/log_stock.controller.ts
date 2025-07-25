import { Request, Response } from 'express';
import { logger } from '../../../utils/common/logger';
import { CreateLogStockDTO, UpdateLogStockDTO } from '../models/log_stock';
import { ResponseHandler } from '../../../utils/response/responseHandler';
import prisma from '../../../lib/prisma';
import { convertValue } from '../../../utils/common/convert_uom';
import { Unit } from 'convert-units';

export class LogStockController {
  async getAllLogStocks(req: Request, res: Response) {
    const user = (req as Request & { user: { outletId: string } }).user;

    try {
      const logStocks = await prisma.logStock.findMany({
        where: { outletId: user.outletId },
        orderBy: {
          createdAt: 'asc',
        },
      });
      return ResponseHandler.success(res, {
        message: 'Log stocks retrieved successfully',
        data: logStocks,
      });
    } catch (error) {
      logger.error('Error getting log stocks:', error);
      return ResponseHandler.error(res, {
        message: 'Internal server error',
        statusCode: 500,
      });
    }
  }

  async getLogStockById(req: Request, res: Response) {
    const user = (req as Request & { user: { outletId: string } }).user;
    const { id } = req.params;

    try {
      const logStock = await prisma.logStock.findUnique({
        where: { id, outletId: user.outletId },
      });
      if (!logStock) {
        return ResponseHandler.error(res, {
          message: 'Log stock not found',
          statusCode: 404,
        });
      }

      return ResponseHandler.success(res, {
        message: 'Log stock retrieved successfully',
        data: logStock,
      });
    } catch (error) {
      logger.error('Error getting log stock:', error);
      return ResponseHandler.error(res, {
        message: 'Internal server error',
        statusCode: 500,
      });
    }
  }

  async createLogStock(req: Request, res: Response) {
    const user = (req as Request & { user: { outletId: string; userId: string } }).user;
    const logStockData: CreateLogStockDTO = req.body;

    try {
      const findOutlet = await prisma.outlet.findUnique({
        where: { id: logStockData.outletId },
      });
      if (!findOutlet) {
        return ResponseHandler.error(res, {
          message: 'Outlet not found',
          statusCode: 404,
        });
      }

      const findStock = await prisma.stock.findUnique({
        where: { id: logStockData.stockId },
      });
      if (!findStock) {
        return ResponseHandler.error(res, {
          message: 'Stock not found',
          statusCode: 404,
        });
      }

      if (logStockData.menuId) {
        const findMenu = await prisma.menu.findUnique({
          where: { id: logStockData.menuId },
        });
        if (!findMenu) {
          return ResponseHandler.error(res, {
            message: 'Menu not found',
            statusCode: 404,
          });
        }
      }

      let logStockQtyConverted;
      try {
        logStockQtyConverted = convertValue(
          Number(logStockData.qty),
          logStockData.uom as Unit,
          findStock.uom as Unit,
        );
      } catch (error) {
        logger.error('Error converting uom:', error);
        return ResponseHandler.error(res, {
          message: 'Invalid unit conversion from ' + logStockData.uom + ' to ' + findStock.uom,
          statusCode: 400,
        });
      }

      if (logStockData.type === 'inbound') {
        await prisma.stock.update({
          where: { id: logStockData.stockId },
          data: {
            qty: findStock.qty.plus(logStockQtyConverted),
          },
        });
      } else if (logStockData.type === 'outbound') {
        await prisma.stock.update({
          where: { id: logStockData.stockId },
          data: {
            qty: findStock.qty.minus(logStockQtyConverted),
          },
        });
      }

      const logStock = await prisma.logStock.create({
        data: {
          outletId: logStockData.outletId,
          stockId: logStockData.stockId,
          qty: logStockData.qty,
          type: logStockData.type,
          uom: logStockData.uom,
          note: logStockData.note,
          menuId: logStockData.menuId,
          userId: user.userId,
        },
      });

      return ResponseHandler.success(res, {
        message: 'Log stock created successfully',
        data: logStock,
      });
    } catch (error) {
      logger.error('Error creating log stock:', error);
      return ResponseHandler.error(res, {
        message: 'Internal server error',
        statusCode: 500,
      });
    }
  }

  async updateLogStock(req: Request, res: Response) {
    const user = (req as Request & { user: { outletId: string; userId: string } }).user;
    const { id } = req.params;
    const logStockData: UpdateLogStockDTO = req.body;

    try {
      if (!user.outletId) {
        return ResponseHandler.error(res, {
          message: 'Outlet not found',
          statusCode: 404,
        });
      }

      const findLogStock = await prisma.logStock.findUnique({
        where: { id, outletId: user.outletId },
      });
      if (!findLogStock) {
        return ResponseHandler.error(res, {
          message: 'Log stock not found',
          statusCode: 404,
        });
      }

      const findStock = await prisma.stock.findUnique({
        where: { id: findLogStock.stockId },
      });
      if (!findStock) {
        return ResponseHandler.error(res, {
          message: 'Stock not found',
          statusCode: 404,
        });
      }

      let logStockQtyConverted;
      try {
        logStockQtyConverted = convertValue(
          Number(logStockData.qty),
          logStockData.uom as Unit,
          findStock.uom as Unit,
        );
      } catch (error) {
        logger.error('Error converting uom:', error);
        return ResponseHandler.error(res, {
          message: 'Invalid unit conversion from ' + logStockData.uom + ' to ' + findStock.uom,
          statusCode: 400,
        });
      }

      if (logStockData.type !== findLogStock.type) {
        const revertQty = findLogStock.type === 'inbound' ? -findLogStock.qty : findLogStock.qty;
        const applyQty =
          logStockData.type === 'inbound'
            ? logStockQtyConverted || 0
            : -(logStockQtyConverted || 0);
        const finalQty = findStock.qty.plus(revertQty).plus(applyQty);

        await prisma.stock.update({
          where: { id: findLogStock.stockId },
          data: {
            qty: finalQty,
          },
        });
      } else {
        const revertQty = findLogStock.type === 'inbound' ? -findLogStock.qty : findLogStock.qty;
        const applyQty =
          logStockData.type === 'inbound'
            ? logStockQtyConverted || 0
            : -(logStockQtyConverted || 0);
        const finalQty = findStock.qty.plus(revertQty).plus(applyQty);
        await prisma.stock.update({
          where: { id: findLogStock.stockId },
          data: {
            qty: finalQty,
          },
        });
      }

      const logStock = await prisma.logStock.update({
        where: { id, outletId: user.outletId },
        data: {
          qty: logStockData.qty,
          uom: logStockData.uom,
          type: logStockData.type,
          note: logStockData.note,
          userId: user.userId,
        },
      });

      return ResponseHandler.success(res, {
        message: 'Log stock updated successfully',
        data: logStock,
      });
    } catch (error) {
      logger.error('Error updating log stock:', error);
      return ResponseHandler.error(res, {
        message: 'Internal server error',
        statusCode: 500,
      });
    }
  }
}
