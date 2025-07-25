/* eslint-disable @typescript-eslint/no-explicit-any */
import { BaseController } from '../../../../modules/transactions/controllers/base.controller';
import { ResponseHandler } from '../../../../utils/response/responseHandler';

describe('Transactions BaseController', () => {
  class TestController extends BaseController {
    public testSendSuccess(res: any, opts: any) {
      return this.sendSuccess(res, opts);
    }
    public testSendError(res: any, opts: any) {
      return this.sendError(res, opts);
    }
  }

  let controller: TestController;
  let mockRes: any;

  beforeEach(() => {
    controller = new TestController();
    mockRes = { status: jest.fn().mockReturnThis(), json: jest.fn().mockReturnThis() };
    jest.clearAllMocks();
  });

  it('sendSuccess calls ResponseHandler.success and returns value', () => {
    const spy = jest.spyOn(ResponseHandler, 'success').mockReturnValue('success' as any);
    const result = controller.testSendSuccess(mockRes, {
      message: 'ok',
      data: { foo: 1 },
      statusCode: 201,
    });
    expect(spy).toHaveBeenCalledWith(mockRes, { message: 'ok', data: { foo: 1 }, statusCode: 201 });
    expect(result).toBe('success');
  });

  it('sendError calls ResponseHandler.error and returns value', () => {
    const spy = jest.spyOn(ResponseHandler, 'error').mockReturnValue('error' as any);
    const result = controller.testSendError(mockRes, {
      message: 'fail',
      statusCode: 400,
      error: { code: 'X', details: { foo: 2 } },
    });
    expect(spy).toHaveBeenCalledWith(mockRes, {
      message: 'fail',
      statusCode: 400,
      error: { code: 'X', details: { foo: 2 } },
    });
    expect(result).toBe('error');
  });
});
