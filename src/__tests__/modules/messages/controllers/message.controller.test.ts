/* eslint-disable @typescript-eslint/no-explicit-any */
import { Request, Response } from 'express';
import { MessageController } from '../../../../modules/messages/controllers/message.controller';
import { ResponseHandler } from '../../../../utils/response/responseHandler';
import prisma from '../../../../lib/prisma';
import { logger } from '../../../../utils/common/logger';

// Mock dependencies
jest.mock('../../../../lib/prisma', () => ({
  __esModule: true,
  default: {
    message: {
      findMany: jest.fn(),
      findUnique: jest.fn(),
      findFirst: jest.fn(),
      create: jest.fn(),
    },
  },
}));

jest.mock('../../../../utils/common/logger', () => ({
  logger: {
    info: jest.fn(),
    error: jest.fn(),
  },
}));

jest.mock('../../../../utils/response/responseHandler', () => ({
  ResponseHandler: {
    success: jest.fn().mockReturnValue({ success: true }),
    error: jest.fn().mockReturnValue({ error: true }),
  },
}));

describe('MessageController', () => {
  let controller: MessageController;
  let mockRequest: Partial<Request>;
  let mockResponse: Partial<Response>;

  beforeEach(() => {
    controller = new MessageController();
    mockRequest = {
      params: {},
      body: {},
      user: { outletId: 'outlet-123' },
    } as Partial<Request> & { user: { outletId: string } };
    mockResponse = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    } as Partial<Response>;
    jest.clearAllMocks();
  });

  describe('getAllMessages', () => {
    it('should return all messages for an outlet', async () => {
      const mockMessages = [
        { id: '1', message: 'Test message 1', outletId: 'outlet-123' },
        { id: '2', message: 'Test message 2', outletId: 'outlet-123' },
      ];

      (prisma.message.findMany as jest.Mock).mockResolvedValue(mockMessages);

      await controller.getAllMessages(mockRequest as Request, mockResponse as Response);

      expect(prisma.message.findMany).toHaveBeenCalledWith({
        where: { outletId: 'outlet-123' },
        orderBy: { createdAt: 'desc' },
      });
      expect(ResponseHandler.success).toHaveBeenCalledWith(mockResponse, {
        message: 'Messages retrieved successfully',
        data: mockMessages,
      });
    });

    it('should handle errors when retrieving messages', async () => {
      const error = new Error('Database error');
      (prisma.message.findMany as jest.Mock).mockRejectedValue(error);

      await controller.getAllMessages(mockRequest as Request, mockResponse as Response);

      expect(logger.error).toHaveBeenCalledWith('Error getting messages:', error);
      expect(ResponseHandler.error).toHaveBeenCalledWith(mockResponse, {
        message: 'Internal server error',
        statusCode: 500,
      });
    });
  });

  describe('getMessageById', () => {
    it('should return a message by ID', async () => {
      const mockMessage = { id: 'msg-123', message: 'Test message', outletId: 'outlet-123' };
      mockRequest.params = { id: 'msg-123' };

      (prisma.message.findUnique as jest.Mock).mockResolvedValue(mockMessage);

      await controller.getMessageById(mockRequest as Request, mockResponse as Response);

      expect(prisma.message.findUnique).toHaveBeenCalledWith({
        where: { id: 'msg-123', outletId: 'outlet-123' },
      });
      expect(ResponseHandler.success).toHaveBeenCalledWith(mockResponse, {
        message: 'Message retrieved successfully',
        data: mockMessage,
      });
    });

    it('should return 404 when message is not found', async () => {
      mockRequest.params = { id: 'non-existent-id' };

      (prisma.message.findUnique as jest.Mock).mockResolvedValue(null);

      await controller.getMessageById(mockRequest as Request, mockResponse as Response);

      expect(ResponseHandler.error).toHaveBeenCalledWith(mockResponse, {
        message: 'Message not found',
        statusCode: 404,
      });
    });

    it('should handle errors when retrieving a message', async () => {
      mockRequest.params = { id: 'msg-123' };
      const error = new Error('Database error');
      (prisma.message.findUnique as jest.Mock).mockRejectedValue(error);

      await controller.getMessageById(mockRequest as Request, mockResponse as Response);

      expect(logger.error).toHaveBeenCalledWith('Error getting message:', error);
      expect(ResponseHandler.error).toHaveBeenCalledWith(mockResponse, {
        message: 'Internal server error',
        statusCode: 500,
      });
    });
  });

  describe('createMessage', () => {
    it('should create a new message', async () => {
      const mockMessageData = {
        outletId: 'outlet-123',
        message: 'Great service!',
        rating: '5',
      };
      mockRequest.body = mockMessageData;

      const createdMessage = {
        ...mockMessageData,
        id: 'new-msg-123',
        rating: 5,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      (prisma.message.findFirst as jest.Mock).mockResolvedValue(null);
      (prisma.message.create as jest.Mock).mockResolvedValue(createdMessage);

      // Freeze time for consistent testing
      const mockDate = new Date('2025-06-03T10:23:25.000Z');
      jest.useFakeTimers().setSystemTime(mockDate);

      await controller.createMessage(mockRequest as Request, mockResponse as Response);

      // Restore timers
      jest.useRealTimers();

      expect(prisma.message.create).toHaveBeenCalledWith({
        data: {
          outletId: 'outlet-123',
          message: 'Great service!',
          rating: 5,
        },
      });
      expect(ResponseHandler.success).toHaveBeenCalledWith(mockResponse, {
        message: 'Message created successfully',
        data: createdMessage,
      });
    });

    it('should handle errors when creating a message', async () => {
      const mockMessageData = {
        outletId: 'outlet-123',
        message: 'Great service!',
        rating: '5',
      };
      mockRequest.body = mockMessageData;

      const error = new Error('Database error');
      (prisma.message.findFirst as jest.Mock).mockResolvedValue(null);
      (prisma.message.create as jest.Mock).mockRejectedValue(error);

      await controller.createMessage(mockRequest as Request, mockResponse as Response);

      expect(logger.error).toHaveBeenCalledWith('Error creating message:', error);
      expect(ResponseHandler.error).toHaveBeenCalledWith(mockResponse, {
        message: 'Internal server error',
        statusCode: 500,
      });
    });
  });
});
