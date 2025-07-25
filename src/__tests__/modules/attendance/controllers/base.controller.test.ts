/* eslint-disable @typescript-eslint/no-explicit-any */
import { Response } from 'express';
import { BaseController } from '../../../../modules/attendance/controllers/base.controller';

// ---------------------------------------------------------------------------
// Helper utilities
// ---------------------------------------------------------------------------
const createMockRes = () => {
  const res: Partial<Response> = {
    status: jest.fn().mockReturnThis(),
    json: jest.fn().mockReturnThis(),
  } as unknown as Response;
  return res;
};

// ---------------------------------------------------------------------------
// Jest mocks
// ---------------------------------------------------------------------------
jest.mock('../../../../utils/response/responseHandler', () => {
  const responseHandler = {
    success: jest.fn((res: Response, payload: unknown) => res.status((payload as any).statusCode ?? 200).json(payload)),
    error: jest.fn((res: Response, payload: unknown) => res.status((payload as any).statusCode ?? 500).json(payload)),
  };
  return { ResponseHandler: responseHandler };
});
// Retrieve the same instance for assertions
// eslint-disable-next-line @typescript-eslint/no-var-requires
const { ResponseHandler } = require('../../../../utils/response/responseHandler');

// ---------------------------------------------------------------------------
// Test Controller (exposes protected methods)
// ---------------------------------------------------------------------------
class TestController extends BaseController {
  public successProxy<T>(res: Response, opts: { message: string; data: T; statusCode?: number }) {
    return this.sendSuccess(res, opts);
  }
  public errorProxy(res: Response, opts: { message: string; statusCode?: number; error?: { code?: string; details?: unknown } }) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return this.sendError(res, opts as any);
  }
}

// ---------------------------------------------------------------------------
// Test Suite
// ---------------------------------------------------------------------------

describe('BaseController', () => {
  let controller: TestController;

  beforeEach(() => {
    jest.clearAllMocks();
    controller = new TestController();
  });

  describe('sendSuccess', () => {
    it('should call ResponseHandler.success with default statusCode', () => {
      const res = createMockRes();
      const payload = { message: 'ok', data: { foo: 'bar' } };

      controller.successProxy(res as any, payload);

      expect(ResponseHandler.success).toHaveBeenCalledWith(res, expect.objectContaining({
        ...payload,
        statusCode: 200,
      }));
    });

    it('should pass custom statusCode properly', () => {
      const res = createMockRes();
      const payload = { message: 'created', data: { id: 1 }, statusCode: 201 };

      controller.successProxy(res as any, payload);

      expect(ResponseHandler.success).toHaveBeenCalledWith(res, payload);
    });
  });

  describe('sendError', () => {
    it('should call ResponseHandler.error with default statusCode', () => {
      const res = createMockRes();
      const payload = { message: 'Internal error' };

      controller.errorProxy(res as any, payload);

      expect(ResponseHandler.error).toHaveBeenCalledWith(res, expect.objectContaining({
        ...payload,
        statusCode: 500,
      }));
    });

    it('should pass custom statusCode and error details properly', () => {
      const res = createMockRes();
      const payload = {
        message: 'Bad request',
        statusCode: 400,
        error: {
          code: 'BAD_REQUEST',
          details: { field: 'name' },
        },
      };

      controller.errorProxy(res as any, payload);

      expect(ResponseHandler.error).toHaveBeenCalledWith(res, payload);
    });
  });
});
