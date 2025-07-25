/* eslint-disable @typescript-eslint/no-explicit-any */
import {
  validateCreateOutlet,
  validateUpdateOutlet,
} from '../../../../modules/outlets/validators/outlet.validator';
import { ResponseHandler } from '../../../../utils/response/responseHandler';

describe('Outlet Validators', () => {
  let mockReq: any;
  let mockRes: any;
  let next: jest.Mock;

  beforeEach(() => {
    mockReq = { body: {}, method: 'POST' };
    mockRes = { status: jest.fn().mockReturnThis(), json: jest.fn().mockReturnThis() };
    next = jest.fn();
    jest.clearAllMocks();
  });

  describe('validateCreateOutlet', () => {
    const run = async (body: any) => {
      mockReq.body = body;
      // Run validation chains (all but last middleware)
      for (const mw of validateCreateOutlet.slice(0, -1)) {
        if (typeof (mw as any).run === 'function') {
          await (mw as any).run(mockReq);
        }
      }
      // Call the error-handling middleware
      await validateCreateOutlet[validateCreateOutlet.length - 1](mockReq, mockRes, next);
    };

    it('calls next when valid', async () => {
      await run({ name: 'A', outletType: 'type', status: 'active' });
      expect(next).toHaveBeenCalled();
    });

    it('fails if name is missing', async () => {
      await run({ outletType: 'type' });
      expect(ResponseHandler.error).toHaveBeenCalledWith(
        mockRes,
        expect.objectContaining({
          message: 'Validation failed',
          statusCode: 400,
        }),
      );
      expect(next).not.toHaveBeenCalled();
    });

    it('fails if outletType is missing', async () => {
      await run({ name: 'A' });
      expect(ResponseHandler.error).toHaveBeenCalled();
      expect(next).not.toHaveBeenCalled();
    });

    it('fails if status is invalid', async () => {
      await run({ name: 'A', outletType: 'type', status: 'bad' });
      expect(ResponseHandler.error).toHaveBeenCalled();
      expect(next).not.toHaveBeenCalled();
    });
  });

  describe('validateUpdateOutlet', () => {
    const run = async (body: any) => {
      mockReq.body = body;
      for (const mw of validateUpdateOutlet.slice(0, -1)) {
        if (typeof (mw as any).run === 'function') {
          await (mw as any).run(mockReq);
        }
      }
      await validateUpdateOutlet[validateUpdateOutlet.length - 1](mockReq, mockRes, next);
    };

    it('calls next when valid', async () => {
      await run({ name: 'A', outletType: 'type', status: 'inactive' });
      expect(next).toHaveBeenCalled();
    });

    it('fails if name is missing', async () => {
      await run({ outletType: 'type' });
      expect(ResponseHandler.error).toHaveBeenCalled();
      expect(next).not.toHaveBeenCalled();
    });

    it('fails if outletType is missing', async () => {
      await run({ name: 'A' });
      expect(ResponseHandler.error).toHaveBeenCalled();
      expect(next).not.toHaveBeenCalled();
    });

    it('fails if status is invalid', async () => {
      await run({ name: 'A', outletType: 'type', status: 'bad' });
      expect(ResponseHandler.error).toHaveBeenCalled();
      expect(next).not.toHaveBeenCalled();
    });
  });
});

// Mock ResponseHandler.error globally
beforeAll(() => {
  jest.spyOn(ResponseHandler, 'error').mockImplementation(res => res);
});
