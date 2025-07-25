/* eslint-disable @typescript-eslint/no-explicit-any */
import { Request, Response } from 'express';
import { jwtAuth, jwtAuthNotRequired } from '../../middlewares/jwtAuth.middlewares';
import * as jwtUtils from '../../utils/auth/jwt';
import { mockRequest, mockResponse, mockNext } from '../mocks/express.mock';

// Mock the JWT utility
jest.mock('../../utils/auth/jwt');

describe('JWT Authentication Middleware', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('jwtAuth', () => {
    it('should return 401 if authorization header is missing', () => {
      // Arrange
      const req = mockRequest();
      const res = mockResponse();
      const next = mockNext;

      // Act
      jwtAuth(req as Request, res as Response, next);

      // Assert
      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          status: 'error',
          message: 'Authorization header missing or invalid',
        }),
      );
      expect(next).not.toHaveBeenCalled();
    });

    it('should return 401 if authorization header does not start with Bearer', () => {
      // Arrange
      const req = mockRequest({
        headers: { authorization: 'Basic token123' },
      });
      const res = mockResponse();
      const next = mockNext;

      // Act
      jwtAuth(req as Request, res as Response, next);

      // Assert
      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          status: 'error',
          message: 'Authorization header missing or invalid',
        }),
      );
      expect(next).not.toHaveBeenCalled();
    });

    it('should return 401 if token is invalid', () => {
      // Arrange
      const req = mockRequest({
        headers: { authorization: 'Bearer invalid-token' },
      });
      const res = mockResponse();
      const next = mockNext;

      // Mock verifyToken to throw an error
      jest.spyOn(jwtUtils, 'verifyToken').mockImplementation(() => {
        throw new Error('Invalid token');
      });

      // Act
      jwtAuth(req as Request, res as Response, next);

      // Assert
      expect(jwtUtils.verifyToken).toHaveBeenCalledWith('invalid-token');
      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          status: 'error',
          message: 'Invalid or expired token',
        }),
      );
      expect(next).not.toHaveBeenCalled();
    });

    it('should call next and set user in request if token is valid', () => {
      // Arrange
      const req = mockRequest({
        headers: { authorization: 'Bearer valid-token' },
      });
      const res = mockResponse();
      const next = mockNext;

      const mockPayload = { userId: '123', outletId: '456' };
      jest.spyOn(jwtUtils, 'verifyToken').mockReturnValue(mockPayload as any);

      // Act
      jwtAuth(req as Request, res as Response, next);

      // Assert
      expect(jwtUtils.verifyToken).toHaveBeenCalledWith('valid-token');
      expect((req as any).user).toEqual(mockPayload);
      expect(next).toHaveBeenCalled();
      expect(res.status).not.toHaveBeenCalled();
      expect(res.json).not.toHaveBeenCalled();
    });
  });

  describe('jwtAuthNotRequired', () => {
    it('should call next if authorization header is missing', () => {
      // Arrange
      const req = mockRequest();
      const res = mockResponse();
      const next = mockNext;

      // Act
      jwtAuthNotRequired(req as Request, res as Response, next);

      // Assert
      expect(next).toHaveBeenCalled();
      expect(res.status).not.toHaveBeenCalled();
      expect(res.json).not.toHaveBeenCalled();
    });

    it('should call next if authorization header does not start with Bearer', () => {
      // Arrange
      const req = mockRequest({
        headers: { authorization: 'Basic token123' },
      });
      const res = mockResponse();
      const next = mockNext;

      // Act
      jwtAuthNotRequired(req as Request, res as Response, next);

      // Assert
      expect(next).toHaveBeenCalled();
      expect(res.status).not.toHaveBeenCalled();
      expect(res.json).not.toHaveBeenCalled();
    });

    it('should call next if token is invalid', () => {
      // Arrange
      const req = mockRequest({
        headers: { authorization: 'Bearer invalid-token' },
      });
      const res = mockResponse();
      const next = mockNext;

      // Mock verifyToken to throw an error
      jest.spyOn(jwtUtils, 'verifyToken').mockImplementation(() => {
        throw new Error('Invalid token');
      });

      // Act
      jwtAuthNotRequired(req as Request, res as Response, next);

      // Assert
      expect(jwtUtils.verifyToken).toHaveBeenCalledWith('invalid-token');
      expect(next).toHaveBeenCalled();
      expect(res.status).not.toHaveBeenCalled();
      expect(res.json).not.toHaveBeenCalled();
    });

    it('should call next and set user in request if token is valid', () => {
      // Arrange
      const req = mockRequest({
        headers: { authorization: 'Bearer valid-token' },
      });
      const res = mockResponse();
      const next = mockNext;

      const mockPayload = { userId: '123', outletId: '456' };
      jest.spyOn(jwtUtils, 'verifyToken').mockReturnValue(mockPayload as any);

      // Act
      jwtAuthNotRequired(req as Request, res as Response, next);

      // Assert
      expect(jwtUtils.verifyToken).toHaveBeenCalledWith('valid-token');
      expect((req as any).user).toEqual(mockPayload);
      expect(next).toHaveBeenCalled();
      expect(res.status).not.toHaveBeenCalled();
      expect(res.json).not.toHaveBeenCalled();
    });
  });
});
