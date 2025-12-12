/* eslint-disable @typescript-eslint/no-explicit-any */
import { AttendanceController } from './attendance.controller';
import { ResponseHandler } from '../../../utils/response/responseHandler';
import mockPrisma from '../../../__tests__/mocks/prisma.mock';
import { Request, Response } from 'express';

// Mock prisma import inside controller
// Use require inside factory to avoid hoist initialization errors
// eslint-disable-next-line @typescript-eslint/no-var-requires
jest.mock('../../../lib/prisma', () => require('../../../__tests__/mocks/prisma.mock').default);

// Disable logger output during tests
jest.mock('../../../utils/common/logger', () => ({
  logger: { error: jest.fn(), info: jest.fn() },
}));

describe('AttendanceController', () => {
  // Ensure attendance mock model exists
  (mockPrisma as any).attendance = {
    findMany: jest.fn(),
    findUnique: jest.fn(),
    findFirst: jest.fn(),
    count: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
  };

  const controller = new AttendanceController();
  let req: Partial<Request & { user: any }>;
  let res: Partial<Response>;

  beforeEach(() => {
    req = {
      params: {},
      body: {},
      user: { outletId: 'outlet-1', userId: 'user-approver' },
    } as Partial<Request & { user: any }>;

    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis(),
    } as unknown as Partial<Response>;

    jest.spyOn(ResponseHandler, 'success').mockImplementation(() => res as Response);
    jest.spyOn(ResponseHandler, 'error').mockImplementation(() => res as Response);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('getAllAttendances', () => {
    it('should return attendances', async () => {
      ((mockPrisma as any).attendance.findMany as jest.Mock).mockResolvedValue([{ id: 'att-1' }]);

      await controller.getAllAttendances(req as Request, res as Response);

      expect((mockPrisma as any).attendance.findMany).toHaveBeenCalledWith({
        where: { outletId: 'outlet-1' },
        orderBy: { createdAt: 'asc' },
      });
      expect(ResponseHandler.success).toHaveBeenCalledWith(
        res,
        expect.objectContaining({
          message: expect.stringContaining('retrieved'),
          data: [{ id: 'att-1' }],
        }),
      );
    });
  });

  describe('getAttendanceById', () => {
    it('should return attendance if found', async () => {
      req!.params = { id: 'att-1' };
      ((mockPrisma as any).attendance.findUnique as jest.Mock).mockResolvedValue({ id: 'att-1' });

      await controller.getAttendanceById(req as Request, res as Response);

      expect((mockPrisma as any).attendance.findUnique).toHaveBeenCalledWith({
        where: { id: 'att-1', outletId: 'outlet-1' },
      });
      expect(ResponseHandler.success).toHaveBeenCalled();
    });

    it('should return 404 if not found', async () => {
      req!.params = { id: 'att-2' };
      ((mockPrisma as any).attendance.findUnique as jest.Mock).mockResolvedValue(null);

      await controller.getAttendanceById(req as Request, res as Response);

      expect(ResponseHandler.error).toHaveBeenCalledWith(
        res,
        expect.objectContaining({ statusCode: 404 }),
      );
    });
  });

  describe('createAttendance', () => {
    it('should create attendance successfully', async () => {
      req!.body = { userId: 'user-1', photoUrl: 'url', type: 'check-in' };
      // Mocks for internal checks
      (mockPrisma.user.findUnique as jest.Mock).mockResolvedValue({ id: 'user-1' });
      ((mockPrisma as any).attendance.findFirst as jest.Mock).mockResolvedValue(null);
      ((mockPrisma as any).attendance.count as jest.Mock).mockResolvedValue(0);
      ((mockPrisma as any).attendance.create as jest.Mock).mockResolvedValue({ id: 'att-new' });

      await controller.createAttendance(req as Request, res as Response);

      expect((mockPrisma as any).attendance.create).toHaveBeenCalled();
      expect(ResponseHandler.success).toHaveBeenCalled();
    });
  });

  describe('approveAttendance', () => {
    it('should approve attendance', async () => {
      req!.body = { id: 'att-1', approvedNote: 'ok', status: 'approved' };
      (mockPrisma.user.findUnique as jest.Mock).mockResolvedValue({ id: 'user-approver' });
      ((mockPrisma as any).attendance.findUnique as jest.Mock).mockResolvedValue({ id: 'att-1' });
      ((mockPrisma as any).attendance.update as jest.Mock).mockResolvedValue({
        id: 'att-1',
        approvalStatus: 'approved',
      });

      await controller.approveAttendance(req as Request, res as Response);

      expect((mockPrisma as any).attendance.update).toHaveBeenCalledWith({
        where: { id: 'att-1' },
        data: expect.objectContaining({ approvalStatus: 'approved', approvedBy: 'user-approver' }),
      });
      expect(ResponseHandler.success).toHaveBeenCalled();
    });
  });
});
