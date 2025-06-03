// Message routes index test

// Mock message routes before other imports
jest.mock('../../../../modules/messages/routes/message.routes', () => ({
  __esModule: true,
  default: 'mockMessageRouter',
}));

// Mock express
const mockMessagesRouter = {
  get: jest.fn().mockReturnThis(),
  post: jest.fn().mockReturnThis(),
  put: jest.fn().mockReturnThis(),
  delete: jest.fn().mockReturnThis(),
  use: jest.fn().mockReturnThis(),
  mockMessagesRouterInstance: true,
};

jest.mock('express', () => ({
  Router: jest.fn(() => mockMessagesRouter),
}));

describe('Message Routes Index', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.resetModules();
  });

  it('should set up routes correctly', () => {
    // Import the routes module - this will execute the code that sets up routes
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    require('../../../../modules/messages/routes/index');

    // Verify the message routes are mounted at the root path
    expect(mockMessagesRouter.use).toHaveBeenCalledWith('/', 'mockMessageRouter');
  });

  it('should export the router', () => {
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const indexRouter = require('../../../../modules/messages/routes/index').default;
    expect(indexRouter).toBeDefined();
    expect(indexRouter.mockMessagesRouterInstance).toBe(true);
  });
});
