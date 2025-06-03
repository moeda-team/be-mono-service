// User routes index test

// Mock user routes before other imports
jest.mock('../../../../modules/users/routes/user.routes', () => ({
  __esModule: true,
  default: 'mockUserIndexRouter',
}));

// Mock express
const mockUserIndexRouter = {
  get: jest.fn().mockReturnThis(),
  post: jest.fn().mockReturnThis(),
  put: jest.fn().mockReturnThis(),
  delete: jest.fn().mockReturnThis(),
  use: jest.fn().mockReturnThis(),
  mockUserIndexRouterInstance: true,
};

jest.mock('express', () => ({
  Router: jest.fn(() => mockUserIndexRouter),
}));

describe('User Routes Index', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.resetModules();
  });

  it('should set up routes correctly', () => {
    // Import the routes module - this will execute the code that sets up routes
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    require('../../../../modules/users/routes/index');

    // Verify the user routes are mounted at the root path
    expect(mockUserIndexRouter.use).toHaveBeenCalledWith('/', 'mockUserIndexRouter');
  });

  it('should export the router', () => {
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const indexRouter = require('../../../../modules/users/routes/index').default;
    expect(indexRouter).toBeDefined();
    expect(indexRouter.mockUserIndexRouterInstance).toBe(true);
  });
});
