// Transaction routes test

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
  jwtAuthNotRequired: 'jwtAuthNotRequiredMiddleware',
  roleAuth: jest.fn().mockImplementation(role => `roleAuth(${role})Middleware`),
}));

// Mock UserRole enum
jest.mock('../../../../utils/auth/jwt', () => ({
  UserRole: {
    EMPLOYEE: 'EMPLOYEE',
  },
}));

// Mock express
const mockTransactionRouter = {
  get: jest.fn().mockReturnThis(),
  post: jest.fn().mockReturnThis(),
  put: jest.fn().mockReturnThis(),
  delete: jest.fn().mockReturnThis(),
  use: jest.fn().mockReturnThis(),
  mockRouterInstance: true,
};

jest.mock('express', () => ({
  Router: jest.fn(() => mockTransactionRouter),
}));

describe('Transaction Routes', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.resetModules();
  });

  it('should define all routes correctly', () => {
    // Import the routes module - this will execute the code that sets up routes
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    require('../../../../modules/transactions/routes/transaction.routes');

    // Verify health route is called with the health controller's check method
    expect(mockTransactionRouter.get).toHaveBeenCalledWith('/health', 'healthCheckMethod');

    // Verify get transaction by ID route
    expect(mockTransactionRouter.get).toHaveBeenCalledWith(
      '/:id',
      'jwtAuthMiddleware',
      'roleAuth(EMPLOYEE)Middleware',
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
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const transactionRouter = require('../../../../modules/transactions/routes/transaction.routes').default;
    expect(transactionRouter).toBeDefined();
    expect(transactionRouter.mockRouterInstance).toBe(true);
  });
});
