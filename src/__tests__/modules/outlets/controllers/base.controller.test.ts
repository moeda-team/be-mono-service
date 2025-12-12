import { Response } from 'express';
import { BaseController } from '../../../../modules/outlets/controllers/base.controller';
import { ResponseHandler } from '../../../../utils/response/responseHandler';

describe('BaseController', () => {
  class TestController extends BaseController {
    public callSendSuccess(res: Response, message: string, data: unknown, statusCode?: number) {
      return this.sendSuccess(res, { message, data, statusCode });
    }
    public callSendError(
      res: Response,
      message: string,
      statusCode?: number,
      error?: { code?: string; details?: unknown },
    ) {
      return this.sendError(res, { message, statusCode, error });
    }
  }

  let controller: TestController;
  let mockRes: Partial<Response>;

  beforeEach(() => {
    controller = new TestController();
    mockRes = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis(),
    };
    jest.clearAllMocks();
  });

  it('should call ResponseHandler.success with correct arguments in sendSuccess', () => {
    const spy = jest.spyOn(ResponseHandler, 'success');
    const message = 'Success!';
    const data = { foo: 'bar' };
    const statusCode = 201;
    controller.callSendSuccess(mockRes as Response, message, data, statusCode);
    expect(spy).toHaveBeenCalledWith(mockRes, { message, data, statusCode });
  });

  it('should call ResponseHandler.success with default statusCode in sendSuccess', () => {
    const spy = jest.spyOn(ResponseHandler, 'success');
    const message = 'Success!';
    const data = { foo: 'bar' };
    controller.callSendSuccess(mockRes as Response, message, data);
    expect(spy).toHaveBeenCalledWith(mockRes, { message, data, statusCode: 200 });
  });

  it('should call ResponseHandler.error with correct arguments in sendError', () => {
    const spy = jest.spyOn(ResponseHandler, 'error');
    const message = 'Error!';
    const statusCode = 400;
    const error = { code: 'ERR', details: { info: 'details' } };
    controller.callSendError(mockRes as Response, message, statusCode, error);
    expect(spy).toHaveBeenCalledWith(mockRes, { message, statusCode, error });
  });

  it('should call ResponseHandler.error with default statusCode in sendError', () => {
    const spy = jest.spyOn(ResponseHandler, 'error');
    const message = 'Error!';
    controller.callSendError(mockRes as Response, message);
    expect(spy).toHaveBeenCalledWith(mockRes, { message, statusCode: 500, error: undefined });
  });
});
