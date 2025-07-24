import { Request, Response, NextFunction } from 'express';
import { body, validationResult } from 'express-validator';
import { ResponseHandler } from '../../../utils/response/responseHandler';

export const validateCreateAttendance = [
  body('userId').trim().notEmpty().withMessage('User ID is required'),
  body('photoUrl').trim().notEmpty().withMessage('Photo URL is required'),
  body('type')
    .trim()
    .optional()
    .isIn(['check-in', 'check-out'])
    .default('check-in')
    .withMessage('Type must be check-in or check-out'),
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

export const validateApprovedAttendance = [
  body('id').trim().notEmpty().withMessage('Attendance ID is required'),
  body('status').trim().isIn(['approved', 'rejected']).notEmpty().withMessage('Status is required'),
  body('approvedNote').trim().optional(),
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
