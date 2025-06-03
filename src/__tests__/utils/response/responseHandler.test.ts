import { Response } from 'express';
import { ResponseHandler } from '../../../utils/response/responseHandler';
import { mockResponse } from '../../mocks/express.mock';

describe('ResponseHandler', () => {
  let res: Partial<Response>;

  beforeEach(() => {
    res = mockResponse();
  });

  describe('success', () => {
    it('should return a success response with default status code 200', () => {
      // Arrange
      const message = 'Success message';
      const data = { id: 1, name: 'Test' };

      // Act
      ResponseHandler.success(res as Response, { message, data });

      // Assert
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        status: 'success',
        message,
        data,
      });
    });

    it('should return a success response with custom status code', () => {
      // Arrange
      const message = 'Created successfully';
      const data = { id: 1, name: 'Test' };
      const statusCode = 201;

      // Act
      ResponseHandler.success(res as Response, { message, data, statusCode });

      // Assert
      expect(res.status).toHaveBeenCalledWith(201);
      expect(res.json).toHaveBeenCalledWith({
        status: 'success',
        message,
        data,
      });
    });

    it('should handle null data in success response', () => {
      // Arrange
      const message = 'Operation successful';
      const data = null;

      // Act
      ResponseHandler.success(res as Response, { message, data });

      // Assert
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        status: 'success',
        message,
        data,
      });
    });
  });

  describe('error', () => {
    it('should return an error response with default status code 500', () => {
      // Arrange
      const message = 'Error message';

      // Act
      ResponseHandler.error(res as Response, { message });

      // Assert
      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({
        status: 'error',
        message,
        data: null,
        error: undefined,
      });
    });

    it('should return an error response with custom status code', () => {
      // Arrange
      const message = 'Not found';
      const statusCode = 404;

      // Act
      ResponseHandler.error(res as Response, { message, statusCode });

      // Assert
      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({
        status: 'error',
        message,
        data: null,
        error: undefined,
      });
    });

    it('should include error details in error response', () => {
      // Arrange
      const message = 'Validation error';
      const statusCode = 400;
      const error = {
        code: 'VALIDATION_ERROR',
        details: { field: 'name', message: 'Name is required' },
      };

      // Act
      ResponseHandler.error(res as Response, { message, statusCode, error });

      // Assert
      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        status: 'error',
        message,
        data: null,
        error,
      });
    });
  });
});
