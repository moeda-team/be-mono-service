import { Request, Response } from 'express';
import { logger } from '../../../utils/common/logger';
import { CreateMessageDTO } from '../models/message';
import { ResponseHandler } from '../../../utils/response/responseHandler';
import prisma from '../../../config/database';

export class MessageController {
  async getAllMessages(req: Request, res: Response) {
    const user = (req as Request & { user: { outletId: string } }).user;

    try {
      const messages = await prisma.message.findMany({
        where: { outletId: user.outletId },
        orderBy: {
          createdAt: 'desc',
        },
      });
      return ResponseHandler.success(res, {
        message: 'Messages retrieved successfully',
        data: messages,
      });
    } catch (error) {
      logger.error('Error getting messages:', error);
      return ResponseHandler.error(res, {
        message: 'Internal server error',
        statusCode: 500,
      });
    }
  }

  async getMessageById(req: Request, res: Response) {
    const user = (req as Request & { user: { outletId: string } }).user;
    const { id } = req.params;

    try {
      const message = await prisma.message.findUnique({
        where: { id, outletId: user.outletId },
      });
      if (!message) {
        return ResponseHandler.error(res, {
          message: 'Message not found',
          statusCode: 404,
        });
      }

      return ResponseHandler.success(res, {
        message: 'Message retrieved successfully',
        data: message,
      });
    } catch (error) {
      logger.error('Error getting message:', error);
      return ResponseHandler.error(res, {
        message: 'Internal server error',
        statusCode: 500,
      });
    }
  }

  async createMessage(req: Request, res: Response) {
    const userData: CreateMessageDTO = req.body;

    try {
      const outlet = await prisma.outlet.findUnique({
        where: { id: userData.outletId },
      });
      if (!outlet) {
        return ResponseHandler.error(res, {
          message: 'Outlet not found',
          statusCode: 404,
        });
      }

      const message = await prisma.message.create({
        data: {
          outletId: userData.outletId,
          message: userData.message,
          rating: Number(userData.rating),
        },
      });
      return ResponseHandler.success(res, {
        message: 'Message created successfully',
        data: message,
      });
    } catch (error) {
      logger.error('Error creating message:', error);
      return ResponseHandler.error(res, {
        message: 'Internal server error',
        statusCode: 500,
      });
    }
  }
}
