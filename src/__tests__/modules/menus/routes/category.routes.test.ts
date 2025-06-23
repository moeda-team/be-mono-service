// Category routes test

// First we need to set up our mocks before importing the module under test

// Mock controllers with mock methods
jest.mock('../../../../modules/menus/controllers/category.controller', () => ({
  CategoryController: jest.fn().mockImplementation(() => ({
    findAll: 'findAllMethod',
    findOne: 'findOneMethod',
    create: 'createMethod',
    update: 'updateMethod',
    delete: 'deleteMethod',
  })),
}));

// Mock middleware
jest.mock('../../../../middlewares', () => ({
  basicAuth: 'basicAuthMiddleware',
  jwtAuth: 'jwtAuthMiddleware',
  roleAuth: jest.fn().mockImplementation(role => `roleAuth(${role})Middleware`),
}));

// Mock UserRole enum
jest.mock('../../../../utils/auth/jwt', () => ({
  UserRole: {
    STORE_MANAGER: 'STORE_MANAGER',
  },
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

describe('Category Routes', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.resetModules();
  });

  it('should define all routes correctly', () => {
    // Import the routes module - this will execute the code that sets up routes
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    require('../../../../modules/menus/routes/category.routes');

    // Verify get all categories route
    expect(mockRouter.get).toHaveBeenCalledWith(
      '/:outletId',
      'basicAuthMiddleware',
      'findAllMethod',
    );

    // Verify get category by ID route
    expect(mockRouter.get).toHaveBeenCalledWith(
      '/:outletId/:id',
      'basicAuthMiddleware',
      'findOneMethod',
    );

    // Verify create category route
    expect(mockRouter.post).toHaveBeenCalledWith(
      '/',
      'jwtAuthMiddleware',
      'roleAuth(STORE_MANAGER)Middleware',
      [expect.any(Function), expect.any(Function)],
      'createMethod',
    );

    // Verify update category route
    expect(mockRouter.put).toHaveBeenCalledWith(
      '/:id',
      'jwtAuthMiddleware',
      'roleAuth(STORE_MANAGER)Middleware',
      [expect.any(Function), expect.any(Function)],
      'updateMethod',
    );

    // Verify delete category route
    expect(mockRouter.delete).toHaveBeenCalledWith(
      '/:id',
      'jwtAuthMiddleware',
      'roleAuth(STORE_MANAGER)Middleware',
      'deleteMethod',
    );
  });

  it('should export the router', () => {
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const categoryRouter = require('../../../../modules/menus/routes/category.routes').default;
    expect(categoryRouter).toBeDefined();
    expect(categoryRouter.mockRouterInstance).toBe(true);
  });
});
