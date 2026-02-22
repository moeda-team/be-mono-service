import { Request, Response, NextFunction } from 'express';
import { body, validationResult } from 'express-validator';
import { ResponseHandler } from '../../../utils/response/responseHandler';

export const validateCreateTransaction = [
  body('outletId').trim().notEmpty().withMessage('Outlet ID is required'),
  body('transactionType')
    .trim()
    .notEmpty()
    .withMessage('Transaction type is required')
    .isIn(['dine-in', 'take-away', 'delivery']),
  body('tableNumber')
    .if((value, { req }) => req.body.transactionType === 'dine-in')
    .notEmpty()
    .withMessage('Table number is required for dine-in')
    .isNumeric()
    .withMessage('Table number must be numeric'),
  body('paymentMethod')
    .isIn(['cash', 'qris'])
    .trim()
    .notEmpty()
    .withMessage('Payment method is required'),
  body('customerName').trim().notEmpty().withMessage('Customer name is required'),
  body('totalSubTransaction')
    .optional()
    .isNumeric()
    .withMessage('Total transaction must be a number'),
  body('additionalNote').optional(),
  body('cart').isArray({ min: 1 }).withMessage('Cart must be a non-empty array'),
  body('cart.*.menuId')
    .notEmpty()
    .withMessage('menuId is required')
    .isString()
    .withMessage('menuId must be a string'),
  body('cart.*.menuName')
    .notEmpty()
    .withMessage('menuName is required')
    .isString()
    .withMessage('menuName must be a string'),
  body('cart.*.quantity')
    .notEmpty()
    .withMessage('quantity is required')
    .isInt({ gt: 0 })
    .withMessage('quantity must be a positive integer'),
  body('cart.*.price')
    .notEmpty()
    .withMessage('price is required')
    .isFloat({ gt: 0 })
    .withMessage('price must be a positive number'),
  body('cart.*.subTotal')
    .notEmpty()
    .withMessage('subTotal is required')
    .isFloat({ gt: 0 })
    .withMessage('subTotal must be a positive number'),
  body('cart.*.addOn').optional(),
  body('cart.*.note').optional(),
  body('voucher').optional(),
  body('discount').default(0).isFloat({ min: 0 }).withMessage('Discount must be a number'),
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

export const validateUpdateTransactionStatus = [
  body('status')
    .trim()
    .notEmpty()
    .withMessage('Status is required')
    .isIn(['preparation', 'ready', 'served', 'completed']),
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

export const validateUpdateTransactionTable = [
  body('tableNumber')
    .trim()
    .notEmpty()
    .withMessage('Table number is required for dine-in')
    .isNumeric()
    .withMessage('Table number must be numeric'),
  body('note').optional(),
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

export const validateCheckTransactionStatus = [
  body('orderIds.*').trim().notEmpty().withMessage('Order id is required'),
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
