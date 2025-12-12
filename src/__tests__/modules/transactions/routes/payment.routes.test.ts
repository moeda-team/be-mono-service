// Payment routes test

// First we need to set up our mocks before importing the module under test

// Mock controllers with mock methods
jest.mock('../../../../modules/transactions/controllers/payment.controller', () => ({
  PaymentController: jest.fn().mockImplementation(() => ({
    handlePaymentNotification: 'handlePaymentNotificationMethod',
    paymentTransaction: 'paymentTransactionMethod',
    getPaymentStatus: 'getPaymentStatusMethod',
  })),
}));

// Mock validators
jest.mock('../../../../modules/transactions/validators/payment.validator', () => ({
  validatePayment: 'validatePaymentMiddleware',
  validatePaymentNotification: 'validatePaymentNotificationMiddleware',
}));

// Mock middleware
jest.mock('../../../../middlewares', () => ({
  jwtAuthNotRequired: 'jwtAuthNotRequiredMiddleware',
  basicAuth: 'basicAuthMiddleware',
}));

// Mock express
const mockPaymentRouter = {
  get: jest.fn().mockReturnThis(),
  post: jest.fn().mockReturnThis(),
  put: jest.fn().mockReturnThis(),
  delete: jest.fn().mockReturnThis(),
  use: jest.fn().mockReturnThis(),
  mockPaymentRouterInstance: true,
};

jest.mock('express', () => ({
  Router: jest.fn(() => mockPaymentRouter),
}));

describe('Payment Routes', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.resetModules();
  });

  it('should define all routes correctly', () => {
    // Import the routes module - this will execute the code that sets up routes
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    require('../../../../modules/transactions/routes/payment.routes');

    // Verify payment notification route
    expect(mockPaymentRouter.post).toHaveBeenCalledWith(
      '/notification',
      'validatePaymentNotificationMiddleware',
      'handlePaymentNotificationMethod',
    );

    // Verify payment transaction route
    expect(mockPaymentRouter.post).toHaveBeenCalledWith(
      '/',
      'jwtAuthNotRequiredMiddleware',
      'validatePaymentMiddleware',
      'paymentTransactionMethod',
    );

    // Verify get payment status route
    expect(mockPaymentRouter.get).toHaveBeenCalledWith(
      '/status/:paymentNumber',
      'basicAuthMiddleware',
      'getPaymentStatusMethod',
    );
  });

  it('should export the router', () => {
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const paymentRouter = require('../../../../modules/transactions/routes/payment.routes').default;
    expect(paymentRouter).toBeDefined();
    expect(paymentRouter.mockPaymentRouterInstance).toBe(true);
  });
});
