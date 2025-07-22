import { Request, Response } from 'express';
import { logger } from '../../../utils/common/logger';
import { CreateStockDTO, UpdateStockDTO } from '../models/stock';
import { ResponseHandler } from '../../../utils/response/responseHandler';
import { sendLowStockAlertEmail } from '../../../utils/mail/stock_alert';
import prisma from '../../../lib/prisma';

export class StockController {
  async getAllStocks(req: Request, res: Response) {
    const user = (req as Request & { user: { outletId: string } }).user;

    try {
      const stocks = await prisma.stock.findMany({
        where: { outletId: user.outletId },
        orderBy: {
          createdAt: 'asc',
        },
      });
      return ResponseHandler.success(res, {
        message: 'Stocks retrieved successfully',
        data: stocks,
      });
    } catch (error) {
      logger.error('Error getting stocks:', error);
      return ResponseHandler.error(res, {
        message: 'Internal server error',
        statusCode: 500,
      });
    }
  }

  async getAllStockStatus(req: Request, res: Response) {
    const user = (req as Request & { user: { outletId: string } }).user;

    try {
      const stocks = await prisma.stock.findMany({
        where: {
          outletId: user.outletId,
          minQty: {
            gte: prisma.stock.fields.qty,
          },
        },
      });

      const todayStart = new Date();
      const todayEnd = new Date();
      todayStart.setHours(0, 0, 0, 0);
      todayEnd.setHours(23, 59, 59, 999);

      const stocksNeedingAlerts = [];
      for (const stock of stocks) {
        const alertStocks = await prisma.alertStock.findFirst({
          where: {
            stockId: stock.id,
            outletId: user.outletId,
            createdAt: {
              gte: todayStart,
              lte: todayEnd,
            },
          },
        });

        if (!alertStocks) {
          await prisma.alertStock.create({
            data: {
              stockId: stock.id,
              outletId: user.outletId,
            },
          });
          stocksNeedingAlerts.push(stock);
        }
      }

      if (stocksNeedingAlerts.length > 0) {
        try {
          const emailSent = await sendLowStockAlertEmail(
            'lovantoqwerty@gmail.com',
            stocksNeedingAlerts,
          );
          if (emailSent) {
            logger.info('Stock alert email sent successfully.');
          } else {
            logger.warn('Failed to send stock alert email');
          }
        } catch (error) {
          logger.error('Error in stock alert email process:', error);
        }
      }

      return ResponseHandler.success(res, {
        message: 'Stocks retrieved successfully',
        data: stocks,
      });
    } catch (error) {
      logger.error('Error getting stocks:', error);
      return ResponseHandler.error(res, {
        message: 'Internal server error',
        statusCode: 500,
      });
    }
  }

  async getStockById(req: Request, res: Response) {
    const user = (req as Request & { user: { outletId: string } }).user;
    const { id } = req.params;

    try {
      const stock = await prisma.stock.findUnique({
        where: { id, outletId: user.outletId },
      });
      if (!stock) {
        return ResponseHandler.error(res, {
          message: 'Stock not found',
          statusCode: 404,
        });
      }

      return ResponseHandler.success(res, {
        message: 'Stock retrieved successfully',
        data: stock,
      });
    } catch (error) {
      logger.error('Error getting stock:', error);
      return ResponseHandler.error(res, {
        message: 'Internal server error',
        statusCode: 500,
      });
    }
  }

  async createStock(req: Request, res: Response) {
    const user = (req as Request & { user: { outletId: string } }).user;
    const stockData: CreateStockDTO = req.body;

    try {
      if (!user.outletId) {
        return ResponseHandler.error(res, {
          message: 'Outlet not found',
          statusCode: 404,
        });
      }

      const findStock = await prisma.stock.findFirst({
        where: { name: stockData.name, outletId: user.outletId },
      });
      if (findStock) {
        return ResponseHandler.error(res, {
          message: 'Stock already exists',
          statusCode: 400,
        });
      }

      const stock = await prisma.stock.create({
        data: {
          outletId: user.outletId,
          name: stockData.name,
          qty: Number(stockData.qty),
          uom: stockData.uom,
          minQty: Number(stockData.minQty),
        },
      });

      return ResponseHandler.success(res, {
        message: 'Stock created successfully',
        data: stock,
      });
    } catch (error) {
      logger.error('Error creating stock:', error);
      return ResponseHandler.error(res, {
        message: 'Internal server error',
        statusCode: 500,
      });
    }
  }

  async updateStock(req: Request, res: Response) {
    const user = (req as Request & { user: { outletId: string } }).user;
    const { id } = req.params;
    const stockData: UpdateStockDTO = req.body;

    try {
      if (!user.outletId) {
        return ResponseHandler.error(res, {
          message: 'Outlet not found',
          statusCode: 404,
        });
      }

      const findStock = await prisma.stock.findUnique({
        where: { id, outletId: user.outletId },
      });
      if (!findStock) {
        return ResponseHandler.error(res, {
          message: 'Stock not found',
          statusCode: 404,
        });
      }

      const stock = await prisma.stock.update({
        where: { id, outletId: user.outletId },
        data: {
          name: stockData.name,
          qty: Number(stockData.qty),
          uom: stockData.uom,
          minQty: Number(stockData.minQty),
        },
      });

      return ResponseHandler.success(res, {
        message: 'Stock updated successfully',
        data: stock,
      });
    } catch (error) {
      logger.error('Error updating stock:', error);
      return ResponseHandler.error(res, {
        message: 'Internal server error',
        statusCode: 500,
      });
    }
  }

  async deleteStock(req: Request, res: Response) {
    const user = (req as Request & { user: { outletId: string } }).user;
    const { id } = req.params;

    try {
      if (!user.outletId) {
        return ResponseHandler.error(res, {
          message: 'Outlet not found',
          statusCode: 404,
        });
      }

      const findStock = await prisma.stock.findUnique({
        where: { id, outletId: user.outletId },
      });
      if (!findStock) {
        return ResponseHandler.error(res, {
          message: 'Stock not found',
          statusCode: 404,
        });
      }

      const stock = await prisma.stock.delete({
        where: { id, outletId: user.outletId },
      });

      return ResponseHandler.success(res, {
        message: 'Stock deleted successfully',
        data: stock,
      });
    } catch (error) {
      logger.error('Error deleting stock:', error);
      return ResponseHandler.error(res, {
        message: 'Internal server error',
        statusCode: 500,
      });
    }
  }
}
