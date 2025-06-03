// Order routes test

// First we need to set up our mocks before importing the module under test

// Mock controllers with mock methods
jest.mock('../../../../modules/transactions/controllers/order.controller', () => ({
  OrderController: jest.fn().mockImplementation(() => ({
    getOrderByTransactionId: 'getOrderByTransactionIdMethod',
    updateTransactionStatus: 'updateTransactionStatusMethod',
  })),
}));

// Mock validators
jest.mock('../../../../modules/transactions/validators/transaction.validator', () => ({
  validateUpdateTransactionStatus: 'validateUpdateTransactionStatusMiddleware',
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
  patch: jest.fn().mockReturnThis(),
  delete: jest.fn().mockReturnThis(),
  use: jest.fn().mockReturnThis(),
  mockRouterInstance: true,
};

jest.mock('express', () => ({
  Router: jest.fn(() => mockRouter),
}));

describe('Order Routes', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.resetModules();
  });

  it('should define all routes correctly', () => {
    // Import the routes module - this will execute the code that sets up routes
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    require('../../../../modules/transactions/routes/order.routes');

    // Verify get order by transaction ID route
    expect(mockRouter.get).toHaveBeenCalledWith(
      '/list',
      'jwtAuthMiddleware',
      'roleAuth(EMPLOYEE)Middleware',
      'getOrderByTransactionIdMethod',
    );

    // Verify update transaction status route
    expect(mockRouter.patch).toHaveBeenCalledWith(
      '/status/:id',
      'jwtAuthMiddleware',
      'roleAuth(EMPLOYEE)Middleware',
      'validateUpdateTransactionStatusMiddleware',
      'updateTransactionStatusMethod',
    );
  });

  it('should export the router', () => {
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const orderRouter = require('../../../../modules/transactions/routes/order.routes').default;
    expect(orderRouter).toBeDefined();
    expect(orderRouter.mockRouterInstance).toBe(true);
  });
});
