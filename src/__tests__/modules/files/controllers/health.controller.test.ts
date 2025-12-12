import { Request, Response } from 'express';
import { HealthController } from '../../../../modules/files/controllers/health.controller';

// ---------------------------------------------------------------------------
// Mock dependencies
// ---------------------------------------------------------------------------

jest.mock('../../../../utils/response/responseHandler', () => ({
  ResponseHandler: {
    success: jest.fn().mockReturnValue({ mockedSuccess: true }),
  },
}));

jest.mock('../../../../config', () => ({
  config: {
    nodeEnv: 'test',
  },
}));

// eslint-disable-next-line @typescript-eslint/no-var-requires
const { ResponseHandler } = require('../../../../utils/response/responseHandler');

// ---------------------------------------------------------------------------
// Helper mocks for process values
// ---------------------------------------------------------------------------

afterEach(() => {
  jest.restoreAllMocks();
  jest.clearAllMocks();
});

describe('Files HealthController', () => {
  it('returns success payload with calculated memory stats', () => {
    // Arrange deterministic process metrics
    jest.spyOn(process, 'uptime').mockReturnValue(123);
    jest.spyOn(process, 'memoryUsage').mockReturnValue({
      heapUsed: 50 * 1024 * 1024, // 50 MB
      heapTotal: 100 * 1024 * 1024, // 100 MB
      rss: 0,
      external: 0,
      arrayBuffers: 0,
      // eslint-disable-next-line @typescript-eslint/ban-ts-comment
      // @ts-ignore
      heapSizeLimit: 0,
    });

    const controller = new HealthController();
    const req = {} as Request;
    const res = {} as unknown as Response;

    // Act
    const result = controller.check(req, res);

    // Assert
    expect(ResponseHandler.success).toHaveBeenCalledWith(
      res,
      expect.objectContaining({
        message: 'API is healthy and operational',
        data: expect.objectContaining({
          uptime: 123,
          environment: 'test',
          memory: expect.objectContaining({
            used: 50,
            total: 100,
            free: 50,
            usage: '50%',
          }),
        }),
      }),
    );
    expect(result).toEqual({ mockedSuccess: true });
  });
});
