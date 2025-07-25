/* eslint-disable @typescript-eslint/no-explicit-any */
import { AttendanceController } from '../../../../modules/attendance/controllers/attendance.controller';

// Mocking dependencies used inside the controller implementation.
// NOTE: All relative paths mirror the ones used INSIDE attendance.controller.ts, but
// their resolution here is relative to THIS test file.

import { Response } from 'express';

// ----------------------------------------------------------------------------
// Helper utilities
// ----------------------------------------------------------------------------
const createMockRes = () => {
  const res: Partial<Response> = {
    status: jest.fn().mockReturnThis(),
    json: jest.fn().mockReturnThis(),
  } as unknown as Response;
  return res;
};

const createMockReq = (overrides: Record<string, any> = {}) => {
  return {
    ...overrides,
  } as any;
};

// ----------------------------------------------------------------------------
// Jest mocks for external modules
// ----------------------------------------------------------------------------

// 1. Mock Prisma client wrapper ------------------------------------------------
// 1. Mock Prisma client wrapper ------------------------------------------------
jest.mock('../../../../lib/prisma', () => {
  const prismaMock = {
    attendance: {
      findMany: jest.fn(),
      findUnique: jest.fn(),
      findFirst: jest.fn(),
      count: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
    },
    user: {
      findUnique: jest.fn(),
    },
  };
  // Expose for tests
  return { __esModule: true, default: prismaMock };
});
// eslint-disable-next-line @typescript-eslint/no-var-requires
const mockPrisma = require('../../../../lib/prisma').default;

// 2. Mock ResponseHandler ------------------------------------------------------
jest.mock('../../../../utils/response/responseHandler', () => {
  const responseHandler = {
    success: jest.fn((res: Response, payload: unknown) => res.json(payload)),
    error: jest.fn((res: Response, payload: unknown) =>
      res.status((payload as any).statusCode ?? 500).json(payload),
    ),
  };
  return { ResponseHandler: responseHandler };
});
// Retrieve the same instance for assertions
// eslint-disable-next-line @typescript-eslint/no-var-requires
const { ResponseHandler } = require('../../../../utils/response/responseHandler');

// 3. Mock logger to silence console during tests ------------------------------
jest.mock('../../../../utils/common/logger', () => ({
  logger: { error: jest.fn() },
}));

