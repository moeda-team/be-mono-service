import { Request, Response } from 'express';
import { HealthController } from '../../../../modules/users/controllers/health.controller';
import { mockRequest, mockResponse } from '../../../mocks/express.mock';

// Mock the config module before importing it
jest.mock('../../../../config', () => ({
  config: {
    nodeEnv: 'test',
    port: 3000,
    apiPrefix: '/api',
    corsOrigin: '*',
  },
  isProduction: false,
}));

describe('HealthController', () => {
  describe('check', () => {
    let healthController: HealthController;
    let req: Partial<Request>;
    let res: Partial<Response>;

    beforeEach(() => {
      req = mockRequest();
      res = mockResponse();

      // Mock process.memoryUsage
      jest.spyOn(process, 'memoryUsage').mockReturnValue({
        rss: 10 * 1024 * 1024, // 10 MB
        heapTotal: 19 * 1024 * 1024, // 19 MB
        heapUsed: 10 * 1024 * 1024, // 10 MB
        external: 0,
        arrayBuffers: 0,
      });

      // Mock process.uptime
      jest.spyOn(process, 'uptime').mockReturnValue(3600); // 1 hour

      // Mock Date
      const mockDate = new Date('2025-01-01T12:00:00Z');
      jest.spyOn(global, 'Date').mockImplementation(() => mockDate);

      // Create controller and mock sendSuccess
      healthController = new HealthController();
      healthController['sendSuccess'] = jest.fn();
    });

    afterEach(() => {
      jest.clearAllMocks();
    });

    it('should return health status with correct data', () => {
      // Act
      healthController.check(req as Request, res as Response);

      // Assert
      expect(healthController['sendSuccess']).toHaveBeenCalledWith(res, {
        message: 'API is healthy and operational',
        data: {
          uptime: 3600,
          timestamp: '2025-01-01T12:00:00.000Z',
          environment: 'test',
          memory: {
            used: 10,
            total: 19,
            free: 9,
            usage: '53%',
          },
        },
      });
    });

    it('should calculate memory usage correctly with different values', () => {
      // Arrange - mock different memory values
      jest.spyOn(process, 'memoryUsage').mockReturnValue({
        rss: 50 * 1024 * 1024, // 50 MB
        heapTotal: 100 * 1024 * 1024, // 100 MB
        heapUsed: 75 * 1024 * 1024, // 75 MB
        external: 0,
        arrayBuffers: 0,
      });

      // Act
      healthController.check(req as Request, res as Response);

      // Assert
      expect(healthController['sendSuccess']).toHaveBeenCalledWith(
        expect.anything(),
        expect.objectContaining({
          data: expect.objectContaining({
            memory: {
              used: 75,
              total: 100,
              free: 25,
              usage: '75%',
            },
          }),
        }),
      );
    });

    it('should reflect environment from config', () => {
      // We can't easily change the mock during the test, so we'll just verify
      // that the current environment is correctly reflected

      // Act
      healthController.check(req as Request, res as Response);

      // Assert
      expect(healthController['sendSuccess']).toHaveBeenCalledWith(
        expect.anything(),
        expect.objectContaining({
          data: expect.objectContaining({
            environment: 'test',
          }),
        }),
      );
    });
  });
});
