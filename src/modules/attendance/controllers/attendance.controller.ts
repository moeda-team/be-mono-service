import { Request, Response } from 'express';
import { logger } from '../../../utils/common/logger';
import { CreateAttendanceDTO } from '../models/attendance';
import { ResponseHandler } from '../../../utils/response/responseHandler';
import prisma from '../../../lib/prisma';

export class AttendanceController {
  async getAllAttendances(req: Request, res: Response) {
    const user = (req as Request & { user: { outletId: string } }).user;

    try {
      const attendances = await prisma.attendance.findMany({
        where: { outletId: user.outletId },
        orderBy: {
          createdAt: 'asc',
        },
      });
      return ResponseHandler.success(res, {
        message: 'Attendances retrieved successfully',
        data: attendances,
      });
    } catch (error) {
      logger.error('Error getting attendances:', error);
      return ResponseHandler.error(res, {
        message: 'Internal server error',
        statusCode: 500,
      });
    }
  }

  async getAttendanceById(req: Request, res: Response) {
    const user = (req as Request & { user: { outletId: string } }).user;
    const { id } = req.params;

    try {
      const attendance = await prisma.attendance.findUnique({
        where: { id, outletId: user.outletId },
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
      logger.error('Error getting attendance:', error);
      return ResponseHandler.error(res, {
        message: 'Internal server error',
        statusCode: 500,
      });
    }
  }

  async createAttendance(req: Request, res: Response) {
    const user = (req as Request & { user: { outletId: string } }).user;
    const attendanceData: CreateAttendanceDTO = req.body;

    try {
      if (!user.outletId) {
        return ResponseHandler.error(res, {
          message: 'Outlet not found',
          statusCode: 404,
        });
      }

      const findUser = await prisma.user.findUnique({
        where: { id: attendanceData.userId },
      });
      if (!findUser) {
        return ResponseHandler.error(res, {
          message: 'User not found',
          statusCode: 404,
        });
      }

      const findAttendanceCheckIn = await prisma.attendance.findFirst({
        where: {
          userId: attendanceData.userId,
          outletId: user.outletId,
          type: 'check-in',
          createdAt: {
            gte: new Date(new Date().setHours(0, 0, 0, 0)),
            lte: new Date(new Date().setHours(23, 59, 59, 999)),
          },
        },
      });
      if (findAttendanceCheckIn) {
        attendanceData.type = 'check-out';
      }

      const countAttendance = await prisma.attendance.count({
        where: {
          outletId: user.outletId,
          createdAt: {
            gte: new Date(new Date().setHours(0, 0, 0, 0)),
            lte: new Date(new Date().setHours(23, 59, 59, 999)),
          },
        },
      });
      if (countAttendance >= 2) {
        return ResponseHandler.error(res, {
          message: 'Attendance for today(check-in and check-out) already exists',
          statusCode: 400,
        });
      }

      const attendance = await prisma.attendance.create({
        data: {
          outletId: user.outletId,
          userId: attendanceData.userId,
          photoUrl: attendanceData.photoUrl,
          type: attendanceData.type,
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
}
