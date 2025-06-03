// Outlet routes test

// First we need to set up our mocks before importing the module under test

// Mock controllers with mock methods
jest.mock('../../../../modules/outlets/controllers/outlet.controller', () => ({
  OutletController: jest.fn().mockImplementation(() => ({
    getOutletById: 'getOutletByIdMethod',
    getAllOutlets: 'getAllOutletsMethod',
    createOutlet: 'createOutletMethod',
    updateOutlet: 'updateOutletMethod',
    deleteOutlet: 'deleteOutletMethod',
  })),
}));

jest.mock('../../../../modules/outlets/controllers/health.controller', () => ({
  HealthController: jest.fn().mockImplementation(() => ({
    check: 'healthCheckMethod',
  })),
}));

// Mock validators
jest.mock('../../../../modules/outlets/validators/outlet.validator', () => ({
  validateCreateOutlet: 'validateCreateOutletMiddleware',
  validateUpdateOutlet: 'validateUpdateOutletMiddleware',
}));

// Mock middleware
jest.mock('../../../../middlewares', () => ({
  jwtAuth: 'jwtAuthMiddleware',
  roleAuth: jest.fn().mockImplementation(role => `roleAuth(${role})Middleware`),
}));

// Mock UserRole enum
jest.mock('../../../../utils/auth/jwt', () => ({
  UserRole: {
    OWNER: 'OWNER',
  },
}));

// Mock express
const mockOutletRouter = {
  get: jest.fn().mockReturnThis(),
  post: jest.fn().mockReturnThis(),
  put: jest.fn().mockReturnThis(),
  delete: jest.fn().mockReturnThis(),
  use: jest.fn().mockReturnThis(),
  mockRouterInstance: true,
};

jest.mock('express', () => ({
  Router: jest.fn(() => mockOutletRouter),
}));

describe('Outlet Routes', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.resetModules();
  });

  it('should define all routes correctly', () => {
    // Import the routes module - this will execute the code that sets up routes
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    require('../../../../modules/outlets/routes/outlet.routes');

    // Verify health route is called with the health controller's check method
    expect(mockOutletRouter.get).toHaveBeenCalledWith('/health', 'healthCheckMethod');

    // Verify get outlet by ID route
    expect(mockOutletRouter.get).toHaveBeenCalledWith('/:id', 'getOutletByIdMethod');

    // Verify get all outlets route
    expect(mockOutletRouter.get).toHaveBeenCalledWith(
      '/',
      'jwtAuthMiddleware',
      'roleAuth(OWNER)Middleware',
      'getAllOutletsMethod',
    );

    // Verify create outlet route
    expect(mockOutletRouter.post).toHaveBeenCalledWith(
      '/',
      'jwtAuthMiddleware',
      'roleAuth(OWNER)Middleware',
      'validateCreateOutletMiddleware',
      'createOutletMethod',
    );

    // Verify update outlet route
    expect(mockOutletRouter.put).toHaveBeenCalledWith(
      '/:id',
      'jwtAuthMiddleware',
      'roleAuth(OWNER)Middleware',
      'validateUpdateOutletMiddleware',
      'updateOutletMethod',
    );

    // Verify delete outlet route
    expect(mockOutletRouter.delete).toHaveBeenCalledWith(
      '/:id',
      'jwtAuthMiddleware',
      'roleAuth(OWNER)Middleware',
      'deleteOutletMethod',
    );
  });

  it('should export the router', () => {
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const outletRouter = require('../../../../modules/outlets/routes/outlet.routes').default;
    expect(outletRouter).toBeDefined();
    expect(outletRouter.mockRouterInstance).toBe(true);
  });
});
