import { Request, Response, NextFunction } from 'express';
import { validateCreateMessage } from '../../../../modules/messages/validators/message.validator';
import { ResponseHandler } from '../../../../utils/response/responseHandler';

// Mock ResponseHandler
jest.mock('../../../../utils/response/responseHandler', () => ({
  ResponseHandler: {
    error: jest.fn().mockReturnValue({ mockedErrorResponse: true }),
  },
}));

describe('Message Validators', () => {
  let mockRequest: Partial<Request>;
  let mockResponse: Partial<Response>;
  let mockNext: NextFunction;

  beforeEach(() => {
    mockRequest = {
      body: {},
    };
    mockResponse = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    } as Partial<Response>;
    mockNext = jest.fn();
    jest.clearAllMocks();
  });

  describe('validateCreateMessage', () => {
    it('should call next() when all validations pass', async () => {
      mockRequest.body = {
        outletId: 'outlet-123',
        name: 'John Doe',
        email: 'john@example.com',
        message: 'Great service!',
        rating: '5',
      };

      // Execute all middleware functions in the validateCreateMessage array
      for (const middleware of validateCreateMessage) {
        await middleware(mockRequest as Request, mockResponse as Response, mockNext);
      }

      expect(mockNext).toHaveBeenCalled();
      expect(ResponseHandler.error).not.toHaveBeenCalled();
    });

    it('should return error when outletId is missing', async () => {
      mockRequest.body = {
        name: 'John Doe',
        email: 'john@example.com',
        message: 'Great service!',
        rating: '5',
      };

      // Execute all middleware functions in the validateCreateMessage array
      for (const middleware of validateCreateMessage) {
        await middleware(mockRequest as Request, mockResponse as Response, mockNext);
      }

      expect(ResponseHandler.error).toHaveBeenCalledWith(
        mockResponse,
        expect.objectContaining({
          message: 'Validation failed',
          statusCode: 400,
          error: expect.objectContaining({
            code: 'VALIDATION_FAILED',
          }),
        })
      );
    });

    it('should return error when name is missing', async () => {
      mockRequest.body = {
        outletId: 'outlet-123',
        email: 'john@example.com',
        message: 'Great service!',
        rating: '5',
      };

      // Execute all middleware functions in the validateCreateMessage array
      for (const middleware of validateCreateMessage) {
        await middleware(mockRequest as Request, mockResponse as Response, mockNext);
      }

      expect(ResponseHandler.error).toHaveBeenCalledWith(
        mockResponse,
        expect.objectContaining({
          message: 'Validation failed',
          statusCode: 400,
        })
      );
    });

    it('should return error when message is missing', async () => {
      mockRequest.body = {
        outletId: 'outlet-123',
        name: 'John Doe',
        email: 'john@example.com',
        rating: '5',
      };

      // Execute all middleware functions in the validateCreateMessage array
      for (const middleware of validateCreateMessage) {
        await middleware(mockRequest as Request, mockResponse as Response, mockNext);
      }

      expect(ResponseHandler.error).toHaveBeenCalledWith(
        mockResponse,
        expect.objectContaining({
          message: 'Validation failed',
          statusCode: 400,
        })
      );
    });

    it('should return error when rating is not an integer', async () => {
      mockRequest.body = {
        outletId: 'outlet-123',
        name: 'John Doe',
        email: 'john@example.com',
        message: 'Great service!',
        rating: 'not-a-number',
      };

      // Execute all middleware functions in the validateCreateMessage array
      for (const middleware of validateCreateMessage) {
        await middleware(mockRequest as Request, mockResponse as Response, mockNext);
      }

      expect(ResponseHandler.error).toHaveBeenCalledWith(
        mockResponse,
        expect.objectContaining({
          message: 'Validation failed',
          statusCode: 400,
        })
      );
    });

    it('should return error when email is invalid', async () => {
      mockRequest.body = {
        outletId: 'outlet-123',
        name: 'John Doe',
        email: 'invalid-email',
        message: 'Great service!',
        rating: '5',
      };

      // Execute all middleware functions in the validateCreateMessage array
      for (const middleware of validateCreateMessage) {
        await middleware(mockRequest as Request, mockResponse as Response, mockNext);
      }

      expect(ResponseHandler.error).toHaveBeenCalledWith(
        mockResponse,
        expect.objectContaining({
          message: 'Validation failed',
          statusCode: 400,
        })
      );
    });

    it('should accept when email is not provided (optional)', async () => {
      mockRequest.body = {
        outletId: 'outlet-123',
        name: 'John Doe',
        message: 'Great service!',
        rating: '5',
      };

      // Execute all middleware functions in the validateCreateMessage array
      for (const middleware of validateCreateMessage) {
        await middleware(mockRequest as Request, mockResponse as Response, mockNext);
      }

      expect(mockNext).toHaveBeenCalled();
      expect(ResponseHandler.error).not.toHaveBeenCalled();
    });
  });
});
