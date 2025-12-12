/* eslint-disable @typescript-eslint/no-explicit-any */
import { Request, Response } from 'express';
import { FileController } from '../../../../modules/files/controllers/file.controller';

// ---------------------------------------------------------------------------
// Mocks
// ---------------------------------------------------------------------------
jest.mock('../../../../utils/response/responseHandler', () => ({
  ResponseHandler: {
    success: jest.fn().mockReturnValue({ mockedSuccess: true }),
    error: jest.fn().mockReturnValue({ mockedError: true }),
  },
}));

jest.mock('../../../../utils/storage/s3', () => ({
  uploadFileToS3: jest.fn(),
}));

jest.mock('../../../../utils/common/logger', () => ({
  logger: {
    error: jest.fn(),
  },
}));

// eslint-disable-next-line @typescript-eslint/no-var-requires
const { ResponseHandler } = require('../../../../utils/response/responseHandler');
// eslint-disable-next-line @typescript-eslint/no-var-requires
const { uploadFileToS3 } = require('../../../../utils/storage/s3');
// eslint-disable-next-line @typescript-eslint/no-var-requires
const { logger } = require('../../../../utils/common/logger');

// ---------------------------------------------------------------------------
// Helper to create mock request/response
// ---------------------------------------------------------------------------
const createMockReq = (
  overrides: Record<string, any> = {},
): Partial<Request> & { user?: { outletId: string }; file?: any; body?: any } => ({
  body: {},
  file: undefined,
  user: { outletId: 'outlet-1' },
  ...overrides,
});

const createMockRes = (): Partial<Response> => ({
  status: jest.fn().mockReturnThis(),
  json: jest.fn().mockReturnThis(),
});

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('FileController.uploadFile', () => {
  let controller: FileController;

  beforeEach(() => {
    controller = new FileController();
    jest.clearAllMocks();
  });

  it('returns 404 when outletId missing', async () => {
    const req = createMockReq({ user: { outletId: '' } });
    const res = createMockRes();

    await controller.uploadFile(req as any, res as any);

    expect(ResponseHandler.error).toHaveBeenCalledWith(res, {
      message: 'Outlet not found',
      statusCode: 404,
    });
  });

  it('returns 400 when file is missing', async () => {
    const req = createMockReq();
    const res = createMockRes();

    await controller.uploadFile(req as any, res as any);

    expect(ResponseHandler.error).toHaveBeenCalledWith(res, {
      message: 'File is required',
      statusCode: 400,
    });
  });

  it('uploads file successfully', async () => {
    (uploadFileToS3 as jest.Mock).mockResolvedValueOnce('https://s3/file.png');
    const mockFile = {
      buffer: Buffer.from('data'),
      originalname: 'file.png',
      mimetype: 'image/png',
    };
    const body = { category: 'avatar' };
    const req = createMockReq({ file: mockFile, body });
    const res = createMockRes();
    process.env.AWS_BUCKET = 'bucket';

    await controller.uploadFile(req as any, res as any);

    expect(uploadFileToS3).toHaveBeenCalledWith(
      body.category,
      mockFile.buffer,
      mockFile.originalname,
      mockFile.mimetype,
      'outlet-1',
      'bucket',
    );
    expect(ResponseHandler.success).toHaveBeenCalledWith(res, {
      message: 'File uploaded successfully',
      data: { ...body, fileUrl: 'https://s3/file.png' },
    });
  });

  it('handles internal error', async () => {
    (uploadFileToS3 as jest.Mock).mockRejectedValueOnce(new Error('s3 error'));
    const mockFile = {
      buffer: Buffer.from('data'),
      originalname: 'file.png',
      mimetype: 'image/png',
    };
    const req = createMockReq({ file: mockFile, body: { category: 'avatar' } });
    const res = createMockRes();

    await controller.uploadFile(req as any, res as any);

    expect(logger.error).toHaveBeenCalled();
    expect(ResponseHandler.error).toHaveBeenCalledWith(res, {
      message: 'Internal server error',
      statusCode: 500,
    });
  });
});
