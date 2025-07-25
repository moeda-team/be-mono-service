import { Response } from 'express';
import { BaseController } from './base.controller';
import { ResponseHandler } from '../../../utils/response/responseHandler';

// Dummy subclass to expose protected methods for testing
class DummyController extends BaseController {
  public success<T>(res: Response, message: string, data: T, statusCode?: number) {
    return this.sendSuccess(res, { message, data, statusCode });
  }

  public error(
    res: Response,
    message: string,
    statusCode?: number,
    error?: { code?: string; details?: unknown },
  ) {
    return this.sendError(res, { message, statusCode, error });
  }
}

describe('BaseController', () => {
  const controller = new DummyController();
  let res: Partial<Response>;

  beforeEach(() => {
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

  it('should call ResponseHandler.success with correct parameters', () => {
    controller.success(res as Response, 'ok', { foo: 'bar' }, 201);

    expect(ResponseHandler.success).toHaveBeenCalledWith(res, {
      message: 'ok',
      data: { foo: 'bar' },
      statusCode: 201,
    });
  });

  it('should call ResponseHandler.error with correct parameters', () => {
    controller.error(res as Response, 'fail', 400, { code: 'ERR' });

    expect(ResponseHandler.error).toHaveBeenCalledWith(res, {
      message: 'fail',
      statusCode: 400,
      error: { code: 'ERR' },
    });
  });
});
