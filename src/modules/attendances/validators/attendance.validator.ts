import { Request, Response, NextFunction } from 'express';
import { body, param, validationResult } from 'express-validator';
import { ResponseHandler } from '../../../utils/response/responseHandler';

export const validateCreateAttendanceManual = [
  body('status')
    .optional()
    .default('pending')
    .trim()
    .isIn(['pending', 'approved', 'rejected'])
    .withMessage('Status must be pending, approved, or rejected'),
  body('userId')
    .notEmpty()
    .withMessage('User ID is required')
    .isUUID()
    .withMessage('User ID must be a valid UUID'),
  body('note')
    .optional()
    .trim()
    .isLength({ max: 500 })
    .withMessage('Note must not exceed 500 characters'),
  body('fileUrl').optional().isString().withMessage('File must be a string'),
  (req: Request, res: Response, next: NextFunction) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      const allErrors = [...errors.array()];
      return ResponseHandler.error(res, {
        message: 'Validation failed',
        statusCode: 400,
        error: {
          code: 'VALIDATION_FAILED',
          details: allErrors,
        },
      });
    }

    next();
  },
];

export const validateCreateAttendance = [
  body('status')
    .optional()
    .default('pending')
    .trim()
    .isIn(['pending', 'approved', 'rejected'])
    .withMessage('Status must be pending, approved, or rejected'),
  body('note')
    .optional()
    .trim()
    .isLength({ max: 500 })
    .withMessage('Note must not exceed 500 characters'),
  body('fileUrl').optional().isString().withMessage('File must be a string'),
  (req: Request, res: Response, next: NextFunction) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      const allErrors = [...errors.array()];
      return ResponseHandler.error(res, {
        message: 'Validation failed',
        statusCode: 400,
        error: {
          code: 'VALIDATION_FAILED',
          details: allErrors,
        },
      });
    }

    next();
  },
];

export const validateGetAttendances = [
  (req: Request, res: Response, next: NextFunction) => {
    const { status, page, limit } = req.query;

    const errorMessages = [];

    if (status && !['pending', 'approved', 'rejected'].includes(status as string)) {
      errorMessages.push({
        type: 'query',
        value: status,
        msg: 'Status must be pending, approved, or rejected',
        path: 'status',
        location: 'query',
      });
    }

    if (page && (isNaN(Number(page)) || Number(page) < 1)) {
      errorMessages.push({
        type: 'query',
        value: page,
        msg: 'Page must be a positive number',
        path: 'page',
        location: 'query',
      });
    }

    if (limit && (isNaN(Number(limit)) || Number(limit) < 1 || Number(limit) > 100)) {
      errorMessages.push({
        type: 'query',
        value: limit,
        msg: 'Limit must be a positive number between 1 and 100',
        path: 'limit',
        location: 'query',
      });
    }

    if (errorMessages.length > 0) {
      return ResponseHandler.error(res, {
        message: 'Validation failed',
        statusCode: 400,
        error: {
          code: 'VALIDATION_FAILED',
          details: errorMessages,
        },
      });
    }

    next();
  },
];
