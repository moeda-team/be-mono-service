import { Request, Response } from 'express';
import { basicAuth } from '../../middlewares/auth.middlewares';
import { mockRequest, mockResponse, mockNext } from '../mocks/express.mock';

describe('Basic Auth Middleware', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    jest.resetModules();
    process.env = { ...originalEnv };
    process.env.AUTH_USERNAME = 'testuser';
    process.env.AUTH_PASSWORD = 'testpassword';
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  it('should return 401 if authorization header is missing', () => {
    // Arrange
    const req = mockRequest();
    const res = mockResponse();

    // Act
    basicAuth(req as Request, res as Response, mockNext);

    // Assert
    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({
        status: 'error',
        message: 'Authorization header is required',
      }),
    );
    expect(mockNext).not.toHaveBeenCalled();
  });

  it('should return 401 if authorization header does not start with Basic', () => {
    // Arrange
    const req = mockRequest({
      headers: { authorization: 'Bearer token123' },
    });
    const res = mockResponse();

    // Act
    basicAuth(req as Request, res as Response, mockNext);

    // Assert
    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({
        status: 'error',
        message: 'Basic authentication is required',
      }),
    );
    expect(mockNext).not.toHaveBeenCalled();
  });

  it('should return 500 if AUTH_USERNAME or AUTH_PASSWORD is not set', () => {
    // Arrange
    delete process.env.AUTH_USERNAME;

    const base64Credentials = Buffer.from('testuser:testpassword').toString('base64');
    const req = mockRequest({
      headers: { authorization: `Basic ${base64Credentials}` },
    });
    const res = mockResponse();

    // Act
    basicAuth(req as Request, res as Response, mockNext);

    // Assert
    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({
        status: 'error',
        message: 'Authentication configuration is missing',
      }),
    );
    expect(mockNext).not.toHaveBeenCalled();
  });

  it('should return 401 if credentials are invalid', () => {
    // Arrange
    const base64Credentials = Buffer.from('wronguser:wrongpassword').toString('base64');
    const req = mockRequest({
      headers: { authorization: `Basic ${base64Credentials}` },
    });
    const res = mockResponse();

    // Act
    basicAuth(req as Request, res as Response, mockNext);

    // Assert
    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({
        status: 'error',
        message: 'Invalid credentials',
      }),
    );
    expect(mockNext).not.toHaveBeenCalled();
  });

  it('should call next if credentials are valid', () => {
    // Arrange
    const base64Credentials = Buffer.from('testuser:testpassword').toString('base64');
    const req = mockRequest({
      headers: { authorization: `Basic ${base64Credentials}` },
    });
    const res = mockResponse();

    // Act
    basicAuth(req as Request, res as Response, mockNext);

    // Assert
    expect(mockNext).toHaveBeenCalled();
    expect(res.status).not.toHaveBeenCalled();
    expect(res.json).not.toHaveBeenCalled();
  });
});
