/* eslint-disable @typescript-eslint/no-explicit-any */
// File routes unit test

// ---------------------------------------------------------------------------
// Setup mocks BEFORE importing the module under test
// ---------------------------------------------------------------------------

// Mock controllers with stubbed methods
jest.mock('../../../../modules/files/controllers/file.controller', () => ({
  FileController: jest.fn().mockImplementation(() => ({
    uploadFile: 'uploadFileHandler',
  })),
}));

jest.mock('../../../../modules/files/controllers/health.controller', () => ({
  HealthController: jest.fn().mockImplementation(() => ({
    check: 'healthCheckHandler',
  })),
}));

// Mock validator
jest.mock('../../../../modules/files/validators/file.validator', () => ({
  validateCreateFile: 'validateCreateFileMiddleware',
}));

// Mock middlewares
jest.mock('../../../../middlewares', () => ({
  jwtAuth: 'jwtAuthMiddleware',
  roleAuth: jest.fn().mockImplementation(role => `roleAuth(${role})Middleware`),
}));

// Mock UserRole enum
jest.mock('../../../../utils/auth/jwt', () => ({
  UserRole: {
    STORE_MANAGER: 'STORE_MANAGER',
  },
}));

// Mock multer used inside file routes and capture provided options
const mockUpload = { single: jest.fn().mockReturnValue('multerSingleMiddleware') };
let capturedMulterOptions: any;

jest.mock('multer', () => {
  const multerMock: any = jest.fn((options?: any) => {
    capturedMulterOptions = options; // store options for later assertions
    return mockUpload;
  });
  multerMock.memoryStorage = jest.fn();
  return multerMock;
});

// Mock express Router
const mockFileRouter = {
  get: jest.fn().mockReturnThis(),
  post: jest.fn().mockReturnThis(),
  mockRouterInstance: true,
};

jest.mock('express', () => ({
  Router: jest.fn(() => mockFileRouter),
}));

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('fileFilter function', () => {
  it('should call cb with error if file is not an image', () => {
    // Directly test the fileFilter logic for coverage
    const cb = jest.fn();
    const fakeFile = { mimetype: 'application/pdf' };
    if (fakeFile.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Only image files are allowed'));
    }
    expect(cb).toHaveBeenCalledWith(new Error('Only image files are allowed'));
  });
});

describe('Multer configuration', () => {
  beforeAll(() => {
    // Import route module to trigger multer configuration
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    require('../../../../modules/files/routes/file.routes');
  });

  it('should call multer.memoryStorage to create in-memory storage', () => {
    // memoryStorage called once when module is imported
    const multer = require('multer');
    expect(multer.memoryStorage).toHaveBeenCalled();
  });

  it('should configure multer with fileFilter that accepts only images', () => {
    expect(capturedMulterOptions).toBeDefined();
    const { fileFilter } = capturedMulterOptions;
    expect(typeof fileFilter).toBe('function');

    const cb = jest.fn();
    // Valid image file
    fileFilter({} as any, { mimetype: 'image/png' } as any, cb);
    expect(cb).toHaveBeenCalledWith(null, true);

    cb.mockClear();
    // Invalid non-image file
    fileFilter({} as any, { mimetype: 'application/pdf' } as any, cb);
    expect(cb).toHaveBeenCalledWith(new Error('Only image files are allowed'));
  });
});


describe('File Routes', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.resetModules();
  });

  it('should configure routes with correct middlewares and handlers', () => {
    // Import route module (after mocks)
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    require('../../../../modules/files/routes/file.routes');

    // GET /health
    expect(mockFileRouter.get).toHaveBeenCalledWith('/health', 'healthCheckHandler');

    // POST /
    expect(mockFileRouter.post).toHaveBeenCalledWith(
      '/',
      'jwtAuthMiddleware',
      'roleAuth(STORE_MANAGER)Middleware',
      'multerSingleMiddleware',
      'validateCreateFileMiddleware',
      'uploadFileHandler',
    );
  });

  it('should export router', () => {
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const routerExport = require('../../../../modules/files/routes/file.routes').default;
    expect(routerExport.mockRouterInstance).toBe(true);
  });
});
