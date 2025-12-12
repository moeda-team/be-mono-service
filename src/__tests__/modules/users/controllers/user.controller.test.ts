/* eslint-disable @typescript-eslint/no-explicit-any */
// Import the mock first
import mockPrisma from '../../../mocks/prisma.mock';

// Mock the modules before importing modules that use them
jest.mock('../../../../lib/prisma', () => mockPrisma);

// Now import other dependencies
import { UserController } from '../../../../modules/users/controllers/user.controller';
import { mockRequest, mockResponse } from '../../../mocks/express.mock';
import * as hashUtils from '../../../../utils/auth/hash';
jest.mock('../../../../utils/common/logger', () => ({
  logger: {
    info: jest.fn(),
    error: jest.fn(),
  },
}));

describe('UserController', () => {
  let userController: UserController;
  let hashPasswordMock: jest.SpyInstance;

  beforeEach(() => {
    userController = new UserController();
    // Reset all mocks
    jest.clearAllMocks();
    // Mock the hash function
    hashPasswordMock = jest.spyOn(hashUtils, 'hashPassword');
  });

  describe('getAllUsers', () => {
    it('should return all users successfully', async () => {
      // Arrange
      const req = mockRequest();
      const res = mockResponse();
      const mockUsers = [
        { id: '1', name: 'User 1', email: 'user1@example.com' },
        { id: '2', name: 'User 2', email: 'user2@example.com' },
      ];
      mockPrisma.user.findMany.mockResolvedValueOnce(mockUsers);

      // Act
      await userController.getAllUsers(req as any, res as any);

      // Assert
      expect(mockPrisma.user.findMany).toHaveBeenCalledWith({
        orderBy: { createdAt: 'desc' },
      });
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        status: 'success',
        message: 'Users retrieved successfully',
        data: mockUsers,
      });
    });

    it('should handle errors when getting all users', async () => {
      // Arrange
      const req = mockRequest();
      const res = mockResponse();
      mockPrisma.user.findMany.mockRejectedValueOnce(new Error('Database error'));

      // Act
      await userController.getAllUsers(req as any, res as any);

      // Assert
      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({
        status: 'error',
        message: 'Internal server error',
        data: null,
        error: undefined,
      });
    });
  });

  describe('getUserById', () => {
    it('should return a user by id successfully', async () => {
      // Arrange
      const userId = '1';
      const req = mockRequest({ params: { id: userId } });
      const res = mockResponse();
      const mockUser = { id: userId, name: 'User 1', email: 'user1@example.com' };
      mockPrisma.user.findUnique.mockResolvedValueOnce(mockUser);

      // Act
      await userController.getUserById(req as any, res as any);

      // Assert
      expect(mockPrisma.user.findUnique).toHaveBeenCalledWith({
        where: { id: userId },
      });
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        status: 'success',
        message: 'User retrieved successfully',
        data: mockUser,
      });
    });

    it('should return 404 if user is not found', async () => {
      // Arrange
      const userId = '999';
      const req = mockRequest({ params: { id: userId } });
      const res = mockResponse();
      mockPrisma.user.findUnique.mockResolvedValueOnce(null);

      // Act
      await userController.getUserById(req as any, res as any);

      // Assert
      expect(mockPrisma.user.findUnique).toHaveBeenCalledWith({
        where: { id: userId },
      });
      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({
        status: 'error',
        message: 'User not found',
        data: null,
        error: undefined,
      });
    });

    it('should handle errors when getting a user by id', async () => {
      // Arrange
      const userId = '1';
      const req = mockRequest({ params: { id: userId } });
      const res = mockResponse();
      mockPrisma.user.findUnique.mockRejectedValueOnce(new Error('Database error'));

      // Act
      await userController.getUserById(req as any, res as any);

      // Assert
      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({
        status: 'error',
        message: 'Internal server error',
        data: null,
        error: undefined,
      });
    });
  });

  describe('createUser', () => {
    it('should create a user successfully', async () => {
      // Arrange
      const userData = {
        outletId: '1',
        name: 'New User',
        position: 'Employee',
        email: 'newuser@example.com',
        password: 'password123',
        address: '123 Main St',
        gender: 'Male',
        phoneNumber: '1234567890',
        fee: 10,
        status: 'Active',
      };
      const req = mockRequest({ body: userData });
      const res = mockResponse();

      mockPrisma.user.findFirst.mockResolvedValueOnce(null);
      hashPasswordMock.mockResolvedValueOnce('hashedPassword123');

      const createdUser = { id: '1', ...userData, password: 'hashedPassword123' };
      mockPrisma.user.create.mockResolvedValueOnce(createdUser);

      // Act
      await userController.createUser(req as any, res as any);

      // Assert
      expect(mockPrisma.user.findFirst).toHaveBeenCalledWith({
        where: {
          OR: [{ email: userData.email }, { phoneNumber: userData.phoneNumber }],
        },
      });
      expect(hashPasswordMock).toHaveBeenCalledWith(userData.password);
      expect(mockPrisma.user.create).toHaveBeenCalledWith({
        data: {
          ...userData,
          password: 'hashedPassword123',
        },
      });
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        status: 'success',
        message: 'User created successfully',
        data: createdUser,
      });
    });

    it('should return 400 if user already exists', async () => {
      // Arrange
      const userData = {
        outletId: '1',
        name: 'New User',
        position: 'Employee',
        email: 'existinguser@example.com',
        password: 'password123',
        address: '123 Main St',
        gender: 'Male',
        phoneNumber: '1234567890',
        fee: 10,
        status: 'Active',
      };
      const req = mockRequest({ body: userData });
      const res = mockResponse();

      const existingUser = { id: '1', ...userData };
      mockPrisma.user.findFirst.mockResolvedValueOnce(existingUser);

      // Act
      await userController.createUser(req as any, res as any);

      // Assert
      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        status: 'error',
        message: 'User already exists',
        data: null,
        error: undefined,
      });
      expect(mockPrisma.user.create).not.toHaveBeenCalled();
    });

    it('should handle errors when creating a user', async () => {
      // Arrange
      const userData = {
        outletId: '1',
        name: 'New User',
        position: 'Employee',
        email: 'newuser@example.com',
        password: 'password123',
        address: '123 Main St',
        gender: 'Male',
        phoneNumber: '1234567890',
        fee: 10,
        status: 'Active',
      };
      const req = mockRequest({ body: userData });
      const res = mockResponse();

      mockPrisma.user.findFirst.mockResolvedValueOnce(null);
      hashPasswordMock.mockResolvedValueOnce('hashedPassword123');
      mockPrisma.user.create.mockRejectedValueOnce(new Error('Database error'));

      // Act
      await userController.createUser(req as any, res as any);

      // Assert
      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({
        status: 'error',
        message: 'Internal server error',
        data: null,
        error: undefined,
      });
    });
  });

  describe('updateUser', () => {
    it('should update a user successfully', async () => {
      // Arrange
      const userId = '1';
      const userData = {
        outletId: '1',
        name: 'Updated User',
        position: 'Manager',
        email: 'updateduser@example.com',
        address: '456 Main St',
        gender: 'Female',
        phoneNumber: '0987654321',
        fee: 15,
        status: 'Active',
      };
      const req = mockRequest({ params: { id: userId }, body: userData });
      const res = mockResponse();

      const existingUser = { id: userId, ...userData, email: 'olduser@example.com' };
      mockPrisma.user.findUnique.mockResolvedValueOnce(existingUser);
      mockPrisma.user.findFirst.mockResolvedValueOnce(null);

      const updatedUser = { id: userId, ...userData };
      mockPrisma.user.update.mockResolvedValueOnce(updatedUser);

      // Act
      await userController.updateUser(req as any, res as any);

      // Assert
      expect(mockPrisma.user.findUnique).toHaveBeenCalledWith({
        where: { id: userId },
      });
      expect(mockPrisma.user.update).toHaveBeenCalledWith({
        where: { id: userId },
        data: userData,
      });
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        status: 'success',
        message: 'User updated successfully',
        data: updatedUser,
      });
    });

    it('should return 404 if user to update is not found', async () => {
      // Arrange
      const userId = '999';
      const userData = {
        name: 'Updated User',
        email: 'updateduser@example.com',
      };
      const req = mockRequest({ params: { id: userId }, body: userData });
      const res = mockResponse();

      mockPrisma.user.findUnique.mockResolvedValueOnce(null);

      // Act
      await userController.updateUser(req as any, res as any);

      // Assert
      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({
        status: 'error',
        message: 'User not found',
        data: null,
        error: undefined,
      });
      expect(mockPrisma.user.update).not.toHaveBeenCalled();
    });

    it('should return 400 if updated email/phone already exists for another user', async () => {
      // Arrange
      const userId = '1';
      const userData = {
        outletId: '1',
        name: 'Updated User',
        email: 'existing@example.com',
        phoneNumber: '1234567890',
      };
      const req = mockRequest({ params: { id: userId }, body: userData });
      const res = mockResponse();

      const existingUser = { id: userId, name: 'Original User', email: 'original@example.com' };
      mockPrisma.user.findUnique.mockResolvedValueOnce(existingUser);

      const conflictUser = { id: '2', email: 'existing@example.com', phoneNumber: '1234567890' };
      mockPrisma.user.findFirst.mockResolvedValueOnce(conflictUser);

      // Act
      await userController.updateUser(req as any, res as any);

      // Assert
      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        status: 'error',
        message: 'User already exists',
        data: null,
        error: undefined,
      });
      expect(mockPrisma.user.update).not.toHaveBeenCalled();
    });

    it('should handle errors when updating a user', async () => {
      // Arrange
      const userId = '1';
      const userData = {
        name: 'Updated User',
        email: 'updateduser@example.com',
      };
      const req = mockRequest({ params: { id: userId }, body: userData });
      const res = mockResponse();

      mockPrisma.user.findUnique.mockResolvedValueOnce({ id: userId, name: 'Original User' });
      mockPrisma.user.findFirst.mockResolvedValueOnce(null);
      mockPrisma.user.update.mockRejectedValueOnce(new Error('Database error'));

      // Act
      await userController.updateUser(req as any, res as any);

      // Assert
      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({
        status: 'error',
        message: 'Internal server error',
        data: null,
        error: undefined,
      });
    });
  });

  describe('deleteUser', () => {
    it('should delete a user successfully', async () => {
      // Arrange
      const userId = '1';
      const req = mockRequest({ params: { id: userId } });
      const res = mockResponse();

      mockPrisma.user.findUnique.mockResolvedValueOnce({ id: userId, name: 'User to Delete' });
      mockPrisma.user.delete.mockResolvedValueOnce({ id: userId });

      // Act
      await userController.deleteUser(req as any, res as any);

      // Assert
      expect(mockPrisma.user.findUnique).toHaveBeenCalledWith({
        where: { id: userId },
      });
      expect(mockPrisma.user.delete).toHaveBeenCalledWith({
        where: { id: userId },
      });
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        status: 'success',
        message: 'User deleted successfully',
        data: null,
      });
    });

    it('should return 404 if user to delete is not found', async () => {
      // Arrange
      const userId = '999';
      const req = mockRequest({ params: { id: userId } });
      const res = mockResponse();

      mockPrisma.user.findUnique.mockResolvedValueOnce(null);

      // Act
      await userController.deleteUser(req as any, res as any);

      // Assert
      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({
        status: 'error',
        message: 'User not found',
        data: null,
        error: undefined,
      });
      expect(mockPrisma.user.delete).not.toHaveBeenCalled();
    });

    it('should handle Prisma not found error when deleting a user', async () => {
      // Arrange
      const userId = '1';
      const req = mockRequest({ params: { id: userId } });
      const res = mockResponse();

      mockPrisma.user.findUnique.mockResolvedValueOnce({ id: userId, name: 'User to Delete' });

      const prismaError = new Error('Record not found');
      Object.defineProperty(prismaError, 'code', { value: 'P2025' });
      mockPrisma.user.delete.mockRejectedValueOnce(prismaError);

      // Act
      await userController.deleteUser(req as any, res as any);

      // Assert
      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({
        status: 'error',
        message: 'User not found',
        data: null,
        error: undefined,
      });
    });

    it('should handle general errors when deleting a user', async () => {
      // Arrange
      const userId = '1';
      const req = mockRequest({ params: { id: userId } });
      const res = mockResponse();

      mockPrisma.user.findUnique.mockResolvedValueOnce({ id: userId, name: 'User to Delete' });
      mockPrisma.user.delete.mockRejectedValueOnce(new Error('Database error'));

      // Act
      await userController.deleteUser(req as any, res as any);

      // Assert
      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({
        status: 'error',
        message: 'Internal server error',
        data: null,
        error: undefined,
      });
    });
  });
});
