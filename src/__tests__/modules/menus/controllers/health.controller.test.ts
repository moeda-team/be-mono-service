import { Request, Response } from 'express';
import { HealthController } from '../../../../modules/menus/controllers/health.controller';
import { config } from '../../../../config';

// Mock the process.memoryUsage function
const mockMemoryUsage = {
  heapUsed: 50 * 1024 * 1024, // 50MB in bytes
  heapTotal: 100 * 1024 * 1024, // 100MB in bytes
  rss: 150 * 1024 * 1024,
  external: 10 * 1024 * 1024,
  arrayBuffers: 5 * 1024 * 1024,
};

jest.spyOn(process, 'memoryUsage').mockReturnValue(mockMemoryUsage);
jest.spyOn(process, 'uptime').mockReturnValue(3600); // 1 hour uptime

// Mock Date to return a consistent timestamp
const mockDate = new Date('2025-06-03T10:23:25.000Z');
jest.spyOn(global, 'Date').mockImplementation(() => mockDate as unknown as Date);

describe('HealthController', () => {
  let controller: HealthController;
  let mockRequest: Partial<Request>;
  let mockResponse: Partial<Response>;
  let jsonSpy: jest.Mock;
  let statusSpy: jest.Mock;

  beforeEach(() => {
    controller = new HealthController();
    mockRequest = {};
    
    statusSpy = jest.fn().mockReturnThis();
    jsonSpy = jest.fn();
    
    mockResponse = {
      status: statusSpy,
      json: jsonSpy,
    } as Partial<Response>;
    
    jest.clearAllMocks();
  });

  it('should return health status with memory usage information', () => {
    // Call the health check endpoint
    controller.check(mockRequest as Request, mockResponse as Response);

    // Verify that process.memoryUsage was called
    expect(process.memoryUsage).toHaveBeenCalled();
    
    // Verify that process.uptime was called
    expect(process.uptime).toHaveBeenCalled();
    
    // Verify response was sent with correct data
    expect(jsonSpy).toHaveBeenCalledWith({
      status: 'success',
      message: 'API is healthy and operational',
      data: {
        uptime: 3600,
        timestamp: '2025-06-03T10:23:25.000Z',
        environment: config.nodeEnv,
        memory: {
          used: 50,
          total: 100,
          free: 50,
          usage: '50%',
        },
      },
    });
    
    // Verify status code was 200
    expect(statusSpy).toHaveBeenCalledWith(200);
  });
});
