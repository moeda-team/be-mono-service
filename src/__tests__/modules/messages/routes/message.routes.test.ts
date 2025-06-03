// Message routes test

// First we need to set up our mocks before importing the module under test

// Mock controllers with mock methods
jest.mock('../../../../modules/messages/controllers/message.controller', () => ({
  MessageController: jest.fn().mockImplementation(() => ({
    getAllMessages: 'getAllMessagesMethod',
    getMessageById: 'getMessageByIdMethod',
    createMessage: 'createMessageMethod',
    updateMessage: 'updateMessageMethod',
    deleteMessage: 'deleteMessageMethod',
  })),
}));

jest.mock('../../../../modules/messages/controllers/health.controller', () => ({
  HealthController: jest.fn().mockImplementation(() => ({
    check: 'healthCheckMethod',
  })),
}));

// Mock validators
jest.mock('../../../../modules/messages/validators/message.validator', () => ({
  validateCreateMessage: 'validateCreateMessageMiddleware',
  validateUpdateMessage: 'validateUpdateMessageMiddleware',
  validateGetMessageById: 'validateGetMessageByIdMiddleware',
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

describe('Message Routes', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.resetModules();
  });

  it('should define all routes correctly', () => {
    // Import the routes module - this will execute the code that sets up routes
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    require('../../../../modules/messages/routes/message.routes');

    // Verify health route is called with the health controller's check method
    expect(mockRouter.get).toHaveBeenCalledWith('/health', 'healthCheckMethod');

    // Verify get message by ID route
    expect(mockRouter.get).toHaveBeenCalledWith(
      '/:id',
      'jwtAuthMiddleware',
      'roleAuth(STORE_MANAGER)Middleware',
      'getMessageByIdMethod',
    );

    // Verify get all messages route
    expect(mockRouter.get).toHaveBeenCalledWith(
      '/',
      'jwtAuthMiddleware',
      'roleAuth(STORE_MANAGER)Middleware',
      'getAllMessagesMethod',
    );

    // Verify create message route
    expect(mockRouter.post).toHaveBeenCalledWith(
      '/',
      'basicAuthMiddleware',
      'validateCreateMessageMiddleware',
      'createMessageMethod',
    );

    // Note: PUT and DELETE routes are not implemented in the actual code
  });

  it('should export the router', () => {
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const messageRouter = require('../../../../modules/messages/routes/message.routes').default;
    expect(messageRouter).toBeDefined();
    expect(messageRouter.mockRouterInstance).toBe(true);
  });
});
