import { Response } from 'express';
import { ResponseHandler } from '../../../../utils/response/responseHandler';
import { BaseController } from '../../../../modules/messages/controllers/base.controller';

// Mock ResponseHandler
jest.mock('../../../../utils/response/responseHandler', () => ({
  ResponseHandler: {
    success: jest.fn().mockReturnValue({ success: true }),
    error: jest.fn().mockReturnValue({ error: true }),
  },
}));

// Create a concrete implementation of the abstract BaseController for testing
class TestController extends BaseController {
  // Expose protected methods for testing
  public testSendSuccess<T>(res: Response, options: { message: string; data: T; statusCode?: number }) {
    return this.sendSuccess(res, options);
  }

  public testSendError(
    res: Response,
    options: {
      message: string;
      statusCode?: number;
      error?: {
        code?: string;
        details?: unknown;
      };
    },
  ) {
    return this.sendError(res, options);
  }
}

describe('BaseController', () => {
  let controller: TestController;
  let mockResponse: Partial<Response>;

  beforeEach(() => {
    controller = new TestController();
    mockResponse = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    } as Partial<Response>;
    jest.clearAllMocks();
  });

  describe('sendSuccess', () => {
    it('should call ResponseHandler.success with the correct parameters', () => {
      const options = {
        message: 'Success message',
        data: { id: '1', name: 'Test' },
        statusCode: 201,
      };

      const result = controller.testSendSuccess(mockResponse as Response, options);

      expect(ResponseHandler.success).toHaveBeenCalledWith(mockResponse, options);
      expect(result).toEqual({ success: true });
    });

    it('should use default status code 200 if not provided', () => {
      const options = {
        message: 'Success message',
        data: { id: '1', name: 'Test' },
      };

      controller.testSendSuccess(mockResponse as Response, options);

      expect(ResponseHandler.success).toHaveBeenCalledWith(mockResponse, {
        ...options,
        statusCode: 200,
      });
    });
  });

  describe('sendError', () => {
    it('should call ResponseHandler.error with the correct parameters', () => {
      const options = {
        message: 'Error message',
        statusCode: 400,
        error: {
          code: 'BAD_REQUEST',
          details: 'Invalid input',
        },
      };

      const result = controller.testSendError(mockResponse as Response, options);

      expect(ResponseHandler.error).toHaveBeenCalledWith(mockResponse, options);
      expect(result).toEqual({ error: true });
    });

    it('should use default status code 500 if not provided', () => {
      const options = {
        message: 'Error message',
      };

      controller.testSendError(mockResponse as Response, options);

      expect(ResponseHandler.error).toHaveBeenCalledWith(mockResponse, {
        ...options,
        statusCode: 500,
      });
    });
  });
});
