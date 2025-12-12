/* eslint-disable @typescript-eslint/no-explicit-any */
import { validateCreateMessage } from './message.validator';
import { ResponseHandler } from '../../../utils/response/responseHandler';
import { Request, Response, NextFunction } from 'express';
import { validationResult } from 'express-validator';

// Mock express-validator validationResult
jest.mock('express-validator', () => {
  const original = jest.requireActual('express-validator');
  return {
    ...original,
    body: jest.fn(() => {
      const chain: any = {
        trim: () => chain,
        notEmpty: () => chain,
        withMessage: () => chain,
        isInt: () => chain,
      };
      return chain;
    }),
    validationResult: jest.fn(),
  };
});

describe('validateCreateMessage middleware', () => {
  let req: Partial<Request>;
  let res: Partial<Response>;
  let next: jest.MockedFunction<NextFunction>;

  beforeEach(() => {
    req = {
      body: {},
    } as Partial<Request>;

    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis(),
    } as unknown as Partial<Response>;

    next = jest.fn();

    jest.spyOn(ResponseHandler, 'error').mockImplementation(() => res as Response);
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('should call next() when validation passes', () => {
    req!.body = {
      outletId: '123',
      message: 'Great service',
      rating: '5',
    };

    (validationResult as unknown as jest.Mock).mockReturnValue({
      isEmpty: () => true,
      array: () => [],
    });

    const finalMiddleware = validateCreateMessage[3];
    finalMiddleware(req as Request, res as Response, next);

    expect(ResponseHandler.error).not.toHaveBeenCalled();
    expect(next).toHaveBeenCalled();
  });

  it('should return error response when validation fails', () => {
    req!.body = {
      // outletId missing
      message: 'Awesome',
      rating: 3,
    };

    (validationResult as unknown as jest.Mock).mockReturnValue({
      isEmpty: () => false,
      array: () => [{ msg: 'Outlet ID is required', param: 'outletId' }],
    });

    const finalMiddleware = validateCreateMessage[3];
    finalMiddleware(req as Request, res as Response, next);

    expect(ResponseHandler.error).toHaveBeenCalledWith(
      res,
      expect.objectContaining({
        message: 'Validation failed',
        statusCode: 400,
      }),
    );
    expect(next).not.toHaveBeenCalled();
  });
});
