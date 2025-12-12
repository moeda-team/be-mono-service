import { Request, Response } from 'express';
import { HealthController } from '../../../../modules/messages/controllers/health.controller';
import { config } from '../../../../config';

describe('HealthController', () => {
  let controller: HealthController;
  let mockRequest: Partial<Request>;
  let mockResponse: Partial<Response>;

  beforeEach(() => {
    // Create a fresh instance for each test
    controller = new HealthController();

    // Mock the protected sendSuccess method
    controller['sendSuccess'] = jest.fn().mockReturnValue({ success: true });

    // Setup request and response mocks
    mockRequest = {} as Partial<Request>;
    mockResponse = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    } as Partial<Response>;

    // Mock process.memoryUsage
    jest.spyOn(process, 'memoryUsage').mockReturnValue({
      rss: 100000000,
      heapTotal: 50000000,
      heapUsed: 25000000,
      external: 10000000,
      arrayBuffers: 5000000,
    } as NodeJS.MemoryUsage);

    // Mock process.uptime
    jest.spyOn(process, 'uptime').mockReturnValue(3600);

    // Mock Date
    const mockDate = new Date('2025-06-03T10:28:00.000Z');
    jest.spyOn(global, 'Date').mockImplementation(() => mockDate as Date);
    jest.spyOn(mockDate, 'toISOString').mockReturnValue('2025-06-03T10:28:00.000Z');
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('should return health status with correct data', () => {
    // Call the method under test
    controller.check(mockRequest as Request, mockResponse as Response);

    // Verify process methods were called
    expect(process.memoryUsage).toHaveBeenCalled();
    expect(process.uptime).toHaveBeenCalled();

    // Verify sendSuccess was called with correct parameters
    expect(controller['sendSuccess']).toHaveBeenCalledWith(mockResponse, {
      message: 'API is healthy and operational',
      data: {
        uptime: 3600,
        timestamp: '2025-06-03T10:28:00.000Z',
        environment: config.nodeEnv,
        memory: {
          used: 24,
          total: 48,
          free: 24,
          usage: '50%',
        },
      },
    });
  });
});
