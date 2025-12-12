import { Response } from 'express';
import { BaseController } from '../../../../modules/files/controllers/base.controller';

// ---------------------------------------------------------------------------
// Mock ResponseHandler
// ---------------------------------------------------------------------------
jest.mock('../../../../utils/response/responseHandler', () => ({
  ResponseHandler: {
    success: jest.fn().mockReturnValue({ mockedSuccessResponse: true }),
    error: jest.fn().mockReturnValue({ mockedErrorResponse: true }),
  },
}));

// eslint-disable-next-line @typescript-eslint/no-var-requires
const { ResponseHandler } = require('../../../../utils/response/responseHandler');

// concrete implementation exposing protected methods
class TestController extends BaseController {
  public testSendSuccess<T>(
    res: Response,
    opts: { message: string; data: T; statusCode?: number },
  ) {
    return this.sendSuccess(res, opts);
  }
  public testSendError(
    res: Response,
    opts: { message: string; statusCode?: number; error?: unknown },
  ) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return this.sendError(res, opts as any);
  }
}

describe('Files BaseController', () => {
  let controller: TestController;
  const mockRes = {} as unknown as Response;

  beforeEach(() => {
    controller = new TestController();
    jest.clearAllMocks();
  });

  describe('sendSuccess', () => {
    it('calls ResponseHandler.success with default status', () => {
      const payload = { message: 'ok', data: { foo: 'bar' } };
      const result = controller.testSendSuccess(mockRes, payload);
      expect(ResponseHandler.success).toHaveBeenCalledWith(mockRes, {
        ...payload,
        statusCode: 200,
      });
      expect(result).toEqual({ mockedSuccessResponse: true });
    });

    it('passes custom status', () => {
      const payload = { message: 'created', data: {}, statusCode: 201 };
      controller.testSendSuccess(mockRes, payload);
      expect(ResponseHandler.success).toHaveBeenCalledWith(mockRes, payload);
    });
  });

  describe('sendError', () => {
    it('calls ResponseHandler.error with default status', () => {
      const payload = { message: 'err' };
      controller.testSendError(mockRes, payload);
      expect(ResponseHandler.error).toHaveBeenCalledWith(mockRes, { ...payload, statusCode: 500 });
    });

    it('passes custom status and error details', () => {
      const payload = { message: 'bad', statusCode: 400, error: { code: 'BAD' } };
      controller.testSendError(mockRes, payload);
      expect(ResponseHandler.error).toHaveBeenCalledWith(mockRes, payload);
    });
  });
});
