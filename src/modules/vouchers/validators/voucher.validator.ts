import { Request, Response, NextFunction } from 'express';
import { body, validationResult } from 'express-validator';
import { ResponseHandler } from '../../../utils/response/responseHandler';

export const validateCreateVoucher = [
  body('name').trim().notEmpty().withMessage('Name is required'),
  body('type')
    .trim()
    .notEmpty()
    .isIn(['percent', 'fixed'])
    .withMessage('Type must be percent or fixed'),
  body('discount').trim().isInt().withMessage('Discount must be a number'),
  body('maxAmount').trim().isInt().withMessage('Max amount must be a number'),
  body('expiredAt').trim().isDate().withMessage('Expired at is required'),
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

export const validateUpdateVoucher = [
  body('name').trim().notEmpty().withMessage('Name is required'),
  body('type')
    .trim()
    .notEmpty()
    .isIn(['percent', 'fixed'])
    .withMessage('Type must be percent or fixed'),
  body('discount').trim().isInt().withMessage('Discount must be a number'),
  body('maxAmount').trim().isInt().withMessage('Max amount must be a number'),
  body('expiredAt').trim().isDate().withMessage('Expired at is required'),
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
