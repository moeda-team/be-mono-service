import { Request, Response, NextFunction } from 'express';
import { body, validationResult } from 'express-validator';
import { ResponseHandler } from '../../../utils/response/responseHandler';
import { ActivityType } from '../models/activity';

export const validateCreateActivity = [
  body('inventoryId').trim().notEmpty().withMessage('Inventory ID is required'),
  body('type')
    .trim()
    .isIn(Object.values(ActivityType))
    .withMessage(`Type must be one of: ${Object.values(ActivityType).join(', ')}`),
  body('quantity')
    .isDecimal({ decimal_digits: '0,3' })
    .withMessage('Quantity must be a decimal number with up to 3 decimal places')
    .custom(value => {
      if (parseFloat(value) <= 0) {
        throw new Error('Quantity must be greater than 0');
      }
      return true;
    }),
  body('notes').default('-').optional().trim(),
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

export const validateUpdateActivity = [
  body('inventoryId').optional().trim().notEmpty().withMessage('Inventory ID cannot be empty'),
  body('type')
    .optional()
    .trim()
    .isIn(Object.values(ActivityType))
    .withMessage(`Type must be one of: ${Object.values(ActivityType).join(', ')}`),
  body('quantity')
    .optional()
    .isDecimal({ decimal_digits: '0,3' })
    .withMessage('Quantity must be a decimal number with up to 3 decimal places')
    .custom(value => {
      if (parseFloat(value) <= 0) {
        throw new Error('Quantity must be greater than 0');
      }
      return true;
    }),
  body('notes').default('-').optional().trim(),
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
