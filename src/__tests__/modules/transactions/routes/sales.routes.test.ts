// Sales routes test

// First we need to set up our mocks before importing the module under test

// Mock controllers with mock methods
jest.mock('../../../../modules/transactions/controllers/sales.controller', () => ({
  SalesController: jest.fn().mockImplementation(() => ({
    getTransactionCountByCategory: 'getTransactionCountByCategoryMethod',
    getTransactionCountByPaymentMethod: 'getTransactionCountByPaymentMethodMethod',
    getTransactionCashflow: 'getTransactionCashflowMethod',
  })),
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

describe('Sales Routes', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.resetModules();
  });

  it('should define all routes correctly', () => {
    // Import the routes module - this will execute the code that sets up routes
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    require('../../../../modules/transactions/routes/sales.routes');

    // Verify get transaction count by category route
    expect(mockRouter.get).toHaveBeenCalledWith(
      '/category/:type',
      'jwtAuthMiddleware',
      'roleAuth(EMPLOYEE)Middleware',
      'getTransactionCountByCategoryMethod',
    );

    // Verify get transaction count by payment method route
    expect(mockRouter.get).toHaveBeenCalledWith(
      '/method/:type',
      'jwtAuthMiddleware',
      'roleAuth(EMPLOYEE)Middleware',
      'getTransactionCountByPaymentMethodMethod',
    );

    // Verify get transaction cashflow route
    expect(mockRouter.get).toHaveBeenCalledWith(
      '/cashflow/:type',
      'jwtAuthMiddleware',
      'roleAuth(EMPLOYEE)Middleware',
      'getTransactionCashflowMethod',
    );
  });

  it('should export the router', () => {
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const salesRouter = require('../../../../modules/transactions/routes/sales.routes').default;
    expect(salesRouter).toBeDefined();
    expect(salesRouter.mockRouterInstance).toBe(true);
  });
});
