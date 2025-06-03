// Menu routes index test

// Mock menu and category routes before other imports
jest.mock('../../../../modules/menus/routes/menu.routes', () => ({
  __esModule: true,
  default: 'mockMenuRouter',
}));

jest.mock('../../../../modules/menus/routes/category.routes', () => ({
  __esModule: true,
  default: 'mockCategoryRouter',
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

describe('Menu Routes Index', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.resetModules();
  });

  it('should set up routes correctly', () => {
    // Import the routes module - this will execute the code that sets up routes
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    require('../../../../modules/menus/routes/index');

    // Verify the menu routes are mounted at the correct paths
    expect(mockRouter.use).toHaveBeenCalledWith('/main', 'mockMenuRouter');
    expect(mockRouter.use).toHaveBeenCalledWith('/categories', 'mockCategoryRouter');
  });

  it('should export the router', () => {
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const indexRouter = require('../../../../modules/menus/routes/index').default;
    expect(indexRouter).toBeDefined();
    expect(indexRouter.mockRouterInstance).toBe(true);
  });
});
