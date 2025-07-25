import winston from 'winston';

// Mock the config module before importing logger
// Create a mock module with a getter for isProduction
const mockConfig = {
  get isProduction() {
    return false; // Default to development mode
  },
  config: {
    nodeEnv: 'test',
    port: 3000,
    apiPrefix: '/api',
    corsOrigin: '*',
  },
};

// Mock the config module
jest.mock('../../../config', () => mockConfig);

// Import after mocking
import { logger } from '../../../utils/common/logger';

// Mock winston
jest.mock('winston', () => {
  const mockFormat = {
    combine: jest.fn().mockReturnThis(),
    timestamp: jest.fn().mockReturnThis(),
    json: jest.fn().mockReturnThis(),
    colorize: jest.fn().mockReturnThis(),
    simple: jest.fn().mockReturnThis(),
  };

  const mockTransport = jest.fn().mockImplementation(() => ({
    format: mockFormat,
  }));

  return {
    format: mockFormat,
    createLogger: jest.fn().mockImplementation(options => ({
      level: options?.level || 'info',
      format: mockFormat,
      transports: [new mockTransport()],
      info: jest.fn(),
      error: jest.fn(),
      warn: jest.fn(),
      debug: jest.fn(),
    })),
    transports: {
      Console: mockTransport,
      File: mockTransport,
    },
  };
});

describe('Logger', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should create a logger with the correct configuration in production mode', () => {
    // Mock production environment
    Object.defineProperty(mockConfig, 'isProduction', {
      get: jest.fn().mockReturnValue(true),
      configurable: true,
    });

    // Re-import the logger to trigger the configuration with our mocked environment
    jest.isolateModules(() => {
      // eslint-disable-next-line @typescript-eslint/no-var-requires
      const { logger } = require('../../../utils/common/logger');

      expect(winston.createLogger).toHaveBeenCalled();
      expect(logger.level).toBe('info');
      expect(winston.format.combine).toHaveBeenCalled();
      expect(winston.format.timestamp).toHaveBeenCalled();
      expect(winston.format.json).toHaveBeenCalled();
      expect(winston.transports.Console).toHaveBeenCalled();
    });
  });

  it('should create a logger with the correct configuration in development mode', () => {
    // Mock development environment
    Object.defineProperty(mockConfig, 'isProduction', {
      get: jest.fn().mockReturnValue(false),
      configurable: true,
    });

    // Re-import the logger to trigger the configuration with our mocked environment
    jest.isolateModules(() => {
      // eslint-disable-next-line @typescript-eslint/no-var-requires
      const { logger } = require('../../../utils/common/logger');

      expect(winston.createLogger).toHaveBeenCalled();
      expect(logger.level).toBe('debug');
      expect(winston.format.combine).toHaveBeenCalled();
      expect(winston.format.timestamp).toHaveBeenCalled();
      expect(winston.format.json).toHaveBeenCalled();
      expect(winston.transports.Console).toHaveBeenCalled();
    });
  });

  it('should have the expected logging methods', () => {
    expect(logger.info).toBeDefined();
    expect(logger.error).toBeDefined();
    expect(logger.warn).toBeDefined();
    expect(logger.debug).toBeDefined();
  });
});
