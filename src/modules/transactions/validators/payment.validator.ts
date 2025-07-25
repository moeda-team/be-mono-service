import { Request, Response, NextFunction } from 'express';
import { body, validationResult } from 'express-validator';
import { ResponseHandler } from '../../../utils/response/responseHandler';

export const validatePayment = [
  body('paymentType').trim().notEmpty().withMessage('Payment type is required'),
  body('transactionDetails').isObject().withMessage('Transaction details is required'),
  body('transactionDetails.orderId').trim().notEmpty().withMessage('Order ID is required'),
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

export const validatePaymentNotification = [
  body('order_id').trim().notEmpty().withMessage('Order ID is required'),
  body('transaction_status').trim().notEmpty().withMessage('Transaction status is required'),
  body('fraud_status').trim().notEmpty().withMessage('Fraud status is required'),
  body('payment_type').trim().notEmpty().withMessage('Payment type is required'),
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
