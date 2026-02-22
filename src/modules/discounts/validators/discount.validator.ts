import { Request, Response, NextFunction } from 'express';
import { body, validationResult } from 'express-validator';
import { ResponseHandler } from '../../../utils/response/responseHandler';

export const validateCreateDiscount = [
  body('name').trim().notEmpty().withMessage('Name is required'),
  body('type')
    .trim()
    .notEmpty()
    .isIn(['percent', 'fixed'])
    .withMessage('Type must be percent or fixed'),
  body('discount').trim().isDecimal().withMessage('Discount must be a number'),
  body('maxUsage').trim().isDecimal().withMessage('Max usage must be a number'),
  body('allMenu').isBoolean().withMessage('All menu must be a boolean'),
  body('expiredAt').trim().isISO8601().withMessage('Expired at is required'),
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

export const validateUpdateDiscount = [
  body('name').optional().trim().notEmpty().withMessage('Name cannot be empty'),
  body('type')
    .optional()
    .trim()
    .isIn(['percent', 'fixed'])
    .withMessage('Type must be percent or fixed'),
  body('discount').optional().trim().isDecimal().withMessage('Discount must be a number'),
  body('maxUsage').optional().trim().isDecimal().withMessage('Max usage must be a number'),
  body('allMenu').isBoolean().withMessage('All menu must be a boolean'),
  body('expiredAt').optional().trim().isISO8601().withMessage('Expired at must be a valid date'),
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
