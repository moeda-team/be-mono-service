/* eslint-disable @typescript-eslint/no-explicit-any */
// Import the mock first
import mockPrisma from '../mocks/prisma.mock';

// Mock the prisma client before importing modules that use it
jest.mock('../../lib/prisma', () => mockPrisma);

// Now import other dependencies
import { Request, Response } from 'express';
import { roleAuth } from '../../middlewares/roleAuth.middlewares';
import { UserRole } from '../../utils/auth/jwt';
import * as jwtUtils from '../../utils/auth/jwt';
import { mockRequest, mockResponse, mockNext } from '../mocks/express.mock';

describe('Role Authentication Middleware', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should return 404 if user is not found', async () => {
    // Arrange
    const req = mockRequest();
    (req as any).user = { userId: '999' };
    const res = mockResponse();
    const next = mockNext;

    mockPrisma.user.findUnique.mockResolvedValueOnce(null);

    const middleware = roleAuth(UserRole.OWNER);

    // Act
    await middleware(req as Request, res as Response, next);

    // Assert
    expect(mockPrisma.user.findUnique).toHaveBeenCalledWith({
      where: { id: '999' },
    });
    expect(res.status).toHaveBeenCalledWith(404);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({
        status: 'error',
        message: 'User not found',
      }),
    );
    expect(next).not.toHaveBeenCalled();
  });

  it('should return 403 if user has insufficient permissions', async () => {
    // Arrange
    const req = mockRequest();
    (req as any).user = { userId: '123' };
    const res = mockResponse();
    const next = mockNext;

    mockPrisma.user.findUnique.mockResolvedValueOnce({
      id: '123',
      role: UserRole.EMPLOYEE,
    });

    jest.spyOn(jwtUtils, 'hasPermission').mockReturnValueOnce(false);

    const middleware = roleAuth(UserRole.OWNER);

    // Act
    await middleware(req as Request, res as Response, next);

    // Assert
    expect(mockPrisma.user.findUnique).toHaveBeenCalledWith({
      where: { id: '123' },
    });
    expect(jwtUtils.hasPermission).toHaveBeenCalledWith(UserRole.EMPLOYEE, UserRole.OWNER);
    expect(res.status).toHaveBeenCalledWith(403);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({
        status: 'error',
        message: 'Insufficient permissions',
      }),
    );
    expect(next).not.toHaveBeenCalled();
  });

  it('should call next if user has sufficient permissions', async () => {
    // Arrange
    const req = mockRequest();
    (req as any).user = { userId: '123' };
    const res = mockResponse();
    const next = mockNext;

    mockPrisma.user.findUnique.mockResolvedValueOnce({
      id: '123',
      role: UserRole.OWNER,
    });

    jest.spyOn(jwtUtils, 'hasPermission').mockReturnValueOnce(true);

    const middleware = roleAuth(UserRole.OWNER);

    // Act
    await middleware(req as Request, res as Response, next);

    // Assert
    expect(mockPrisma.user.findUnique).toHaveBeenCalledWith({
      where: { id: '123' },
    });
    expect(jwtUtils.hasPermission).toHaveBeenCalledWith(UserRole.OWNER, UserRole.OWNER);
    expect(next).toHaveBeenCalled();
    expect(res.status).not.toHaveBeenCalled();
    expect(res.json).not.toHaveBeenCalled();
  });

  it('should return 403 if user has no role', async () => {
    // Arrange
    const req = mockRequest();
    (req as any).user = { userId: '123' };
    const res = mockResponse();
    const next = mockNext;

    mockPrisma.user.findUnique.mockResolvedValueOnce({
      id: '123',
      role: null,
    });

    const middleware = roleAuth(UserRole.EMPLOYEE);

    // Act
    await middleware(req as Request, res as Response, next);

    // Assert
    expect(mockPrisma.user.findUnique).toHaveBeenCalledWith({
      where: { id: '123' },
    });
    expect(res.status).toHaveBeenCalledWith(403);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({
        status: 'error',
        message: 'Insufficient permissions',
      }),
    );
    expect(next).not.toHaveBeenCalled();
  });
});
