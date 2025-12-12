// Transaction routes index test

// Mock transaction routes before other imports
jest.mock('../../../../modules/transactions/routes/transaction.routes', () => ({
  __esModule: true,
  default: 'mockTransactionRouter',
}));

jest.mock('../../../../modules/transactions/routes/payment.routes', () => ({
  __esModule: true,
  default: 'mockPaymentRouter',
}));

jest.mock('../../../../modules/transactions/routes/sales.routes', () => ({
  __esModule: true,
  default: 'mockSalesRouter',
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

describe('Transaction Routes Index', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.resetModules();
  });

  it('should set up routes correctly', () => {
    // Import the routes module - this will execute the code that sets up routes
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    require('../../../../modules/transactions/routes/index');

    // Verify the transaction routes are mounted at the correct paths
    expect(mockRouter.use).toHaveBeenCalledWith('/main', 'mockTransactionRouter');
    expect(mockRouter.use).toHaveBeenCalledWith('/payments', 'mockPaymentRouter');
    expect(mockRouter.use).toHaveBeenCalledWith('/sales', 'mockSalesRouter');
  });

  it('should export the router', () => {
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const indexRouter = require('../../../../modules/transactions/routes/index').default;
    expect(indexRouter).toBeDefined();
    expect(indexRouter.mockRouterInstance).toBe(true);
  });
});
