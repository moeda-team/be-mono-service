import { Request, Response, NextFunction } from 'express';
import { body, validationResult } from 'express-validator';
import { ResponseHandler } from '../../../utils/response/responseHandler';

export const validateCreateMessage = [
  body('outletId').trim().notEmpty().withMessage('Outlet ID is required'),
  body('name').trim().notEmpty().withMessage('Name is required'),
  body('email').trim().optional().isEmail().withMessage('Please provide a valid email address'),
  body('message').trim().notEmpty().withMessage('Message is required'),
  body('rating').trim().isInt().withMessage('Rating must between 1 and 5'),
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
