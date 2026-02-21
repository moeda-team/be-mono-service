import { Request, Response, NextFunction } from 'express';
import { body, validationResult } from 'express-validator';
import { ResponseHandler } from '../../../utils/response/responseHandler';

export const validateCreateOption = [
  body('name').trim().notEmpty().withMessage('Name is required'),
  body('values').isArray({ min: 1 }).withMessage('Values must be a non-empty array'),
  body('extraPrices').isArray().withMessage('Extra prices must be an array'),
  body('menuId').optional().isUUID().withMessage('Menu ID must be a valid UUID'),
  body('optionId').optional().isUUID().withMessage('Option ID must be a valid UUID'),
  body('order').optional().isInt({ min: 0 }).withMessage('Order must be a non-negative integer'),
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

export const validateUpdateOption = [
  body('name').optional().trim().notEmpty().withMessage('Name cannot be empty'),
  body('values').optional().isArray({ min: 1 }).withMessage('Values must be a non-empty array'),
  body('extraPrices').optional().isArray().withMessage('Extra prices must be an array'),
  body('menuId').optional().isUUID().withMessage('Menu ID must be a valid UUID'),
  body('optionId').optional().isUUID().withMessage('Option ID must be a valid UUID'),
  body('order').optional().isInt({ min: 0 }).withMessage('Order must be a non-negative integer'),
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
