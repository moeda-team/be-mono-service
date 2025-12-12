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
    it('should use environment variables when available', async () => {
      // Arrange
      process.env.NODE_ENV = 'test';
      process.env.PORT = '4000';
      process.env.API_PREFIX = '/test-api';
      process.env.CORS_ORIGIN = 'https://test.example.com';

      // Act & Assert
      await jest.isolateModules(async () => {
        // Use dynamic import inside isolateModules to get a fresh instance
        const { config } = await import('../../config');

        expect(config.nodeEnv).toBe('test');
        expect(config.port).toBe(4000);
        expect(config.apiPrefix).toBe('/test-api');
        expect(config.corsOrigin).toBe('https://test.example.com');
      });
    });

    it('should use default values when environment variables are not available', async () => {
      // Arrange
      delete process.env.NODE_ENV;
      delete process.env.PORT;
      delete process.env.API_PREFIX;
      delete process.env.CORS_ORIGIN;

      // Act
      await jest.isolateModules(async () => {
        const { config } = await import('../../config');
        expect(config.nodeEnv).toBe('development');
        expect(config.port).toBe(3000);
        expect(config.apiPrefix).toBe('/api');
        expect(config.corsOrigin).toBe('http://localhost:3000,https://moeda-coffee.vercel.app');
      });
    });
  });

  describe('isProduction', () => {
    it('should be true when NODE_ENV is production', async () => {
      // Arrange
      process.env.NODE_ENV = 'production';

      // Act
      await jest.isolateModules(async () => {
        const { isProduction } = await import('../../config');
        expect(isProduction).toBe(true);
      });
    });

    it('should be false when NODE_ENV is not production', async () => {
      // Arrange
      process.env.NODE_ENV = 'development';

      // Act
      await jest.isolateModules(async () => {
        const { isProduction } = await import('../../config');
        expect(isProduction).toBe(false);
      });
    });

    it('should be false when NODE_ENV is not set', async () => {
      // Arrange
      delete process.env.NODE_ENV;

      // Act
      await jest.isolateModules(async () => {
        const { isProduction } = await import('../../config');
        expect(isProduction).toBe(false);
      });
    });
  });
});
