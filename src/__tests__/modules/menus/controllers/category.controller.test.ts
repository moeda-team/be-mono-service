import { Request, Response } from 'express';

// Import mocks first
import { mockRequest, mockResponse } from '../../../mocks/express.mock';
import mockPrisma from '../../../mocks/prisma.mock';

// Mock the modules
jest.mock('../../../../lib/prisma', () => mockPrisma);
jest.mock('../../../../utils/common/logger', () => ({
  logger: {
    info: jest.fn(),
    error: jest.fn(),
  },
}));

// Import the controller after mocking dependencies
import { CategoryController } from '../../../../modules/menus/controllers/category.controller';

describe('CategoryController', () => {
  let categoryController: CategoryController;

  beforeEach(() => {
    categoryController = new CategoryController();
    jest.clearAllMocks();
  });

  describe('findAll', () => {
    it('should return all categories for an outlet', async () => {
      // Arrange
      const mockCategories = [
        { id: 'category-123', name: 'Beverages', outletId: 'outlet-123' },
        { id: 'category-456', name: 'Food', outletId: 'outlet-123' },
      ];

      const req = mockRequest({
        params: { outletId: 'outlet-123' },
      });
      const res = mockResponse();

      mockPrisma.category.findMany.mockResolvedValueOnce(mockCategories);

      // Act
      await categoryController.findAll(req as Request, res as Response);

      // Assert
      expect(mockPrisma.category.findMany).toHaveBeenCalledWith({
        where: { outletId: 'outlet-123' },
        orderBy: { createdAt: 'desc' },
      });
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        status: 'success',
        message: 'Categories retrieved successfully',
        data: mockCategories,
      });
    });

    it('should handle errors when getting all categories', async () => {
      // Arrange
      const req = mockRequest({
        params: { outletId: 'outlet-123' },
      });
      const res = mockResponse();

      mockPrisma.category.findMany.mockRejectedValueOnce(new Error('Database error'));

      // Act
      await categoryController.findAll(req as Request, res as Response);

      // Assert
      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({
        status: 'error',
        message: 'Failed to fetch categories',
        data: null,
        error: undefined,
      });
    });
  });

  describe('findOne', () => {
    it('should return a category by id', async () => {
      // Arrange
      const mockCategory = {
        id: 'category-123',
        name: 'Beverages',
        outletId: 'outlet-123',
      };

      const req = mockRequest({
        params: { id: 'category-123', outletId: 'outlet-123' },
      });
      const res = mockResponse();

      mockPrisma.category.findUnique.mockResolvedValueOnce(mockCategory);

      // Act
      await categoryController.findOne(req as Request, res as Response);

      // Assert
      expect(mockPrisma.category.findUnique).toHaveBeenCalledWith({
        where: { id: 'category-123', outletId: 'outlet-123' },
      });
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        status: 'success',
        message: 'Category retrieved successfully',
        data: mockCategory,
      });
    });

    it('should return 404 if category is not found', async () => {
      // Arrange
      const req = mockRequest({
        params: { id: 'category-999', outletId: 'outlet-123' },
      });
      const res = mockResponse();

      mockPrisma.category.findUnique.mockResolvedValueOnce(null);

      // Act
      await categoryController.findOne(req as Request, res as Response);

      // Assert
      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({
        status: 'error',
        message: 'Category not found',
        data: null,
        error: undefined,
      });
    });

    it('should handle errors when getting category by id', async () => {
      // Arrange
      const req = mockRequest({
        params: { id: 'category-123', outletId: 'outlet-123' },
      });
      const res = mockResponse();

      mockPrisma.category.findUnique.mockRejectedValueOnce(new Error('Database error'));

      // Act
      await categoryController.findOne(req as Request, res as Response);

      // Assert
      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({
        status: 'error',
        message: 'Failed to fetch category',
        data: null,
        error: undefined,
      });
    });
  });

  describe('create', () => {
    it('should create a new category', async () => {
      // Arrange
      const categoryData = {
        name: 'New Category',
      };

      const mockCategory = {
        id: 'category-123',
        name: 'New Category',
        outletId: 'outlet-123',
      };

      const req = mockRequest({
        body: categoryData,
        user: { outletId: 'outlet-123' },
      });
      const res = mockResponse();

      mockPrisma.category.findFirst.mockResolvedValueOnce(null);
      mockPrisma.category.create.mockResolvedValueOnce(mockCategory);

      // Act
      await categoryController.create(req as any, res as Response);

      // Assert
      expect(mockPrisma.category.findFirst).toHaveBeenCalledWith({
        where: {
          name: categoryData.name,
          outletId: 'outlet-123',
        },
      });
      expect(mockPrisma.category.create).toHaveBeenCalledWith({
        data: {
          name: categoryData.name,
          outletId: 'outlet-123',
        },
      });
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        status: 'success',
        message: 'Category created successfully',
        data: mockCategory,
      });
    });

    it('should return 400 if category already exists', async () => {
      // Arrange
      const categoryData = {
        name: 'Existing Category',
      };

      const existingCategory = {
        id: 'category-123',
        name: 'Existing Category',
        outletId: 'outlet-123',
      };

      const req = mockRequest({
        body: categoryData,
        user: { outletId: 'outlet-123' },
      });
      const res = mockResponse();

      mockPrisma.category.findFirst.mockResolvedValueOnce(existingCategory);

      // Act
      await categoryController.create(req as any, res as Response);

      // Assert
      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        status: 'error',
        message: 'Category already exists',
        data: null,
        error: undefined,
      });
      expect(mockPrisma.category.create).not.toHaveBeenCalled();
    });

    it('should handle errors when creating a category', async () => {
      // Arrange
      const categoryData = {
        name: 'New Category',
      };

      const req = mockRequest({
        body: categoryData,
        user: { outletId: 'outlet-123' },
      });
      const res = mockResponse();

      mockPrisma.category.findFirst.mockRejectedValueOnce(new Error('Database error'));

      // Act
      await categoryController.create(req as any, res as Response);

      // Assert
      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({
        status: 'error',
        message: 'Failed to create category',
        data: null,
        error: undefined,
      });
    });
  });

  describe('update', () => {
    it('should update a category successfully', async () => {
      // Arrange
      const categoryData = {
        name: 'Updated Category',
      };

      const updatedCategory = {
        id: 'category-123',
        name: 'Updated Category',
        outletId: 'outlet-123',
      };

      const req = mockRequest({
        params: { id: 'category-123' },
        body: categoryData,
        user: { outletId: 'outlet-123' },
      });
      const res = mockResponse();

      mockPrisma.category.findFirst.mockResolvedValueOnce(null);
      mockPrisma.category.update.mockResolvedValueOnce(updatedCategory);

      // Act
      await categoryController.update(req as any, res as Response);

      // Assert
      expect(mockPrisma.category.findFirst).toHaveBeenCalledWith({
        where: {
          id: { not: 'category-123' },
          name: categoryData.name,
          outletId: 'outlet-123',
        },
      });
      expect(mockPrisma.category.update).toHaveBeenCalledWith({
        where: { id: 'category-123', outletId: 'outlet-123' },
        data: {
          name: categoryData.name,
          outletId: 'outlet-123',
        },
      });
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        status: 'success',
        message: 'Category updated successfully',
        data: updatedCategory,
      });
    });

    it('should return 400 if category name already exists', async () => {
      // Arrange
      const categoryData = {
        name: 'Existing Category',
      };

      const existingCategory = {
        id: 'category-456',
        name: 'Existing Category',
        outletId: 'outlet-123',
      };

      const req = mockRequest({
        params: { id: 'category-123' },
        body: categoryData,
        user: { outletId: 'outlet-123' },
      });
      const res = mockResponse();

      mockPrisma.category.findFirst.mockResolvedValueOnce(existingCategory);

      // Act
      await categoryController.update(req as any, res as Response);

      // Assert
      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        status: 'error',
        message: 'Category already exists',
        data: null,
        error: undefined,
      });
      expect(mockPrisma.category.update).not.toHaveBeenCalled();
    });

    it('should handle errors when updating a category', async () => {
      // Arrange
      const categoryData = {
        name: 'Updated Category',
      };

      const req = mockRequest({
        params: { id: 'category-123' },
        body: categoryData,
        user: { outletId: 'outlet-123' },
      });
      const res = mockResponse();

      mockPrisma.category.findFirst.mockRejectedValueOnce(new Error('Database error'));

      // Act
      await categoryController.update(req as any, res as Response);

      // Assert
      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({
        status: 'error',
        message: 'Failed to update category',
        data: null,
        error: undefined,
      });
    });

    it('should handle Prisma errors when updating a category', async () => {
      // Arrange
      const categoryData = {
        name: 'Updated Category',
      };

      const req = mockRequest({
        params: { id: 'category-123' },
        body: categoryData,
        user: { outletId: 'outlet-123' },
      });
      const res = mockResponse();

      mockPrisma.category.findFirst.mockResolvedValueOnce(null);
      mockPrisma.category.update.mockRejectedValueOnce(new Error('Database error'));

      // Act
      await categoryController.update(req as any, res as Response);

      // Assert
      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({
        status: 'error',
        message: 'Failed to update category',
        data: null,
        error: undefined,
      });
    });
  });

  describe('delete', () => {
    it('should delete a category successfully', async () => {
      // Arrange
      const existingCategory = {
        id: 'category-123',
        name: 'Category to Delete',
        outletId: 'outlet-123',
      };

      const req = mockRequest({
        params: { id: 'category-123' },
        user: { outletId: 'outlet-123' },
      });
      const res = mockResponse();

      mockPrisma.category.findFirst.mockResolvedValueOnce(existingCategory);
      mockPrisma.category.delete.mockResolvedValueOnce(existingCategory);

      // Act
      await categoryController.delete(req as any, res as Response);

      // Assert
      expect(mockPrisma.category.findFirst).toHaveBeenCalledWith({
        where: { id: 'category-123', outletId: 'outlet-123' },
      });
      expect(mockPrisma.category.delete).toHaveBeenCalledWith({
        where: { id: 'category-123', outletId: 'outlet-123' },
      });
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        status: 'success',
        message: 'Category deleted successfully',
        data: null,
      });
    });

    it('should return 404 if category is not found', async () => {
      // Arrange
      const req = mockRequest({
        params: { id: 'category-999' },
        user: { outletId: 'outlet-123' },
      });
      const res = mockResponse();

      mockPrisma.category.findFirst.mockResolvedValueOnce(null);

      // Act
      await categoryController.delete(req as any, res as Response);

      // Assert
      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({
        status: 'error',
        message: 'Category not found',
        data: null,
        error: undefined,
      });
      expect(mockPrisma.category.delete).not.toHaveBeenCalled();
    });

    it('should handle errors when deleting a category', async () => {
      // Arrange
      const req = mockRequest({
        params: { id: 'category-123' },
        user: { outletId: 'outlet-123' },
      });
      const res = mockResponse();

      mockPrisma.category.findFirst.mockRejectedValueOnce(new Error('Database error'));

      // Act
      await categoryController.delete(req as any, res as Response);

      // Assert
      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({
        status: 'error',
        message: 'Failed to delete category',
        data: null,
        error: undefined,
      });
    });

    it('should handle Prisma errors when deleting a category', async () => {
      // Arrange
      const existingCategory = {
        id: 'category-123',
        name: 'Category to Delete',
        outletId: 'outlet-123',
      };

      const req = mockRequest({
        params: { id: 'category-123' },
        user: { outletId: 'outlet-123' },
      });
      const res = mockResponse();

      mockPrisma.category.findFirst.mockResolvedValueOnce(existingCategory);
      mockPrisma.category.delete.mockRejectedValueOnce(new Error('Database error'));

      // Act
      await categoryController.delete(req as any, res as Response);

      // Assert
      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({
        status: 'error',
        message: 'Failed to delete category',
        data: null,
        error: undefined,
      });
    });
  });
});
