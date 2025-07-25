import { Response } from 'express';
import { BaseController } from '../../../../modules/menus/controllers/base.controller';
import { ResponseHandler } from '../../../../utils/response/responseHandler';

// Create a concrete implementation of the abstract BaseController for testing
class TestController extends BaseController {
  // Expose the protected methods for testing
  public testSendSuccess<T>(
    res: Response,
    options: { message: string; data: T; statusCode?: number },
  ) {
    return this.sendSuccess(res, options);
  }

  public testSendError(
    res: Response,
    options: { message: string; statusCode?: number; error?: { code?: string; details?: unknown } },
  ) {
    return this.sendError(res, options);
  }
}

// Mock ResponseHandler
jest.mock('../../../../utils/response/responseHandler', () => ({
  ResponseHandler: {
    success: jest.fn().mockReturnValue({ mockedSuccessResponse: true }),
    error: jest.fn().mockReturnValue({ mockedErrorResponse: true }),
  },
}));

describe('BaseController', () => {
  let controller: TestController;
  let mockResponse: Response;

  beforeEach(() => {
    controller = new TestController();
    mockResponse = {} as Response;
    jest.clearAllMocks();
  });

  describe('sendSuccess', () => {
    it('should call ResponseHandler.success with correct parameters and default status code', () => {
      const options = {
        message: 'Success message',
        data: { id: 1, name: 'Test' },
      };

      const result = controller.testSendSuccess(mockResponse, options);

      expect(ResponseHandler.success).toHaveBeenCalledWith(mockResponse, {
        message: options.message,
        data: options.data,
        statusCode: 200, // Default status code
      });
      expect(result).toEqual({ mockedSuccessResponse: true });
    });

    it('should call ResponseHandler.success with custom status code', () => {
      const options = {
        message: 'Created successfully',
        data: { id: 1, name: 'Test' },
        statusCode: 201,
      };

      const result = controller.testSendSuccess(mockResponse, options);

      expect(ResponseHandler.success).toHaveBeenCalledWith(mockResponse, {
        message: options.message,
        data: options.data,
        statusCode: 201,
      });
      expect(result).toEqual({ mockedSuccessResponse: true });
    });
  });

  describe('sendError', () => {
    it('should call ResponseHandler.error with correct parameters and default status code', () => {
      const options = {
        message: 'Error message',
      };

      const result = controller.testSendError(mockResponse, options);

      expect(ResponseHandler.error).toHaveBeenCalledWith(mockResponse, {
        message: options.message,
        statusCode: 500, // Default status code
        error: undefined,
      });
      expect(result).toEqual({ mockedErrorResponse: true });
    });

    it('should call ResponseHandler.error with custom status code', () => {
      const options = {
        message: 'Not found',
        statusCode: 404,
      };

      const result = controller.testSendError(mockResponse, options);

      expect(ResponseHandler.error).toHaveBeenCalledWith(mockResponse, {
        message: options.message,
        statusCode: 404,
        error: undefined,
      });
      expect(result).toEqual({ mockedErrorResponse: true });
    });

    it('should call ResponseHandler.error with error details', () => {
      const options = {
        message: 'Validation error',
        statusCode: 400,
        error: {
          code: 'VALIDATION_ERROR',
          details: { field: 'name', issue: 'required' },
        },
      };

      const result = controller.testSendError(mockResponse, options);

      expect(ResponseHandler.error).toHaveBeenCalledWith(mockResponse, {
        message: options.message,
        statusCode: 400,
        error: options.error,
      });
      expect(result).toEqual({ mockedErrorResponse: true });
    });
  });
});
