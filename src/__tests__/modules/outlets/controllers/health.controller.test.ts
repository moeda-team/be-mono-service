import { Response } from 'express';
import { HealthController } from '../../../../modules/outlets/controllers/health.controller';
import { config } from '../../../../config';

describe('HealthController', () => {
  let controller: HealthController;
  let mockRes: Partial<Response>;

  beforeEach(() => {
    controller = new HealthController();
    mockRes = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis(),
    };
    jest.clearAllMocks();
  });

  it('should respond with health status and correct structure', () => {
    const spy = jest.spyOn(controller as any, 'sendSuccess');
    const fakeMemory = {
      heapUsed: 100 * 1024 * 1024,
      heapTotal: 200 * 1024 * 1024,
    };
    jest.spyOn(process, 'memoryUsage').mockReturnValue({
      heapUsed: fakeMemory.heapUsed,
      heapTotal: fakeMemory.heapTotal,
      rss: 0, external: 0, arrayBuffers: 0, code: 0, stack: 0, malloced_memory: 0, peak_malloced_memory: 0, total_heap_size: 0, total_heap_size_executable: 0, total_physical_size: 0, total_available_size: 0, used_heap_size: 0, free_heap_size: 0, heap_size_limit: 0, does_zap_garbage: 0, number_of_native_contexts: 0, number_of_detached_contexts: 0
    } as any);
    jest.spyOn(process, 'uptime').mockReturnValue(123.456);
    jest.spyOn(global, 'Date').mockImplementation(() => ({ toISOString: () => '2025-06-03T15:17:00.000Z' } as any));

    controller.check({} as any, mockRes as Response);

    expect(spy).toHaveBeenCalledWith(mockRes, expect.objectContaining({
      message: 'API is healthy and operational',
      data: expect.objectContaining({
        uptime: 123.456,
        timestamp: '2025-06-03T15:17:00.000Z',
        environment: config.nodeEnv,
        memory: expect.objectContaining({
          used: 100,
          total: 200,
          free: 100,
          usage: '50%'
        })
      })
    }));
  });
});
