/* eslint-disable @typescript-eslint/no-explicit-any */
import { BaseController } from '../../../../modules/users/controllers/base.controller';
import { mockResponse } from '../../../mocks/express.mock';
import { ResponseHandler } from '../../../../utils/response/responseHandler';

// Mock ResponseHandler
jest.mock('../../../../utils/response/responseHandler', () => ({
  ResponseHandler: {
    success: jest.fn().mockReturnValue({ status: 'success' }),
    error: jest.fn().mockReturnValue({ status: 'error' }),
  },
}));

// Create a concrete implementation of the abstract BaseController for testing
class TestController extends BaseController {
  // Expose protected methods as public for testing
  public testSendSuccess<T>(res: any, options: { message: string; data: T; statusCode?: number }) {
    return this.sendSuccess(res, options);
  }

  public testSendError(
    res: any,
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
  let res: any;

  beforeEach(() => {
    controller = new TestController();
    res = mockResponse();
    jest.clearAllMocks();
  });

  describe('sendSuccess', () => {
    it('should call ResponseHandler.success with the correct parameters', () => {
      // Arrange
      const message = 'Success message';
      const data = { id: '1', name: 'Test' };
      const statusCode = 201;

      // Act
      const result = controller.testSendSuccess(res, { message, data, statusCode });

      // Assert
      expect(ResponseHandler.success).toHaveBeenCalledWith(res, {
        message,
        data,
        statusCode,
      });
      expect(result).toEqual({ status: 'success' });
    });

    it('should use default status code 200 if not provided', () => {
      // Arrange
      const message = 'Success message';
      const data = { id: '1', name: 'Test' };

      // Act
      controller.testSendSuccess(res, { message, data });

      // Assert
      expect(ResponseHandler.success).toHaveBeenCalledWith(res, {
        message,
        data,
        statusCode: 200,
      });
    });

    it('should handle null data', () => {
      // Arrange
      const message = 'Success with null data';
      const data = null;

      // Act
      controller.testSendSuccess(res, { message, data });

      // Assert
      expect(ResponseHandler.success).toHaveBeenCalledWith(res, {
        message,
        data: null,
        statusCode: 200,
      });
    });

    it('should handle array data', () => {
      // Arrange
      const message = 'Success with array data';
      const data = [{ id: '1' }, { id: '2' }];

      // Act
      controller.testSendSuccess(res, { message, data });

      // Assert
      expect(ResponseHandler.success).toHaveBeenCalledWith(res, {
        message,
        data,
        statusCode: 200,
      });
    });
  });

  describe('sendError', () => {
    it('should call ResponseHandler.error with the correct parameters', () => {
      // Arrange
      const message = 'Error message';
      const statusCode = 404;
      const error = { code: 'NOT_FOUND', details: 'Resource not found' };

      // Act
      const result = controller.testSendError(res, { message, statusCode, error });

      // Assert
      expect(ResponseHandler.error).toHaveBeenCalledWith(res, {
        message,
        statusCode,
        error,
      });
      expect(result).toEqual({ status: 'error' });
    });

    it('should use default status code 500 if not provided', () => {
      // Arrange
      const message = 'Error message';

      // Act
      controller.testSendError(res, { message });

      // Assert
      expect(ResponseHandler.error).toHaveBeenCalledWith(res, {
        message,
        statusCode: 500,
        error: undefined,
      });
    });

    it('should handle error without code or details', () => {
      // Arrange
      const message = 'Simple error';
      const statusCode = 400;

      // Act
      controller.testSendError(res, { message, statusCode });

      // Assert
      expect(ResponseHandler.error).toHaveBeenCalledWith(res, {
        message,
        statusCode,
        error: undefined,
      });
    });

    it('should handle error with only code', () => {
      // Arrange
      const message = 'Error with code';
      const statusCode = 403;
      const error = { code: 'FORBIDDEN' };

      // Act
      controller.testSendError(res, { message, statusCode, error });

      // Assert
      expect(ResponseHandler.error).toHaveBeenCalledWith(res, {
        message,
        statusCode,
        error,
      });
    });

    it('should handle error with only details', () => {
      // Arrange
      const message = 'Error with details';
      const statusCode = 422;
      const error = { details: { field: 'email', issue: 'invalid format' } };

      // Act
      controller.testSendError(res, { message, statusCode, error });

      // Assert
      expect(ResponseHandler.error).toHaveBeenCalledWith(res, {
        message,
        statusCode,
        error,
      });
    });
  });
});
