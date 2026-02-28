import { Request, Response, NextFunction } from 'express';
import { body, validationResult } from 'express-validator';
import { ResponseHandler } from '../../../utils/response/responseHandler';

export const validateCreateOutlet = [
  body('name')
    .trim()
    .notEmpty()
    .withMessage('Name is required')
    .isLength({ min: 1, max: 100 })
    .withMessage('Name must be between 1 and 100 characters'),
  body('outletType')
    .trim()
    .notEmpty()
    .withMessage('Outlet type is required')
    .isLength({ min: 1, max: 50 })
    .withMessage('Outlet type must be between 1 and 50 characters'),
  body('address').optional().isString().withMessage('Address must be a string'),
  body('number')
    .optional()
    .isString()
    .isLength({ max: 20 })
    .withMessage('Number must be at most 20 characters'),
  body('province')
    .optional()
    .isString()
    .isLength({ max: 50 })
    .withMessage('Province must be at most 50 characters'),
  body('city')
    .optional()
    .isString()
    .isLength({ max: 50 })
    .withMessage('City must be at most 50 characters'),
  body('postalCode')
    .optional()
    .isString()
    .isLength({ max: 5 })
    .withMessage('Postal code must be at most 5 characters')
    .matches(/^\d*$/)
    .withMessage('Postal code must contain only digits'),
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
  body('name')
    .trim()
    .notEmpty()
    .withMessage('Name cannot be empty')
    .isLength({ min: 1, max: 100 })
    .withMessage('Name must be between 1 and 100 characters'),
  body('outletType')
    .trim()
    .notEmpty()
    .withMessage('Outlet type cannot be empty')
    .isLength({ min: 1, max: 50 })
    .withMessage('Outlet type must be between 1 and 50 characters'),
  body('address').optional().isString().withMessage('Address must be a string'),
  body('number')
    .optional()
    .isString()
    .isLength({ max: 20 })
    .withMessage('Number must be at most 20 characters'),
  body('province')
    .optional()
    .isString()
    .isLength({ max: 50 })
    .withMessage('Province must be at most 50 characters'),
  body('city')
    .optional()
    .isString()
    .isLength({ max: 50 })
    .withMessage('City must be at most 50 characters'),
  body('postalCode')
    .optional()
    .isString()
    .isLength({ max: 5 })
    .withMessage('Postal code must be at most 5 characters')
    .matches(/^\d*$/)
    .withMessage('Postal code must contain only digits'),
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
