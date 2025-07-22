import { Request, Response, NextFunction } from 'express';
import { body, validationResult } from 'express-validator';
import { ResponseHandler } from '../../../utils/response/responseHandler';

export const validateCreateStock = [
  body('name').trim().notEmpty().withMessage('Name is required'),
  body('qty').trim().isNumeric().withMessage('Qty must be a number'),
  body('uom').trim().notEmpty().withMessage('UOM is required'),
  body('minQty').trim().isNumeric().withMessage('Min qty must be a number'),
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

export const validateUpdateStock = [
  body('name').trim().notEmpty().withMessage('Name is required'),
  body('qty').trim().isNumeric().withMessage('Qty must be a number'),
  body('uom').trim().notEmpty().withMessage('UOM is required'),
  body('minQty').trim().isNumeric().withMessage('Min qty must be a number'),
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
