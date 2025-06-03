// User routes test

// First we need to set up our mocks before importing the module under test

// Mock controllers with mock methods
jest.mock('../../../../modules/users/controllers/user.controller', () => ({
  UserController: jest.fn().mockImplementation(() => ({
    getUserById: 'getUserByIdMethod',
    getAllUsers: 'getAllUsersMethod',
    createUser: 'createUserMethod',
    updateUser: 'updateUserMethod',
    deleteUser: 'deleteUserMethod',
  })),
}));

jest.mock('../../../../modules/users/controllers/health.controller', () => ({
  HealthController: jest.fn().mockImplementation(() => ({
    check: 'healthCheckMethod',
  })),
}));

jest.mock('../../../../modules/users/controllers/auth.controller', () => ({
  AuthController: jest.fn().mockImplementation(() => ({
    login: 'loginMethod',
  })),
}));

// Mock validators
jest.mock('../../../../modules/users/validators/user.validator', () => ({
  validateCreateUser: 'validateCreateUserMiddleware',
  validateUpdateUser: 'validateUpdateUserMiddleware',
}));

// Mock middleware
jest.mock('../../../../middlewares', () => ({
  jwtAuth: 'jwtAuthMiddleware',
  roleAuth: jest.fn().mockImplementation(role => `roleAuth(${role})Middleware`),
}));

// Mock UserRole enum
jest.mock('../../../../utils/auth/jwt', () => ({
  UserRole: {
    EMPLOYEE: 'EMPLOYEE',
    STORE_MANAGER: 'STORE_MANAGER',
    OWNER: 'OWNER',
  },
}));

// Mock express
const mockUserRouter = {
  get: jest.fn().mockReturnThis(),
  post: jest.fn().mockReturnThis(),
  put: jest.fn().mockReturnThis(),
  delete: jest.fn().mockReturnThis(),
  use: jest.fn().mockReturnThis(),
  mockUserRouterInstance: true,
};

jest.mock('express', () => ({
  Router: jest.fn(() => mockUserRouter),
}));

describe('User Routes', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.resetModules();
  });

  it('should define all routes correctly', () => {
    // Import the routes module - this will execute the code that sets up routes
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    require('../../../../modules/users/routes/user.routes');

    // Verify health route is called with the health controller's check method
    expect(mockUserRouter.get).toHaveBeenCalledWith('/health', 'healthCheckMethod');

    // Verify login route
    expect(mockUserRouter.post).toHaveBeenCalledWith('/login', 'loginMethod');

    // Verify get user by ID route
    expect(mockUserRouter.get).toHaveBeenCalledWith(
      '/:id',
      'jwtAuthMiddleware',
      'roleAuth(EMPLOYEE)Middleware',
      'getUserByIdMethod',
    );

    // Verify get all users route
    expect(mockUserRouter.get).toHaveBeenCalledWith(
      '/',
      'jwtAuthMiddleware',
      'roleAuth(STORE_MANAGER)Middleware',
      'getAllUsersMethod',
    );

    // Verify create user route
    expect(mockUserRouter.post).toHaveBeenCalledWith(
      '/',
      'jwtAuthMiddleware',
      'roleAuth(STORE_MANAGER)Middleware',
      'validateCreateUserMiddleware',
      'createUserMethod',
    );

    // Verify update user route
    expect(mockUserRouter.put).toHaveBeenCalledWith(
      '/:id',
      'jwtAuthMiddleware',
      'roleAuth(STORE_MANAGER)Middleware',
      'validateUpdateUserMiddleware',
      'updateUserMethod',
    );

    // Verify delete user route
    expect(mockUserRouter.delete).toHaveBeenCalledWith(
      '/:id',
      'jwtAuthMiddleware',
      'roleAuth(OWNER)Middleware',
      'deleteUserMethod',
    );
  });

  it('should export the router', () => {
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const userRouter = require('../../../../modules/users/routes/user.routes').default;
    expect(userRouter).toBeDefined();
    expect(userRouter.mockUserRouterInstance).toBe(true);
  });
});
