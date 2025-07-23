import { Request, Response, NextFunction } from 'express';
import { body, validationResult } from 'express-validator';
import { ResponseHandler } from '../../../utils/response/responseHandler';

export const validateCreateIngredient = [
  body('menuId').trim().notEmpty().withMessage('Menu ID is required'),
  body('stockId').trim().notEmpty().withMessage('Stock ID is required'),
  body('value').trim().isDecimal().withMessage('Value must be a number'),
  body('uom').trim().notEmpty().withMessage('UOM is required'),
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

export const validateUpdateIngredient = [
  body('stockId').trim().notEmpty().withMessage('Stock ID is required'),
  body('value').trim().isDecimal().withMessage('Value must be a number'),
  body('uom').trim().notEmpty().withMessage('UOM is required'),
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
