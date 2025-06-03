import { Request, Response } from 'express';
import { notFoundHandler } from '../../middlewares/notFoundHandler.middlewares';
import { mockRequest } from '../mocks/express.mock';
import { AppError } from '../../middlewares/errorHandler.middlewares';

describe('Not Found Handler Middleware', () => {
  it('should throw an AppError with 404 status and the correct message', () => {
    // Arrange
    const req = mockRequest();
    req.originalUrl = '/unknown-route';

    // Act & Assert
    expect(() => {
      notFoundHandler(req as Request, {} as Response);
    }).toThrow(AppError);

    try {
      notFoundHandler(req as Request, {} as Response);
    } catch (error) {
      expect(error).toBeInstanceOf(AppError);
      expect((error as AppError).statusCode).toBe(404);
      expect((error as AppError).message).toBe('Route /unknown-route not found');
    }
  });
});
