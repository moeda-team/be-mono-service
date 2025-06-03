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
import { MenuController } from '../../../../modules/menus/controllers/menu.controller';

describe('MenuController', () => {
  let menuController: MenuController;

  beforeEach(() => {
    menuController = new MenuController();
    jest.clearAllMocks();
  });

  describe('getAllMenus', () => {
    it('should return all menus for an outlet', async () => {
      // Arrange
      const req = mockRequest({
        params: { outletId: 'outlet-123' },
      });
      const res = mockResponse();

      const mockMenus = [
        { id: 'menu-1', name: 'Burger', outletId: 'outlet-123' },
        { id: 'menu-2', name: 'Pizza', outletId: 'outlet-123' },
      ];

      mockPrisma.menu.findMany.mockResolvedValueOnce(mockMenus);

      // Act
      await menuController.getAllMenus(req as Request, res as Response);

      // Assert
      expect(mockPrisma.menu.findMany).toHaveBeenCalledWith({
        where: { outletId: 'outlet-123' },
        orderBy: { createdAt: 'desc' },
      });
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        status: 'success',
        message: 'Menus retrieved successfully',
        data: mockMenus,
      });
    });

    it('should handle errors when getting all menus', async () => {
      // Arrange
      const req = mockRequest({
        params: { outletId: 'outlet-123' },
      });
      const res = mockResponse();

      mockPrisma.menu.findMany.mockRejectedValueOnce(new Error('Database error'));

      // Act
      await menuController.getAllMenus(req as Request, res as Response);

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

  describe('getMenuById', () => {
    it('should return a menu by id', async () => {
      // Arrange
      const req = mockRequest({
        params: { id: 'menu-123' },
      });
      const res = mockResponse();

      const mockMenu = { id: 'menu-123', name: 'Burger', outletId: 'outlet-123' };
      mockPrisma.menu.findUnique.mockResolvedValueOnce(mockMenu);

      // Act
      await menuController.getMenuById(req as Request, res as Response);

      // Assert
      expect(mockPrisma.menu.findUnique).toHaveBeenCalledWith({
        where: { id: 'menu-123' },
      });
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        status: 'success',
        message: 'Menu retrieved successfully',
        data: mockMenu,
      });
    });

    it('should return 404 if menu is not found', async () => {
      // Arrange
      const req = mockRequest({
        params: { id: 'menu-999' },
      });
      const res = mockResponse();

      mockPrisma.menu.findUnique.mockResolvedValueOnce(null);

      // Act
      await menuController.getMenuById(req as Request, res as Response);

      // Assert
      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({
        status: 'error',
        message: 'Menu not found',
        data: null,
        error: undefined,
      });
    });

    it('should handle errors when getting menu by id', async () => {
      // Arrange
      const req = mockRequest({
        params: { id: 'menu-123' },
      });
      const res = mockResponse();

      mockPrisma.menu.findUnique.mockRejectedValueOnce(new Error('Database error'));

      // Act
      await menuController.getMenuById(req as Request, res as Response);

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

  describe('getMenusByCategory', () => {
    it('should return menus by category', async () => {
      // Arrange
      const req = mockRequest({
        params: { outletId: 'outlet-123', categoryId: 'category-123' },
      });
      const res = mockResponse();

      const mockMenus = [
        { id: 'menu-1', name: 'Burger', categoryId: 'category-123', outletId: 'outlet-123' },
        { id: 'menu-2', name: 'Pizza', categoryId: 'category-123', outletId: 'outlet-123' },
      ];

      mockPrisma.menu.findMany.mockResolvedValueOnce(mockMenus);

      // Act
      await menuController.getMenusByCategory(req as Request, res as Response);

      // Assert
      expect(mockPrisma.menu.findMany).toHaveBeenCalledWith({
        where: { categoryId: 'category-123', outletId: 'outlet-123' },
      });
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        status: 'success',
        message: 'Menus retrieved successfully',
        data: mockMenus,
      });
    });

    it('should handle errors when getting menus by category', async () => {
      // Arrange
      const req = mockRequest({
        params: { outletId: 'outlet-123', categoryId: 'category-123' },
      });
      const res = mockResponse();

      mockPrisma.menu.findMany.mockRejectedValueOnce(new Error('Database error'));

      // Act
      await menuController.getMenusByCategory(req as Request, res as Response);

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

  describe('createMenu', () => {
    it('should create a new menu', async () => {
      // Arrange
      const menuData = {
        categoryId: 'category-123',
        name: 'New Burger',
        desc: 'Delicious burger',
        img: 'burger.jpg',
        price: 9.99,
        pdf: 'menu.pdf',
      };

      const req = mockRequest({
        body: menuData,
        user: { outletId: 'outlet-123' },
      });
      const res = mockResponse();

      const createdMenu = {
        id: 'menu-123',
        ...menuData,
        outletId: 'outlet-123',
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockPrisma.menu.create.mockResolvedValueOnce(createdMenu);

      // Act
      await menuController.createMenu(req as Request, res as Response);

      // Assert
      expect(mockPrisma.menu.create).toHaveBeenCalledWith({
        data: {
          outletId: 'outlet-123',
          categoryId: menuData.categoryId,
          name: menuData.name,
          desc: menuData.desc,
          img: menuData.img,
          price: menuData.price,
          pdf: menuData.pdf,
        },
      });
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        status: 'success',
        message: 'Menu created successfully',
        data: createdMenu,
      });
    });

    it('should handle errors when creating a menu', async () => {
      // Arrange
      const menuData = {
        categoryId: 'category-123',
        name: 'New Burger',
        desc: 'Delicious burger',
        img: 'burger.jpg',
        price: 9.99,
        pdf: 'menu.pdf',
      };

      const req = mockRequest({
        body: menuData,
        user: { outletId: 'outlet-123' },
      });
      const res = mockResponse();

      mockPrisma.menu.create.mockRejectedValueOnce(new Error('Database error'));

      // Act
      await menuController.createMenu(req as Request, res as Response);

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

  describe('updateMenu', () => {
    it('should update a menu successfully', async () => {
      // Arrange
      const menuData = {
        categoryId: 'category-123',
        name: 'Updated Burger',
        desc: 'Updated description',
        img: 'updated.jpg',
        price: 10.99,
        pdf: 'updated.pdf',
      };

      const req = mockRequest({
        params: { id: 'menu-123' },
        body: menuData,
        user: { outletId: 'outlet-123' },
      });
      const res = mockResponse();

      const existingMenu = {
        id: 'menu-123',
        categoryId: 'category-123',
        name: 'Old Burger',
        outletId: 'outlet-123',
      };

      const category = {
        id: 'category-123',
        name: 'Burgers',
      };

      const updatedMenu = {
        id: 'menu-123',
        ...menuData,
        outletId: 'outlet-123',
        updatedAt: new Date(),
      };

      mockPrisma.menu.findUnique.mockResolvedValueOnce(existingMenu);
      mockPrisma.category.findUnique.mockResolvedValueOnce(category);
      mockPrisma.menu.update.mockResolvedValueOnce(updatedMenu);

      // Act
      await menuController.updateMenu(req as Request, res as Response);

      // Assert
      expect(mockPrisma.menu.findUnique).toHaveBeenCalledWith({
        where: { id: 'menu-123', outletId: 'outlet-123' },
      });
      expect(mockPrisma.category.findUnique).toHaveBeenCalledWith({
        where: { id: 'category-123' },
      });
      expect(mockPrisma.menu.update).toHaveBeenCalledWith({
        where: { id: 'menu-123', outletId: 'outlet-123' },
        data: {
          outletId: 'outlet-123',
          categoryId: menuData.categoryId,
          name: menuData.name,
          desc: menuData.desc,
          img: menuData.img,
          price: menuData.price,
          pdf: menuData.pdf,
        },
      });
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        status: 'success',
        message: 'Menu updated successfully',
        data: updatedMenu,
      });
    });

    it('should return 404 if menu is not found', async () => {
      // Arrange
      const menuData = {
        categoryId: 'category-123',
        name: 'Updated Burger',
        desc: 'Updated description',
        img: 'updated.jpg',
        price: 10.99,
        pdf: 'updated.pdf',
      };

      const req = mockRequest({
        params: { id: 'menu-999' },
        body: menuData,
        user: { outletId: 'outlet-123' },
      });
      const res = mockResponse();

      mockPrisma.menu.findUnique.mockResolvedValueOnce(null);

      // Act
      await menuController.updateMenu(req as Request, res as Response);

      // Assert
      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({
        status: 'error',
        message: 'Menu not found',
        data: null,
        error: undefined,
      });
    });

    it('should return 404 if category is not found', async () => {
      // Arrange
      const menuData = {
        categoryId: 'category-999',
        name: 'Updated Burger',
        desc: 'Updated description',
        img: 'updated.jpg',
        price: 10.99,
        pdf: 'updated.pdf',
      };

      const req = mockRequest({
        params: { id: 'menu-123' },
        body: menuData,
        user: { outletId: 'outlet-123' },
      });
      const res = mockResponse();

      const existingMenu = {
        id: 'menu-123',
        categoryId: 'category-123',
        name: 'Old Burger',
        outletId: 'outlet-123',
      };

      mockPrisma.menu.findUnique.mockResolvedValueOnce(existingMenu);
      mockPrisma.category.findUnique.mockResolvedValueOnce(null);

      // Act
      await menuController.updateMenu(req as Request, res as Response);

      // Assert
      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({
        status: 'error',
        message: 'Category not found',
        data: null,
        error: undefined,
      });
    });

    it('should handle errors when updating a menu', async () => {
      // Arrange
      const menuData = {
        categoryId: 'category-123',
        name: 'Updated Burger',
        desc: 'Updated description',
        img: 'updated.jpg',
        price: 10.99,
        pdf: 'updated.pdf',
      };

      const req = mockRequest({
        params: { id: 'menu-123' },
        body: menuData,
        user: { outletId: 'outlet-123' },
      });
      const res = mockResponse();

      mockPrisma.menu.findUnique.mockRejectedValueOnce(new Error('Database error'));

      // Act
      await menuController.updateMenu(req as Request, res as Response);

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

  describe('deleteMenu', () => {
    it('should delete a menu successfully', async () => {
      // Arrange
      const req = mockRequest({
        params: { id: 'menu-123' },
        user: { outletId: 'outlet-123' },
      });
      const res = mockResponse();

      const existingMenu = {
        id: 'menu-123',
        name: 'Burger',
        outletId: 'outlet-123',
      };

      mockPrisma.menu.findUnique.mockResolvedValueOnce(existingMenu);
      mockPrisma.menu.delete.mockResolvedValueOnce(existingMenu);

      // Act
      await menuController.deleteMenu(req as Request, res as Response);

      // Assert
      expect(mockPrisma.menu.findUnique).toHaveBeenCalledWith({
        where: { id: 'menu-123', outletId: 'outlet-123' },
      });
      expect(mockPrisma.menu.delete).toHaveBeenCalledWith({
        where: { id: 'menu-123', outletId: 'outlet-123' },
      });
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        status: 'success',
        message: 'Menu deleted successfully',
        data: null,
      });
    });

    it('should return 404 if menu is not found', async () => {
      // Arrange
      const req = mockRequest({
        params: { id: 'menu-999' },
        user: { outletId: 'outlet-123' },
      });
      const res = mockResponse();

      mockPrisma.menu.findUnique.mockResolvedValueOnce(null);

      // Act
      await menuController.deleteMenu(req as Request, res as Response);

      // Assert
      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({
        status: 'error',
        message: 'Menu not found',
        data: null,
        error: undefined,
      });
    });

    it('should handle Prisma not found error when deleting', async () => {
      // Arrange
      const req = mockRequest({
        params: { id: 'menu-123' },
        user: { outletId: 'outlet-123' },
      });
      const res = mockResponse();

      const existingMenu = {
        id: 'menu-123',
        name: 'Burger',
        outletId: 'outlet-123',
      };

      mockPrisma.menu.findUnique.mockResolvedValueOnce(existingMenu);

      // Create a Prisma-like error with code property
      const prismaError = new Error('Record not found') as Error & { code: string };
      prismaError.code = 'P2025';
      mockPrisma.menu.delete.mockRejectedValueOnce(prismaError);

      // Act
      await menuController.deleteMenu(req as Request, res as Response);

      // Assert
      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({
        status: 'error',
        message: 'Menu not found',
        data: null,
        error: undefined,
      });
    });

    it('should handle general errors when deleting a menu', async () => {
      // Arrange
      const req = mockRequest({
        params: { id: 'menu-123' },
        user: { outletId: 'outlet-123' },
      });
      const res = mockResponse();

      const existingMenu = {
        id: 'menu-123',
        name: 'Burger',
        outletId: 'outlet-123',
      };

      mockPrisma.menu.findUnique.mockResolvedValueOnce(existingMenu);
      mockPrisma.menu.delete.mockRejectedValueOnce(new Error('Database error'));

      // Act
      await menuController.deleteMenu(req as Request, res as Response);

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

  describe('getBestMenus', () => {
    it('should return best menus for an outlet', async () => {
      // Arrange
      const req = mockRequest({
        params: { outletId: 'outlet-123' },
      });
      const res = mockResponse();

      const mockMenus = [
        { id: 'menu-1', name: 'Best Burger', outletId: 'outlet-123', isBest: true },
        { id: 'menu-2', name: 'Best Pizza', outletId: 'outlet-123', isBest: true },
      ];

      mockPrisma.menu.findMany.mockResolvedValueOnce(mockMenus);

      // Act
      await menuController.getBestMenus(req as Request, res as Response);

      // Assert
      expect(mockPrisma.menu.findMany).toHaveBeenCalledWith({
        where: { outletId: 'outlet-123', isBest: true },
      });
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        status: 'success',
        message: 'Menus retrieved successfully',
        data: mockMenus,
      });
    });

    it('should handle errors when getting best menus', async () => {
      // Arrange
      const req = mockRequest({
        params: { outletId: 'outlet-123' },
      });
      const res = mockResponse();

      mockPrisma.menu.findMany.mockRejectedValueOnce(new Error('Database error'));

      // Act
      await menuController.getBestMenus(req as Request, res as Response);

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
