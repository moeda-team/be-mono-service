// Outlet routes index test

// Mock outlet routes before other imports
jest.mock('../../../../modules/outlets/routes/outlet.routes', () => ({
  __esModule: true,
  default: 'mockOutletRouter',
}));

// Mock express
const mockRouter = {
  get: jest.fn().mockReturnThis(),
  post: jest.fn().mockReturnThis(),
  put: jest.fn().mockReturnThis(),
  delete: jest.fn().mockReturnThis(),
  use: jest.fn().mockReturnThis(),
  mockRouterInstance: true,
};

jest.mock('express', () => ({
  Router: jest.fn(() => mockRouter),
}));

describe('Outlet Routes Index', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.resetModules();
  });

  it('should set up routes correctly', () => {
    // Import the routes module - this will execute the code that sets up routes
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    require('../../../../modules/outlets/routes/index');

    // Verify the outlet routes are mounted at the root path
    expect(mockRouter.use).toHaveBeenCalledWith('/', 'mockOutletRouter');
  });

  it('should export the router', () => {
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const indexRouter = require('../../../../modules/outlets/routes/index').default;
    expect(indexRouter).toBeDefined();
    expect(indexRouter.mockRouterInstance).toBe(true);
  });
});