// ----------------------------------------------------------------------------
// Test Suite
// ----------------------------------------------------------------------------
describe('AttendanceController', () => {
  let controller: AttendanceController;

  beforeEach(() => {
    jest.clearAllMocks();
    controller = new AttendanceController();
  });

  // --------------------------------------------------------------------------
  // getAllAttendances
  // --------------------------------------------------------------------------
  describe('getAllAttendances', () => {
    it('should return attendances successfully', async () => {
      const req = createMockReq({ user: { outletId: 'outlet-1' } });
      const res = createMockRes();

      const fakeAttendances = [{ id: 'a1' }];
      mockPrisma.attendance.findMany.mockResolvedValueOnce(fakeAttendances);

      await controller.getAllAttendances(req as any, res as any);

      expect(mockPrisma.attendance.findMany).toHaveBeenCalledWith({
        where: { outletId: 'outlet-1' },
        orderBy: { createdAt: 'asc' },
      });
      expect(ResponseHandler.success).toHaveBeenCalledWith(res, {
        message: 'Attendances retrieved successfully',
        data: fakeAttendances,
      });
    });

    it('should handle prisma error', async () => {
      const req = createMockReq({ user: { outletId: 'outlet-1' } });
      const res = createMockRes();

      mockPrisma.attendance.findMany.mockRejectedValueOnce(new Error('db error'));

      await controller.getAllAttendances(req as any, res as any);

      expect(ResponseHandler.error).toHaveBeenCalledWith(res, {
        message: 'Internal server error',
        statusCode: 500,
      });
    });
  });

  // --------------------------------------------------------------------------
  // getAttendanceById
  // --------------------------------------------------------------------------
  describe('getAttendanceById', () => {
    it('should return not found when attendance does not exist', async () => {
      const req = createMockReq({ user: { outletId: 'outlet-1' }, params: { id: 'a1' } });
      const res = createMockRes();
      mockPrisma.attendance.findUnique.mockResolvedValueOnce(null);

      await controller.getAttendanceById(req as any, res as any);

      expect(ResponseHandler.error).toHaveBeenCalledWith(res, {
        message: 'Attendance not found',
        statusCode: 404,
      });
    });

    it('should return attendance successfully', async () => {
      const req = createMockReq({ user: { outletId: 'outlet-1' }, params: { id: 'a2' } });
      const res = createMockRes();
      const attendance = { id: 'a2' };
      mockPrisma.attendance.findUnique.mockResolvedValueOnce(attendance);

      await controller.getAttendanceById(req as any, res as any);

      expect(ResponseHandler.success).toHaveBeenCalledWith(res, {
        message: 'Attendance retrieved successfully',
        data: attendance,
      });
    });

    it('should handle prisma error', async () => {
      const req = createMockReq({ user: { outletId: 'outlet-1' }, params: { id: 'a2' } });
      const res = createMockRes();
      mockPrisma.attendance.findUnique.mockRejectedValueOnce(new Error('db error'));

      await controller.getAttendanceById(req as any, res as any);

      expect(ResponseHandler.error).toHaveBeenCalledWith(res, {
        message: 'Internal server error',
        statusCode: 500,
      });
    });
  });

  // --------------------------------------------------------------------------
  // createAttendance
  // --------------------------------------------------------------------------
  describe('createAttendance', () => {
    const baseBody = {
      userId: 'user-1',
      photoUrl: 'http://example.com/pic.png',
      type: 'check-in' as const,
    };

    it('should return error when outletId missing', async () => {
      const req = createMockReq({ user: { outletId: '' }, body: baseBody });
      const res = createMockRes();

      await controller.createAttendance(req as any, res as any);

      expect(ResponseHandler.error).toHaveBeenCalledWith(res, {
        message: 'Outlet not found',
        statusCode: 404,
      });
    });

    it('should return error when user not found', async () => {
      const req = createMockReq({ user: { outletId: 'outlet-1' }, body: baseBody });
      const res = createMockRes();

      mockPrisma.user.findUnique.mockResolvedValueOnce(null);

      await controller.createAttendance(req as any, res as any);

      expect(ResponseHandler.error).toHaveBeenCalledWith(res, {
        message: 'User not found',
        statusCode: 404,
      });
    });

    it('should switch to check-out when check-in already exists', async () => {
      const req = createMockReq({ user: { outletId: 'outlet-1' }, body: { ...baseBody } });
      const res = createMockRes();

      // User exists
      mockPrisma.user.findUnique.mockResolvedValueOnce({ id: 'user-1' });

      // Found existing check-in
      mockPrisma.attendance.findFirst.mockResolvedValueOnce({
        id: 'existing-check-in',
        type: 'check-in',
      });
      mockPrisma.attendance.count.mockResolvedValueOnce(0);

      const createdAttendance = { id: 'new', type: 'check-out' };
      mockPrisma.attendance.create.mockResolvedValueOnce(createdAttendance);

      await controller.createAttendance(req as any, res as any);

      // The body object should be mutated to type check-out
      expect(mockPrisma.attendance.create).toHaveBeenCalledWith({
        data: expect.objectContaining({ type: 'check-out' }),
      });
      expect(ResponseHandler.success).toHaveBeenCalledWith(res, {
        message: 'Attendance created successfully',
        data: createdAttendance,
      });
    });

    it('should return error when attendance count >= 2', async () => {
      const req = createMockReq({ user: { outletId: 'outlet-1' }, body: baseBody });
      const res = createMockRes();

      mockPrisma.user.findUnique.mockResolvedValueOnce({ id: 'user-1' });
      mockPrisma.attendance.findFirst.mockResolvedValueOnce(null);
      mockPrisma.attendance.count.mockResolvedValueOnce(2);

      await controller.createAttendance(req as any, res as any);

      expect(ResponseHandler.error).toHaveBeenCalledWith(res, {
        message: 'Attendance for today(check-in and check-out) already exists',
        statusCode: 400,
      });
    });

    it('should create attendance successfully', async () => {
      const req = createMockReq({ user: { outletId: 'outlet-1' }, body: baseBody });
      const res = createMockRes();

      mockPrisma.user.findUnique.mockResolvedValueOnce({ id: 'user-1' });
      mockPrisma.attendance.findFirst.mockResolvedValueOnce(null);
      mockPrisma.attendance.count.mockResolvedValueOnce(0);
      const createdAttendance = { id: 'a-new' };
      mockPrisma.attendance.create.mockResolvedValueOnce(createdAttendance);

      await controller.createAttendance(req as any, res as any);

      expect(ResponseHandler.success).toHaveBeenCalledWith(res, {
        message: 'Attendance created successfully',
        data: createdAttendance,
      });
    });

    it('should handle prisma error', async () => {
      const req = createMockReq({ user: { outletId: 'outlet-1' }, body: baseBody });
      const res = createMockRes();

      mockPrisma.user.findUnique.mockRejectedValueOnce(new Error('db error'));

      await controller.createAttendance(req as any, res as any);

      expect(ResponseHandler.error).toHaveBeenCalledWith(res, {
        message: 'Internal server error',
        statusCode: 500,
      });
    });
  });

  // --------------------------------------------------------------------------
  // approveAttendance
  // --------------------------------------------------------------------------
  describe('approveAttendance', () => {
    const baseBody = {
      id: 'attendance-1',
      approvedNote: 'OK',
      status: 'approved' as const,
    };

    it('should return error when outletId missing', async () => {
      const req = createMockReq({ user: { outletId: '', userId: 'approver' }, body: baseBody });
      const res = createMockRes();

      await controller.approveAttendance(req as any, res as any);
      expect(ResponseHandler.error).toHaveBeenCalledWith(res, {
        message: 'Outlet not found',
        statusCode: 404,
      });
    });

    it('should return error when approver user not found', async () => {
      const req = createMockReq({
        user: { outletId: 'outlet-1', userId: 'approver' },
        body: baseBody,
      });
      const res = createMockRes();

      mockPrisma.user.findUnique.mockResolvedValueOnce(null);

      await controller.approveAttendance(req as any, res as any);

      expect(ResponseHandler.error).toHaveBeenCalledWith(res, {
        message: 'User Approver not found',
        statusCode: 404,
      });
    });

    it('should return error when attendance not found', async () => {
      const req = createMockReq({
        user: { outletId: 'outlet-1', userId: 'approver' },
        body: baseBody,
      });
      const res = createMockRes();

      mockPrisma.user.findUnique.mockResolvedValueOnce({ id: 'approver' });
      mockPrisma.attendance.findUnique.mockResolvedValueOnce(null);

      await controller.approveAttendance(req as any, res as any);

      expect(ResponseHandler.error).toHaveBeenCalledWith(res, {
        message: 'Attendance not found',
        statusCode: 404,
      });
    });

    it('should approve attendance successfully', async () => {
      const req = createMockReq({
        user: { outletId: 'outlet-1', userId: 'approver' },
        body: baseBody,
      });
      const res = createMockRes();

      mockPrisma.user.findUnique.mockResolvedValueOnce({ id: 'approver' });
      mockPrisma.attendance.findUnique.mockResolvedValueOnce({ id: 'attendance-1' });
      const updatedAttendance = { id: 'attendance-1', approvalStatus: 'approved' };
      mockPrisma.attendance.update.mockResolvedValueOnce(updatedAttendance);

      await controller.approveAttendance(req as any, res as any);

      expect(mockPrisma.attendance.update).toHaveBeenCalledWith({
        where: { id: 'attendance-1' },
        data: expect.objectContaining({
          approvedBy: 'approver',
          approvalStatus: 'approved',
        }),
      });
      expect(ResponseHandler.success).toHaveBeenCalledWith(res, {
        message: 'Attendance approved successfully',
        data: updatedAttendance,
      });
    });

    it('should handle prisma error', async () => {
      const req = createMockReq({
        user: { outletId: 'outlet-1', userId: 'approver' },
        body: baseBody,
      });
      const res = createMockRes();

      mockPrisma.user.findUnique.mockRejectedValueOnce(new Error('db error'));

      await controller.approveAttendance(req as any, res as any);

      expect(ResponseHandler.error).toHaveBeenCalledWith(res, {
        message: 'Internal server error',
        statusCode: 500,
      });
    });
  });
});
