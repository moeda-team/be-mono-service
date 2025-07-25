/* eslint-disable @typescript-eslint/no-explicit-any */
import { Request, Response, NextFunction } from 'express';
import {
  validateCreateAttendance,
  validateApprovedAttendance,
} from '../../../../modules/attendance/validators/attendance.validator';

// ---------------------------------------------------------------------------
// Mock ResponseHandler so we only assert against its calls
// ---------------------------------------------------------------------------
jest.mock('../../../../utils/response/responseHandler', () => ({
  ResponseHandler: {
    error: jest.fn().mockReturnValue({ mockedError: true }),
  },
}));

// eslint-disable-next-line @typescript-eslint/no-var-requires
import { ResponseHandler as MockedResponseHandler } from '../../../../utils/response/responseHandler';

// ---------------------------------------------------------------------------
// Shared test helpers
// ---------------------------------------------------------------------------
const runMiddlewares = async (
  middlewares: Array<(req: Request, res: Response, next: NextFunction) => unknown>,
  req: Partial<Request>,
  res: Partial<Response>,
  next: jest.Mock,
) => {
  for (const mw of middlewares) {
    // Each middleware may be async or sync
    await mw(req as Request, res as Response, next);
  }
};

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('Attendance Validators', () => {
  let mockReq: Partial<Request>;
  let mockRes: Partial<Response>;
  let mockNext: jest.Mock;

  beforeEach(() => {
    mockReq = { body: {}, method: 'POST' };
    mockRes = { status: jest.fn().mockReturnThis(), json: jest.fn() } as Partial<Response>;
    mockNext = jest.fn();
    jest.clearAllMocks();
  });

  // -------------------------------------------------------------------------
  // validateCreateAttendance
  // -------------------------------------------------------------------------
  describe('validateCreateAttendance', () => {
    it('should call next() when all validations pass (default type)', async () => {
      mockReq.body = {
        userId: 'user-1',
        photoUrl: 'https://example.com/img.png',
      };

      await runMiddlewares(validateCreateAttendance, mockReq, mockRes, mockNext);

      expect(mockNext).toHaveBeenCalled();
      expect(MockedResponseHandler.error).not.toHaveBeenCalled();
    });

    it('should call next() when explicit valid type provided', async () => {
      mockReq.body = {
        userId: 'user-1',
        photoUrl: 'https://example.com/img.png',
        type: 'check-out',
      };

      await runMiddlewares(validateCreateAttendance, mockReq, mockRes, mockNext);

      expect(mockNext).toHaveBeenCalled();
      expect(MockedResponseHandler.error).not.toHaveBeenCalled();
    });

    it('should return error when required fields are missing', async () => {
      mockReq.body = {
        photoUrl: 'https://example.com/img.png',
      };

      await runMiddlewares(validateCreateAttendance, mockReq, mockRes, mockNext);

      expect(MockedResponseHandler.error).toHaveBeenCalledWith(
        mockRes,
        expect.objectContaining({
          message: 'Validation failed',
          statusCode: 400,
          error: expect.objectContaining({ code: 'VALIDATION_FAILED' }),
        }),
      );
    });

    it('should return error when type is invalid', async () => {
      mockReq.body = {
        userId: 'user-1',
        photoUrl: 'https://example.com/img.png',
        type: 'invalid-type',
      };

      await runMiddlewares(validateCreateAttendance, mockReq, mockRes, mockNext);

      expect(MockedResponseHandler.error).toHaveBeenCalled();
    });
  });

  // -------------------------------------------------------------------------
  // validateApprovedAttendance
  // -------------------------------------------------------------------------
  describe('validateApprovedAttendance', () => {
    it('should call next() when validations pass', async () => {
      mockReq.body = {
        id: 'attendance-1',
        status: 'approved',
        approvedNote: 'OK',
      };

      await runMiddlewares(validateApprovedAttendance, mockReq, mockRes, mockNext);

      expect(mockNext).toHaveBeenCalled();
      expect(MockedResponseHandler.error).not.toHaveBeenCalled();
    });

    it('should return error when id is missing', async () => {
      mockReq.body = {
        status: 'approved',
      };

      await runMiddlewares(validateApprovedAttendance, mockReq, mockRes, mockNext);

      expect(MockedResponseHandler.error).toHaveBeenCalled();
    });

    it('should return error when status is invalid', async () => {
      mockReq.body = {
        id: 'attendance-1',
        status: 'invalid',
      };

      await runMiddlewares(validateApprovedAttendance, mockReq, mockRes, mockNext);

      expect(MockedResponseHandler.error).toHaveBeenCalled();
    });
  });
});
