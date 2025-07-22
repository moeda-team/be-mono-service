import { Request, Response, NextFunction } from 'express';
import { body, validationResult } from 'express-validator';
import { ResponseHandler } from '../../../utils/response/responseHandler';

export const validateCreateLogStock = [
  body('outletId').trim().notEmpty().withMessage('Outlet ID is required'),
  body('stockId').trim().notEmpty().withMessage('Stock ID is required'),
  body('qty').trim().isNumeric().withMessage('Qty must be a number'),
  body('type')
    .trim()
    .isIn(['inbound', 'outbound'])
    .withMessage('Type must be one of: inbound, outbound'),
  body('uom').trim().notEmpty().withMessage('UOM is required'),
  body('menuId').trim().optional(),
  body('note').trim().optional(),
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

export const validateUpdateLogStock = [
  body('qty').trim().isNumeric().withMessage('Qty must be a number'),
  body('type')
    .trim()
    .isIn(['inbound', 'outbound'])
    .withMessage('Type must be one of: inbound, outbound'),
  body('uom').trim().notEmpty().withMessage('UOM is required'),
  body('menuId').trim().optional(),
  body('note').trim().optional(),
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
