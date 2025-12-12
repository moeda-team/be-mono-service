import { Request, Response, NextFunction } from 'express';

// Create a mock module with a getter for isProduction
// Define this before any imports that might use it
const mockConfig = {
  get isProduction() {
    return false; // Default to development mode
  },
  config: {
    nodeEnv: 'test',
    port: 3000,
    apiPrefix: '/api',
    corsOrigin: '*',
  },
};

// Mock modules before importing the modules that use them
jest.mock('../../config', () => mockConfig);

// Mock the logger
jest.mock('../../utils/common/logger', () => ({
  logger: {
    error: jest.fn(),
  },
}));

// Now import the modules that depend on the mocks
import { errorHandler, AppError } from '../../middlewares/errorHandler.middlewares';
import { mockRequest, mockResponse, mockNext } from '../mocks/express.mock';

describe('Error Handler Middleware', () => {
  let req: Partial<Request>;
  let res: Partial<Response>;
  let next: NextFunction;

  beforeEach(() => {
    jest.clearAllMocks();
    req = mockRequest();
    res = mockResponse();
    next = mockNext;
  });

  describe('AppError', () => {
    it('should create an AppError with correct properties', () => {
      // Act
      const error = new AppError(400, 'Bad request', 'VALIDATION_ERROR', { field: 'name' });

      // Assert
      expect(error).toBeInstanceOf(Error);
      expect(error).toBeInstanceOf(AppError);
      expect(error.statusCode).toBe(400);
      expect(error.message).toBe('Bad request');
      expect(error.code).toBe('VALIDATION_ERROR');
      expect(error.details).toEqual({ field: 'name' });
      expect(error.isOperational).toBe(true);
    });

    it('should create an AppError with default values', () => {
      // Act
      const error = new AppError(500, 'Server error');

      // Assert
      expect(error.statusCode).toBe(500);
      expect(error.message).toBe('Server error');
      expect(error.code).toBeUndefined();
      expect(error.details).toBeUndefined();
      expect(error.isOperational).toBe(true);
    });
  });

  describe('errorHandler', () => {
    it('should handle AppError correctly', () => {
      // Arrange
      const appError = new AppError(400, 'Bad request', 'VALIDATION_ERROR', { field: 'name' });

      // Act
      errorHandler(appError, req as Request, res as Response, next);

      // Assert
      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        status: 'error',
        message: 'Bad request',
        data: null,
        error: {
          code: 'VALIDATION_ERROR',
          details: { field: 'name' },
        },
      });
    });

    it('should handle regular Error in production mode', () => {
      // Arrange
      const regularError = new Error('Something went wrong');
      // Override the mock for this test
      Object.defineProperty(mockConfig, 'isProduction', {
        get: jest.fn().mockReturnValue(true),
        configurable: true,
      });

      // Act
      errorHandler(regularError, req as Request, res as Response, next);

      // Assert
      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({
        status: 'error',
        message: 'Internal server error',
        data: null,
        error: {
          code: 'INTERNAL_SERVER_ERROR',
          details: undefined,
        },
      });
    });

    it('should handle regular Error in development mode', () => {
      // Arrange
      const regularError = new Error('Something went wrong');
      // Override the mock for this test
      Object.defineProperty(mockConfig, 'isProduction', {
        get: jest.fn().mockReturnValue(false),
        configurable: true,
      });

      // Act
      errorHandler(regularError, req as Request, res as Response, next);

      // Assert
      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({
        status: 'error',
        message: 'Something went wrong',
        data: null,
        error: {
          code: 'INTERNAL_SERVER_ERROR',
          details: regularError,
        },
      });
    });
  });
});
