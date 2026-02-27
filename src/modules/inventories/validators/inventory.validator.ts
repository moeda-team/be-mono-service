import { Request, Response, NextFunction } from 'express';
import { body, validationResult } from 'express-validator';
import { ResponseHandler } from '../../../utils/response/responseHandler';
import { StockStatus } from '../models/inventory';

export const validateCreateInventory = [
  body('outletId').trim().notEmpty().withMessage('Outlet ID is required'),
  body('name').trim().notEmpty().withMessage('Name is required'),
  body('unit').trim().notEmpty().withMessage('Unit is required'),
  body('currentStock')
    .isDecimal({ decimal_digits: '0,3' })
    .withMessage('Current stock must be a decimal number with up to 3 decimal places')
    .custom(value => {
      if (parseFloat(value) < 0) {
        throw new Error('Current stock cannot be negative');
      }
      return true;
    }),
  body('minimumStock')
    .isDecimal({ decimal_digits: '0,3' })
    .withMessage('Minimum stock must be a decimal number with up to 3 decimal places')
    .custom(value => {
      if (parseFloat(value) < 0) {
        throw new Error('Minimum stock cannot be negative');
      }
      return true;
    }),
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

export const validateUpdateInventory = [
  body('outletId').optional().trim().notEmpty().withMessage('Outlet ID cannot be empty'),
  body('name').optional().trim().notEmpty().withMessage('Name cannot be empty'),
  body('unit').optional().trim().notEmpty().withMessage('Unit cannot be empty'),
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
