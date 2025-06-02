import { Request, Response, NextFunction } from 'express';
import { body, validationResult } from 'express-validator';
import { ResponseHandler } from '../../../utils/response/responseHandler';

export const validateCreateOutlet = [
  body('name').trim().notEmpty().withMessage('Name is required'),
  body('outletType').trim().notEmpty().withMessage('Outlet type is required'),
  body('address').optional(),
  body('number').optional(),
  body('province').optional(),
  body('city').optional(),
  body('postalCode').optional(),
  body('status')
    .optional()
    .isIn(['active', 'inactive'])
    .withMessage('Status must be active or inactive'),
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

export const validateUpdateOutlet = [
  body('name').trim().notEmpty().withMessage('Name cannot be empty'),
  body('outletType').trim().notEmpty().withMessage('Outlet type cannot be empty'),
  body('address').optional(),
  body('number').optional(),
  body('province').optional(),
  body('city').optional(),
  body('postalCode').optional(),
  body('status')
    .optional()
    .trim()
    .notEmpty()
    .isIn(['active', 'inactive'])
    .withMessage('Status must be active or inactive'),
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
