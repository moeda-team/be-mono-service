import { Request, Response, NextFunction } from 'express';
import { validateCreateMenu, validateUpdateMenu } from '../../../../modules/menus/validators/menu.validator';
import { ResponseHandler } from '../../../../utils/response/responseHandler';

// Mock ResponseHandler
jest.mock('../../../../utils/response/responseHandler', () => ({
  ResponseHandler: {
    error: jest.fn().mockReturnValue({ mockedErrorResponse: true }),
  },
}));

describe('Menu Validators', () => {
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

  describe('validateCreateMenu', () => {
    it('should call next() when all validations pass', async () => {
      mockRequest.body = {
        name: 'Test Menu',
        desc: 'Test Description',
        img: 'https://example.com/image.jpg',
        price: 10.99,
      };

      // Execute all middleware functions in the validateCreateMenu array
      for (const middleware of validateCreateMenu) {
        await middleware(mockRequest as Request, mockResponse as Response, mockNext);
      }

      expect(mockNext).toHaveBeenCalled();
      expect(ResponseHandler.error).not.toHaveBeenCalled();
    });

    it('should return error when name is missing', async () => {
      mockRequest.body = {
        desc: 'Test Description',
        img: 'https://example.com/image.jpg',
        price: 10.99,
      };

      // Execute all middleware functions in the validateCreateMenu array
      for (const middleware of validateCreateMenu) {
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

    it('should return error when description is missing', async () => {
      mockRequest.body = {
        name: 'Test Menu',
        img: 'https://example.com/image.jpg',
        price: 10.99,
      };

      // Execute all middleware functions in the validateCreateMenu array
      for (const middleware of validateCreateMenu) {
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

    it('should return error when image URL is missing', async () => {
      mockRequest.body = {
        name: 'Test Menu',
        desc: 'Test Description',
        price: 10.99,
      };

      // Execute all middleware functions in the validateCreateMenu array
      for (const middleware of validateCreateMenu) {
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

    it('should return error when image URL is invalid', async () => {
      mockRequest.body = {
        name: 'Test Menu',
        desc: 'Test Description',
        img: 'not-a-url',
        price: 10.99,
      };

      // Execute all middleware functions in the validateCreateMenu array
      for (const middleware of validateCreateMenu) {
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

    it('should return error when price is missing', async () => {
      mockRequest.body = {
        name: 'Test Menu',
        desc: 'Test Description',
        img: 'https://example.com/image.jpg',
      };

      // Execute all middleware functions in the validateCreateMenu array
      for (const middleware of validateCreateMenu) {
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

    it('should return error when price is not a number', async () => {
      mockRequest.body = {
        name: 'Test Menu',
        desc: 'Test Description',
        img: 'https://example.com/image.jpg',
        price: 'not-a-number',
      };

      // Execute all middleware functions in the validateCreateMenu array
      for (const middleware of validateCreateMenu) {
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

    it('should return error when price is negative', async () => {
      mockRequest.body = {
        name: 'Test Menu',
        desc: 'Test Description',
        img: 'https://example.com/image.jpg',
        price: -10.99,
      };

      // Execute all middleware functions in the validateCreateMenu array
      for (const middleware of validateCreateMenu) {
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

    it('should validate optional PDF URL if provided', async () => {
      mockRequest.body = {
        name: 'Test Menu',
        desc: 'Test Description',
        img: 'https://example.com/image.jpg',
        price: 10.99,
        pdf: 'not-a-url',
      };

      // Execute all middleware functions in the validateCreateMenu array
      for (const middleware of validateCreateMenu) {
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

    it('should accept valid PDF URL if provided', async () => {
      mockRequest.body = {
        name: 'Test Menu',
        desc: 'Test Description',
        img: 'https://example.com/image.jpg',
        price: 10.99,
        pdf: 'https://example.com/menu.pdf',
      };

      // Execute all middleware functions in the validateCreateMenu array
      for (const middleware of validateCreateMenu) {
        await middleware(mockRequest as Request, mockResponse as Response, mockNext);
      }

      expect(mockNext).toHaveBeenCalled();
      expect(ResponseHandler.error).not.toHaveBeenCalled();
    });
  });

  describe('validateUpdateMenu', () => {
    it('should call next() when all validations pass', async () => {
      mockRequest.body = {
        name: 'Updated Menu',
        desc: 'Updated Description',
        img: 'https://example.com/updated-image.jpg',
        price: 15.99,
      };

      // Execute all middleware functions in the validateUpdateMenu array
      for (const middleware of validateUpdateMenu) {
        await middleware(mockRequest as Request, mockResponse as Response, mockNext);
      }

      expect(mockNext).toHaveBeenCalled();
      expect(ResponseHandler.error).not.toHaveBeenCalled();
    });

    it('should return error when validation fails for update', async () => {
      mockRequest.body = {
        name: '',
        desc: 'Updated Description',
        img: 'https://example.com/updated-image.jpg',
        price: 15.99,
      };

      // Execute all middleware functions in the validateUpdateMenu array
      for (const middleware of validateUpdateMenu) {
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
  });
});
