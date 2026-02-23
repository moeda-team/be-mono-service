import { Request, Response, NextFunction } from 'express';
import { body, validationResult } from 'express-validator';
import { ResponseHandler } from '../../../utils/response/responseHandler';

export const validateCreateTable = [
  body('outletId')
    .trim()
    .notEmpty()
    .withMessage('Outlet ID is required')
    .isUUID()
    .withMessage('Invalid outlet ID format'),
  body('name')
    .trim()
    .notEmpty()
    .withMessage('Table name is required')
    .isLength({ min: 1, max: 100 })
    .withMessage('Table name must be between 1 and 100 characters'),
  body('status')
    .optional()
    .trim()
    .notEmpty()
    .withMessage('Status cannot be empty')
    .isIn(['available', 'occupied', 'cleaning', 'out_of_order'])
    .withMessage('Status must be one of: available, occupied, cleaning, out_of_order'),
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

export const validateUpdateTable = [
  body('outletId')
    .optional()
    .trim()
    .notEmpty()
    .withMessage('Outlet ID cannot be empty')
    .isUUID()
    .withMessage('Invalid outlet ID format'),
  body('name')
    .optional()
    .trim()
    .notEmpty()
    .withMessage('Table name cannot be empty')
    .isLength({ min: 1, max: 100 })
    .withMessage('Table name must be between 1 and 100 characters'),
  body('status')
    .optional()
    .trim()
    .notEmpty()
    .withMessage('Status cannot be empty')
    .isIn(['available', 'occupied', 'cleaning', 'out_of_order'])
    .withMessage('Status must be one of: available, occupied, cleaning, out_of_order'),
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
