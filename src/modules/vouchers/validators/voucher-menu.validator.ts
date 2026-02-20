import { Request, Response, NextFunction } from 'express';
import { body, validationResult } from 'express-validator';
import { ResponseHandler } from '../../../utils/response/responseHandler';

export const validateCreateVoucherMenu = [
  body('voucherId').trim().notEmpty().withMessage('Voucher ID is required'),
  body('menuId').isArray({ min: 1 }).withMessage('Menu ID array is required and must not be empty'),
  body('menuId.*').trim().notEmpty().withMessage('Each menu ID is required'),
  (req: Request, res: Response, next: NextFunction) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return ResponseHandler.error(res, {
        message: 'Validation failed',
        statusCode: 400,
        error: {
          code: 'VALIDATION_FAILED',
          details: errors.array(),
        },
      });
    }
    next();
  },
];

export const validateUpdateVoucherMenu = [
  body('voucherId').optional().trim().notEmpty().withMessage('Voucher ID is required'),
  body('menuId').optional().isArray({ min: 1 }).withMessage('Menu ID array must not be empty'),
  body('menuId.*').optional().trim().notEmpty().withMessage('Each menu ID is required'),
  (req: Request, res: Response, next: NextFunction) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return ResponseHandler.error(res, {
        message: 'Validation failed',
        statusCode: 400,
        error: {
          code: 'VALIDATION_FAILED',
          details: errors.array(),
        },
      });
    }
    next();
  },
];
