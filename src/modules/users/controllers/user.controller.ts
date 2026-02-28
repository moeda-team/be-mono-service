import { Request, Response } from 'express';
import { logger } from '../../../utils/common/logger';
import { CreateUserDTO, UpdateUserDTO } from '../models/user';
import { ResponseHandler } from '../../../utils/response/responseHandler';
import prisma from '../../../config/database';
import { hashPassword } from '../../../utils/auth/hash';
import { Prisma } from '@prisma/client';

export class UserController {
  async getAllUsers(req: Request, res: Response) {
    const page = parseInt(req.query.page as string) || null;
    const limit = parseInt(req.query.limit as string) || null;
    const search = (req.query.search as string)?.trim() || null;

    const skip = page && limit ? (page - 1) * limit : undefined;
    const take = limit || undefined;

    try {
      const where: Prisma.UserWhereInput = {};

      if (search) {
        where.OR = [
          { name: { contains: search, mode: 'insensitive' } },
          { email: { contains: search, mode: 'insensitive' } },
          { phoneNumber: { contains: search, mode: 'insensitive' } },
        ];
      }

      const users = await prisma.user.findMany({
        where,
        orderBy: {
          createdAt: 'desc',
        },
        skip,
        take,
      });

      if (page && limit) {
        const total = await prisma.user.count({ where });
        return ResponseHandler.success(res, {
          message: 'Users retrieved successfully',
          data: users,
          pagination: {
            page,
            limit,
            total,
            totalPages: Math.ceil(total / limit),
          },
        });
      }

      return ResponseHandler.success(res, {
        message: 'Users retrieved successfully',
        data: users,
      });
    } catch (error) {
      logger.error('Error getting users:', error);
      return ResponseHandler.error(res, {
        message: 'Internal server error',
        statusCode: 500,
      });
    }
  }

  async getUserById(req: Request, res: Response) {
    const { id } = req.params;

    try {
      const user = await prisma.user.findUnique({
        where: { id },
      });
      if (!user) {
        return ResponseHandler.error(res, {
          message: 'User not found',
          statusCode: 404,
        });
      }

      return ResponseHandler.success(res, {
        message: 'User retrieved successfully',
        data: user,
      });
    } catch (error) {
      logger.error('Error getting user:', error);
      return ResponseHandler.error(res, {
        message: 'Internal server error',
        statusCode: 500,
      });
    }
  }

  async createUser(req: Request, res: Response) {
    const userData: CreateUserDTO = req.body;

    try {
      const existingUser = await prisma.user.findFirst({
        where: {
          OR: [{ email: userData.email }, { phoneNumber: userData.phoneNumber }],
        },
      });
      if (existingUser) {
        return ResponseHandler.error(res, {
          message: 'User already exists',
          statusCode: 400,
        });
      }

      const hashedPassword = await hashPassword(userData.password);

      const user = await prisma.user.create({
        data: {
          outletId: userData.outletId,
          name: userData.name,
          position: userData.position,
          email: userData.email,
          password: hashedPassword,
          address: userData.address,
          gender: userData.gender,
          phoneNumber: userData.phoneNumber,
          status: userData.status,
          role: userData.role,
        },
      });
      return ResponseHandler.success(res, {
        message: 'User created successfully',
        data: user,
      });
    } catch (error) {
      logger.error('Error creating user:', error);
      return ResponseHandler.error(res, {
        message: 'Internal server error',
        statusCode: 500,
      });
    }
  }

  async updateUser(req: Request, res: Response) {
    const { id } = req.params;
    const userData: UpdateUserDTO = req.body;

    try {
      const user = await prisma.user.findUnique({
        where: { id },
      });
      if (!user) {
        return ResponseHandler.error(res, {
          message: 'User not found',
          statusCode: 404,
        });
      }

      const existingUser = await prisma.user.findFirst({
        where: {
          OR: [{ email: userData.email }, { phoneNumber: userData.phoneNumber }],
        },
      });
      if (existingUser && existingUser.id !== id) {
        return ResponseHandler.error(res, {
          message: 'User already exists',
          statusCode: 400,
        });
      }

      const updatedUser = await prisma.user.update({
        where: { id },
        data: {
          outletId: userData.outletId,
          name: userData.name,
          position: userData.position,
          email: userData.email,
          address: userData.address,
          gender: userData.gender,
          phoneNumber: userData.phoneNumber,
          status: userData.status,
          role: userData.role,
        },
      });

      return ResponseHandler.success(res, {
        message: 'User updated successfully',
        data: updatedUser,
      });
    } catch (error) {
      logger.error('Error updating user:', error);
      return ResponseHandler.error(res, {
        message: 'Internal server error',
        statusCode: 500,
      });
    }
  }

  async deleteUser(req: Request, res: Response) {
    const { id } = req.params;

    try {
      const user = await prisma.user.findUnique({
        where: { id },
      });
      if (!user) {
        return ResponseHandler.error(res, {
          message: 'User not found',
          statusCode: 404,
        });
      }

      await prisma.user.delete({
        where: { id },
      });

      return ResponseHandler.success(res, {
        message: 'User deleted successfully',
        data: null,
      });
    } catch (error) {
      if (error instanceof Error && 'code' in error && error.code === 'P2025') {
        return ResponseHandler.error(res, {
          message: 'User not found',
          statusCode: 404,
        });
      }
      logger.error('Error deleting user:', error);
      return ResponseHandler.error(res, {
        message: 'Internal server error',
        statusCode: 500,
      });
    }
  }
}
