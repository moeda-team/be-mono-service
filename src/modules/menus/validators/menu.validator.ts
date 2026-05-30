import { Request, Response, NextFunction } from 'express';
import { body, validationResult } from 'express-validator';
import { ResponseHandler } from '../../../utils/response/responseHandler';

export const validateCreateMenu = [
  body('name').trim().notEmpty().withMessage('Name is required'),
  body('desc').trim().notEmpty().withMessage('Description is required'),
  body('img')
    .trim()
    .notEmpty()
    .withMessage('Image URL is required')
    .isURL()
    .withMessage('Invalid image URL'),
  body('price')
    .isNumeric()
    .notEmpty()
    .withMessage('Price is required')
    .withMessage('Price must be a number')
    .custom(value => value >= 0)
    .withMessage('Price must be non-negative'),
  body('options').optional().isArray().withMessage('Options must be an array'),
  body('pdf').optional().isURL().withMessage('Invalid PDF URL'),
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

export const validateUpdateMenu = [
  body('name').trim().notEmpty().withMessage('Name is required'),
  body('desc').trim().notEmpty().withMessage('Description is required'),
  body('img')
    .trim()
    .notEmpty()
    .withMessage('Image URL is required')
    .isURL()
    .withMessage('Invalid image URL'),
  body('price')
    .isNumeric()
    .notEmpty()
    .withMessage('Price is required')
    .withMessage('Price must be a number')
    .custom(value => value >= 0)
    .withMessage('Price must be non-negative'),
  body('pdf').optional().isURL().withMessage('Invalid PDF URL'),
  body('isActive').optional().isBoolean().withMessage('isActive must be a boolean').default(true),
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

export const validateUpdateMenuStatus = [
  body('isActive')
    .notEmpty()
    .withMessage('isActive is required')
    .isBoolean()
    .withMessage('isActive must be a boolean'),
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
