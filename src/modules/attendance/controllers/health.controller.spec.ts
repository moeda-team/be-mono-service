/* eslint-disable @typescript-eslint/no-explicit-any */
import { Response } from 'express';
import { HealthController } from './health.controller';
import { ResponseHandler } from '../../../utils/response/responseHandler';

jest.mock('../../../config', () => ({ config: { nodeEnv: 'test' } }));

describe('HealthController', () => {
  const controller = new HealthController();
  let res: Partial<Response>;

  beforeEach(() => {
    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis(),
    } as unknown as Partial<Response>;

    jest.spyOn(ResponseHandler, 'success').mockImplementation(() => res as Response);
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('should return health data via sendSuccess', () => {
    jest.spyOn(process, 'memoryUsage').mockReturnValue({
      rss: 0,
      heapTotal: 200 * 1024 * 1024,
      heapUsed: 100 * 1024 * 1024,
      external: 0,
      arrayBuffers: 0,
    } as NodeJS.MemoryUsage);

    controller.check({} as any, res as Response);

    expect(ResponseHandler.success).toHaveBeenCalledWith(
      res,
      expect.objectContaining({
        message: 'API is healthy and operational',
        data: expect.objectContaining({
          environment: 'test',
          memory: expect.objectContaining({ usage: expect.stringContaining('%') }),
        }),
      }),
    );
  });
});
