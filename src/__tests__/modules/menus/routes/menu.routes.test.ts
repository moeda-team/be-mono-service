// Menu routes test

// First we need to set up our mocks before importing the module under test

// Mock controllers with mock methods
jest.mock('../../../../modules/menus/controllers/menu.controller', () => ({
  MenuController: jest.fn().mockImplementation(() => ({
    getAllMenus: 'getAllMenusMethod',
    getMenuById: 'getMenuByIdMethod',
    createMenu: 'createMenuMethod',
    updateMenu: 'updateMenuMethod',
    deleteMenu: 'deleteMenuMethod',
  })),
}));

jest.mock('../../../../modules/menus/controllers/health.controller', () => ({
  HealthController: jest.fn().mockImplementation(() => ({
    check: 'healthCheckMethod',
  })),
}));

// Mock validators
jest.mock('../../../../modules/menus/validators/menu.validator', () => ({
  validateCreateMenu: 'validateCreateMenuMiddleware',
  validateUpdateMenu: 'validateUpdateMenuMiddleware',
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
const mockMenuRouter = {
  get: jest.fn().mockReturnThis(),
  post: jest.fn().mockReturnThis(),
  put: jest.fn().mockReturnThis(),
  delete: jest.fn().mockReturnThis(),
  use: jest.fn().mockReturnThis(),
  mockMenuRouterInstance: true,
};

jest.mock('express', () => ({
  Router: jest.fn(() => mockMenuRouter),
}));

describe('Menu Routes', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.resetModules();
  });

  it('should define all routes correctly', () => {
    // Import the routes module - this will execute the code that sets up routes
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    require('../../../../modules/menus/routes/menu.routes');

    // Verify health route is called with the health controller's check method
    expect(mockMenuRouter.get).toHaveBeenCalledWith('/health', 'healthCheckMethod');

    // Verify get all menus route
    expect(mockMenuRouter.get).toHaveBeenCalledWith(
      '/:outletId',
      'basicAuthMiddleware',
      'getAllMenusMethod',
    );

    // Verify get menu by ID route
    expect(mockMenuRouter.get).toHaveBeenCalledWith(
      '/:outletId/:id',
      'basicAuthMiddleware',
      'getMenuByIdMethod',
    );

    // Verify create menu route
    expect(mockMenuRouter.post).toHaveBeenCalledWith(
      '/',
      'jwtAuthMiddleware',
      'roleAuth(STORE_MANAGER)Middleware',
      'validateCreateMenuMiddleware',
      'createMenuMethod',
    );

    // Verify update menu route
    expect(mockMenuRouter.put).toHaveBeenCalledWith(
      '/:id',
      'jwtAuthMiddleware',
      'roleAuth(STORE_MANAGER)Middleware',
      'validateUpdateMenuMiddleware',
      'updateMenuMethod',
    );

    // Verify delete menu route
    expect(mockMenuRouter.delete).toHaveBeenCalledWith(
      '/:id',
      'jwtAuthMiddleware',
      'roleAuth(STORE_MANAGER)Middleware',
      'deleteMenuMethod',
    );
  });

  it('should export the router', () => {
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const menuRouter = require('../../../../modules/menus/routes/menu.routes').default;
    expect(menuRouter).toBeDefined();
    expect(menuRouter.mockMenuRouterInstance).toBe(true);
  });
});
