// This file is used to configure Jest before running tests

// Set timeout for all tests
jest.setTimeout(30000);

// Mock the console methods to avoid cluttering test output
global.console = {
  ...console,
  // Uncomment these to silence specific console methods during tests
  // log: jest.fn(),
  // info: jest.fn(),
  // warn: jest.fn(),
  // error: jest.fn(),
};

// Add any global mocks or configurations here
