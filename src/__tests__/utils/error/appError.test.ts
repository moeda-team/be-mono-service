import { AppError } from '../../../middlewares/errorHandler.middlewares';

describe('AppError', () => {
  it('should create an AppError instance with required properties', () => {
    // Arrange & Act
    const statusCode = 400;
    const message = 'Bad Request';
    const error = new AppError(statusCode, message);

    // Assert
    expect(error).toBeInstanceOf(Error);
    expect(error).toBeInstanceOf(AppError);
    expect(error.statusCode).toBe(statusCode);
    expect(error.message).toBe(message);
    expect(error.isOperational).toBe(true);
    expect(error.code).toBeUndefined();
    expect(error.details).toBeUndefined();
  });

  it('should create an AppError instance with all properties', () => {
    // Arrange & Act
    const statusCode = 404;
    const message = 'Not Found';
    const code = 'RESOURCE_NOT_FOUND';
    const details = { resource: 'user', id: '123' };
    const isOperational = false;
    const error = new AppError(statusCode, message, code, details, isOperational);

    // Assert
    expect(error).toBeInstanceOf(Error);
    expect(error).toBeInstanceOf(AppError);
    expect(error.statusCode).toBe(statusCode);
    expect(error.message).toBe(message);
    expect(error.code).toBe(code);
    expect(error.details).toBe(details);
    expect(error.isOperational).toBe(isOperational);
  });

  it('should maintain prototype chain for instanceof checks', () => {
    // Arrange & Act
    const error = new AppError(500, 'Server Error');

    // Assert
    expect(Object.getPrototypeOf(error)).toBe(AppError.prototype);
    expect(error instanceof Error).toBe(true);
    expect(error instanceof AppError).toBe(true);
  });

  it('should allow error to be thrown and caught', () => {
    // Arrange
    const throwError = () => {
      throw new AppError(403, 'Forbidden');
    };

    // Act & Assert
    expect(throwError).toThrow(AppError);
    expect(throwError).toThrow('Forbidden');

    try {
      throwError();
    } catch (error) {
      expect(error).toBeInstanceOf(AppError);
      expect((error as AppError).statusCode).toBe(403);
    }
  });
});
