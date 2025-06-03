import { config, isProduction } from '../../config';

describe('Config', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    jest.resetModules();
    process.env = { ...originalEnv };
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  describe('config object', () => {
    it('should use environment variables when available', () => {
      // Arrange
      process.env.NODE_ENV = 'test';
      process.env.PORT = '4000';
      process.env.API_PREFIX = '/test-api';
      process.env.CORS_ORIGIN = 'https://test.example.com';
      
      // Act
      jest.isolateModules(() => {
        const { config } = require('../../config');
        
        // Assert
        expect(config.nodeEnv).toBe('test');
        expect(config.port).toBe(4000);
        expect(config.apiPrefix).toBe('/test-api');
        expect(config.corsOrigin).toBe('https://test.example.com');
      });
    });

    it('should use default values when environment variables are not available', () => {
      // Arrange
      delete process.env.NODE_ENV;
      delete process.env.PORT;
      delete process.env.API_PREFIX;
      delete process.env.CORS_ORIGIN;
      
      // Act
      jest.isolateModules(() => {
        const { config } = require('../../config');
        
        // Assert
        expect(config.nodeEnv).toBe('development');
        expect(config.port).toBe(3000);
        expect(config.apiPrefix).toBe('/api');
        expect(config.corsOrigin).toBe('*');
      });
    });
  });

  describe('isProduction', () => {
    it('should be true when NODE_ENV is production', () => {
      // Arrange
      process.env.NODE_ENV = 'production';
      
      // Act
      jest.isolateModules(() => {
        const { isProduction } = require('../../config');
        
        // Assert
        expect(isProduction).toBe(true);
      });
    });

    it('should be false when NODE_ENV is not production', () => {
      // Arrange
      process.env.NODE_ENV = 'development';
      
      // Act
      jest.isolateModules(() => {
        const { isProduction } = require('../../config');
        
        // Assert
        expect(isProduction).toBe(false);
      });
    });

    it('should be false when NODE_ENV is not set', () => {
      // Arrange
      delete process.env.NODE_ENV;
      
      // Act
      jest.isolateModules(() => {
        const { isProduction } = require('../../config');
        
        // Assert
        expect(isProduction).toBe(false);
      });
    });
  });
});
