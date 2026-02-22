import { Request, Response, NextFunction } from 'express';
import { body, validationResult } from 'express-validator';
import { ResponseHandler } from '../../../utils/response/responseHandler';

export const validateAddStock = [
  body('ingredientId')
    .trim()
    .notEmpty()
    .withMessage('Ingredient ID is required')
    .isUUID()
    .withMessage('Ingredient ID must be a valid UUID'),
  body('quantity')
    .notEmpty()
    .withMessage('Quantity is required')
    .isFloat({ gt: 0 })
    .withMessage('Quantity must be a positive number'),
  body('note')
    .optional()
    .trim()
    .isLength({ max: 255 })
    .withMessage('Note must not exceed 255 characters'),
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

export const validateReduceStock = [
  body('ingredientId')
    .trim()
    .notEmpty()
    .withMessage('Ingredient ID is required')
    .isUUID()
    .withMessage('Ingredient ID must be a valid UUID'),
  body('quantity')
    .notEmpty()
    .withMessage('Quantity is required')
    .isFloat({ gt: 0 })
    .withMessage('Quantity must be a positive number'),
  body('note')
    .optional()
    .trim()
    .isLength({ max: 255 })
    .withMessage('Note must not exceed 255 characters'),
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
