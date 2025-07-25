// Transaction routes test
let transactionRoutes: unknown;

// First we need to set up our mocks before importing the module under test

// Mock controllers with mock methods
jest.mock('../../../../modules/transactions/controllers/transaction.controller', () => ({
  TransactionController: jest.fn().mockImplementation(() => ({
    getTransactionById: 'getTransactionByIdMethod',
    getAllTransactions: 'getAllTransactionsMethod',
    createTransaction: 'createTransactionMethod',
    deleteTransaction: 'deleteTransactionMethod',
  })),
}));

jest.mock('../../../../modules/transactions/controllers/health.controller', () => ({
  HealthController: jest.fn().mockImplementation(() => ({
    check: 'healthCheckMethod',
  })),
}));

// Mock validators
jest.mock('../../../../modules/transactions/validators/transaction.validator', () => ({
  validateCreateTransaction: 'validateCreateTransactionMiddleware',
}));

// Mock middleware
jest.mock('../../../../middlewares', () => ({
  jwtAuth: 'jwtAuthMiddleware',
  basicAuth: 'basicAuthMiddleware',
  jwtAuthNotRequired: 'jwtAuthNotRequiredMiddleware',
  roleAuth: jest.fn().mockImplementation(role => `roleAuth(${role})Middleware`),
}));

// Mock UserRole enum
jest.mock('../../../../utils/auth/jwt', () => ({
  UserRole: {
    EMPLOYEE: 'EMPLOYEE',
  },
}));

// Define the mock router type
interface MockRouter {
  get: jest.Mock;
  post: jest.Mock;
  put: jest.Mock;
  patch: jest.Mock;
  delete: jest.Mock;
  use: jest.Mock;
  mockRouterInstance: boolean;
}

// Declare mock router variable (var to avoid TDZ with Jest mock hoisting)
let mockTransactionRouter: MockRouter;

// Mock express and lazily create router inside factory to avoid hoisting issues
jest.mock('express', () => {
  mockTransactionRouter = {
    get: jest.fn().mockReturnThis(),
    post: jest.fn().mockReturnThis(),
    put: jest.fn().mockReturnThis(),
    patch: jest.fn().mockReturnThis(),
    delete: jest.fn().mockReturnThis(),
    use: jest.fn().mockReturnThis(),
    mockRouterInstance: true,
  };

  return {
    Router: jest.fn(() => mockTransactionRouter),
  };
});

describe('Transaction Routes', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.resetModules();
    // Load routes after mocks are set up
    transactionRoutes =
      // eslint-disable-next-line @typescript-eslint/no-var-requires
      require('../../../../modules/transactions/routes/transaction.routes').default;
  });

  it('should define all routes correctly', () => {
    // Ensure the module was loaded
    expect(transactionRoutes).toBeDefined();

    // Verify health route is called with the health controller's check method
    expect(mockTransactionRouter.get).toHaveBeenCalledWith('/health', 'healthCheckMethod');

    // Verify get transaction by ID route
    expect(mockTransactionRouter.get).toHaveBeenCalledWith(
      '/:id',
      'basicAuthMiddleware',
      'getTransactionByIdMethod',
    );

    // Verify get all transactions route
    expect(mockTransactionRouter.get).toHaveBeenCalledWith(
      '/',
      'jwtAuthMiddleware',
      'roleAuth(EMPLOYEE)Middleware',
      'getAllTransactionsMethod',
    );

    // Verify create transaction route
    expect(mockTransactionRouter.post).toHaveBeenCalledWith(
      '/',
      'jwtAuthNotRequiredMiddleware',
      'validateCreateTransactionMiddleware',
      'createTransactionMethod',
    );

    // Verify delete transaction route
    expect(mockTransactionRouter.delete).toHaveBeenCalledWith(
      '/:id',
      'jwtAuthMiddleware',
      'roleAuth(EMPLOYEE)Middleware',
      'deleteTransactionMethod',
    );
  });

  it('should export the router', () => {
    // Type assertion to tell TypeScript we know this is our mock router
    const transactionRouter = transactionRoutes as unknown as MockRouter;
    expect(transactionRouter).toBeDefined();
    expect(transactionRouter.mockRouterInstance).toBe(true);
  });
});
