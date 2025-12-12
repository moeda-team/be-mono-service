// Import the mock first using ES module syntax
import mockPrisma from '../../../mocks/prisma.mock';

// Mock the modules before importing modules that use them
jest.mock('../../../../lib/prisma', () => mockPrisma);

// Now import other dependencies
import { Request, Response } from 'express';
import { AuthController } from '../../../../modules/users/controllers/auth.controller';
import { mockRequest, mockResponse } from '../../../mocks/express.mock';
import * as hashUtils from '../../../../utils/auth/hash';
import * as jwtUtils from '../../../../utils/auth/jwt';
jest.mock('../../../../utils/common/logger', () => ({
  logger: {
    info: jest.fn(),
    error: jest.fn(),
  },
}));

describe('AuthController', () => {
  let authController: AuthController;
  let comparePasswordMock: jest.SpyInstance;
  let signTokenMock: jest.SpyInstance;

  beforeEach(() => {
    authController = new AuthController();
    // Reset all mocks
    jest.clearAllMocks();
    // Mock the hash and JWT functions
    comparePasswordMock = jest.spyOn(hashUtils, 'comparePassword');
    signTokenMock = jest.spyOn(jwtUtils, 'signToken');
    // Set environment variables for testing
    process.env.JWT_ACCESS_EXPIRES_IN = '3600';
  });

  describe('login', () => {
    it('should return 400 if email or password is missing', async () => {
      // Arrange
      const req = mockRequest({ body: { email: '' } });
      const res = mockResponse();

      // Act
      await authController.login(req as unknown as Request, res as unknown as Response);

      // Assert
      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          status: 'error',
          message: 'Email and password are required',
        }),
      );
    });

    it('should return 401 if user is not found', async () => {
      // Arrange
      const req = mockRequest({
        body: { email: 'test@example.com', password: 'password123' },
      });
      const res = mockResponse();
      mockPrisma.user.findFirst.mockResolvedValueOnce(null);

      // Act
      await authController.login(req as unknown as Request, res as unknown as Response);

      // Assert
      expect(mockPrisma.user.findFirst).toHaveBeenCalledWith({
        where: { email: 'test@example.com' },
      });
      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          status: 'error',
          message: 'Invalid credentials',
        }),
      );
    });

    it('should return 401 if password does not match', async () => {
      // Arrange
      const req = mockRequest({
        body: { email: 'test@example.com', password: 'password123' },
      });
      const res = mockResponse();
      mockPrisma.user.findFirst.mockResolvedValueOnce({
        id: '1',
        email: 'test@example.com',
        password: 'hashedPassword',
        outletId: '1',
      });
      comparePasswordMock.mockResolvedValueOnce(false);

      // Act
      await authController.login(req as unknown as Request, res as unknown as Response);

      // Assert
      expect(comparePasswordMock).toHaveBeenCalledWith('password123', 'hashedPassword');
      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          status: 'error',
          message: 'Invalid credentials',
        }),
      );
    });

    it('should return 200 and token if login is successful', async () => {
      // Arrange
      const req = mockRequest({
        body: { email: 'test@example.com', password: 'password123' },
      });
      const res = mockResponse();
      mockPrisma.user.findFirst.mockResolvedValueOnce({
        id: '1',
        email: 'test@example.com',
        password: 'hashedPassword',
        outletId: '1',
      });
      comparePasswordMock.mockResolvedValueOnce(true);
      signTokenMock.mockReturnValueOnce('mocked-jwt-token');

      // Act
      await authController.login(req as unknown as Request, res as unknown as Response);

      // Assert
      expect(signTokenMock).toHaveBeenCalledWith({ userId: '1', outletId: '1' });
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          status: 'success',
          message: 'Login successful',
          data: expect.objectContaining({
            token_type: 'Bearer',
            access_token: 'mocked-jwt-token',
          }),
        }),
      );
    });

    it('should return 500 if an error occurs', async () => {
      // Arrange
      const req = mockRequest({
        body: { email: 'test@example.com', password: 'password123' },
      });
      const res = mockResponse();
      mockPrisma.user.findFirst.mockRejectedValueOnce(new Error('Database error'));

      // Act
      await authController.login(req as unknown as Request, res as unknown as Response);

      // Assert
      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          status: 'error',
          message: 'Internal server error',
        }),
      );
    });
  });
});
