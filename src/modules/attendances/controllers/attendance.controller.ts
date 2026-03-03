import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { logger } from '../../../utils/common/logger';
import { ResponseHandler } from '../../../utils/response/responseHandler';
import { CreateAttendanceDTO } from '../models/attendance';

const prisma = new PrismaClient();

export class AttendanceController {
  async createAttendance(req: Request, res: Response) {
    const user = (req as Request & { user: { outletId: string; userId: string } }).user;
    console.log(user);

    const body: CreateAttendanceDTO = req.body;

    try {
      if (!user.outletId) {
        return ResponseHandler.error(res, {
          message: 'Outlet not found',
          statusCode: 404,
        });
      }

      if (!body.fileUrl) {
        return ResponseHandler.error(res, {
          message: 'File is required',
          statusCode: 400,
        });
      }

      // Check if user already has attendance for today
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const tomorrow = new Date(today);
      tomorrow.setDate(tomorrow.getDate() + 1);

      const existingAttendance = await prisma.attendance.findFirst({
        where: {
          userId: body.userId || user.userId,
          createdAt: {
            gte: today,
            lt: tomorrow,
          },
        },
      });
      if (existingAttendance) {
        return ResponseHandler.error(res, {
          message: 'User has already created attendance for today',
          statusCode: 400,
        });
      }

      const fileNameWithExtension = body.fileUrl;
      const fileName = fileNameWithExtension.substring(fileNameWithExtension.lastIndexOf('/') + 1);
      const attendance = await prisma.attendance.create({
        data: {
          userId: body.userId || user.userId,
          outletId: user.outletId,
          fileName: fileName,
          fileUrl: body.fileUrl,
          note: body.note,
        },
      });

      return ResponseHandler.success(res, {
        message: 'Attendance created successfully',
        data: attendance,
      });
    } catch (error) {
      logger.error('Error creating attendance:', error);
      return ResponseHandler.error(res, {
        message: 'Internal server error',
        statusCode: 500,
      });
    }
  }

  async checkAttendanceToday(req: Request, res: Response) {
    const user = (req as Request & { user: { outletId: string; id: string } }).user;
    const { userId } = req.query;

    try {
      if (!user.outletId) {
        return ResponseHandler.error(res, {
          message: 'Outlet not found',
          statusCode: 404,
        });
      }

      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const tomorrow = new Date(today);
      tomorrow.setDate(tomorrow.getDate() + 1);

      const existingAttendance = await prisma.attendance.findFirst({
        where: {
          userId: (userId as string) || user.id,
          createdAt: {
            gte: today,
            lt: tomorrow,
          },
        },
        include: { user: { select: { id: true, name: true, email: true } } },
      });

      return ResponseHandler.success(res, {
        message: 'Attendance check completed',
        data: {
          hasAttendanceToday: !!existingAttendance,
          attendance: existingAttendance,
        },
      });
    } catch (error) {
      logger.error('Error checking attendance today:', error);
      return ResponseHandler.error(res, {
        message: 'Internal server error',
        statusCode: 500,
      });
    }
  }

  async getAttendances(req: Request, res: Response) {
    const user = (req as Request & { user: { outletId: string } }).user;
    const { status, userId, date, page, limit } = req.query;

    try {
      if (!user.outletId) {
        return ResponseHandler.error(res, {
          message: 'Outlet not found',
          statusCode: 404,
        });
      }

      const pageNum = page ? parseInt(page as string, 10) : null;
      const limitNum = limit ? parseInt(limit as string, 10) : null;
      const skip = pageNum && limitNum ? (pageNum - 1) * limitNum : 0;

      const where: any = { outletId: user.outletId };
      if (status) where.status = status;
      if (userId) where.userId = userId;
      if (date) {
        const dateObj = new Date(date as string);
        where.createdAt = {
          gte: new Date(dateObj.setHours(0, 0, 0, 0)),
          lte: new Date(dateObj.setHours(23, 59, 59, 999)),
        };
      }

      const [attendances, total] = await Promise.all([
        prisma.attendance.findMany({
          where,
          skip: pageNum && limitNum ? skip : undefined,
          take: limitNum || undefined,
          orderBy: { createdAt: 'desc' },
          include: { user: { select: { id: true, name: true, email: true } } },
        }),
        prisma.attendance.count({ where }),
      ]);

      return ResponseHandler.success(res, {
        message: 'Attendances retrieved successfully',
        data:
          pageNum && limitNum
            ? {
                data: attendances,
                pagination: {
                  page: pageNum,
                  limit: limitNum,
                  total,
                  totalPages: Math.ceil(total / limitNum),
                },
              }
            : attendances,
      });
    } catch (error) {
      logger.error('Error retrieving attendances:', error);
      return ResponseHandler.error(res, {
        message: 'Internal server error',
        statusCode: 500,
      });
    }
  }

  async getAttendanceById(req: Request, res: Response) {
    const { id } = req.params;

    try {
      const attendance = await prisma.attendance.findUnique({
        where: { id },
        include: { user: { select: { id: true, name: true, email: true } } },
      });

      if (!attendance) {
        return ResponseHandler.error(res, {
          message: 'Attendance not found',
          statusCode: 404,
        });
      }

      return ResponseHandler.success(res, {
        message: 'Attendance retrieved successfully',
        data: attendance,
      });
    } catch (error) {
      logger.error('Error retrieving attendance:', error);
      return ResponseHandler.error(res, {
        message: 'Internal server error',
        statusCode: 500,
      });
    }
  }
}
