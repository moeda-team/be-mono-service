import { Request, Response, NextFunction } from 'express';
import { body, param, query, validationResult, ValidationChain } from 'express-validator';
import { AppError, ErrorCode } from '../errors/custom.errors';
import { ResponseHandler } from '../response/responseHandler';

export const handleValidationErrors = (req: Request, res: Response, next: NextFunction): void => {
  const errors = validationResult(req);

  if (!errors.isEmpty()) {
    const errorDetails = errors.array().map(error => ({
      field: error.type === 'field' ? (error as any).path : 'unknown',
      message: error.msg,
      value: error.type === 'field' ? (error as any).value : undefined,
    }));

    ResponseHandler.error(res, {
      message: 'Validation failed',
      statusCode: 400,
      error: {
        code: ErrorCode.VALIDATION_ERROR,
        details: errorDetails,
      },
    });
    return;
  }

  next();
};

export const validate = (validations: ValidationChain[]) => {
  return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    await Promise.all(validations.map(validation => validation.run(req)));

    const errors = validationResult(req);
    if (errors.isEmpty()) {
      return next();
    }

    const errorDetails = errors.array().map(error => ({
      field: error.type === 'field' ? (error as any).path : 'unknown',
      message: error.msg,
      value: error.type === 'field' ? (error as any).value : undefined,
    }));

    ResponseHandler.error(res, {
      message: 'Validation failed',
      statusCode: 400,
      error: {
        code: ErrorCode.VALIDATION_ERROR,
        details: errorDetails,
      },
    });
  };
};

// Common validation chains
export const commonValidations = {
  // UUID validation
  uuid: (field: string = 'id') =>
    param(field).isUUID(4).withMessage(`${field} must be a valid UUID`),

  // Pagination
  page: query('page').optional().isInt({ min: 1 }).withMessage('Page must be a positive integer'),
  limit: query('limit')
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage('Limit must be between 1 and 100'),

  // Search
  search: query('search')
    .optional()
    .isString()
    .isLength({ min: 1, max: 100 })
    .trim()
    .withMessage('Search term must be between 1 and 100 characters'),

  // Date filters
  month: query('month')
    .optional()
    .isInt({ min: 1, max: 12 })
    .withMessage('Month must be between 1 and 12'),
  year: query('year')
    .optional()
    .isInt({ min: 2020, max: 2030 })
    .withMessage('Year must be between 2020 and 2030'),

  // Boolean
  boolean: (field: string) =>
    query(field).optional().isBoolean().withMessage(`${field} must be a boolean`),

  // String fields
  string: (field: string, options: { min?: number; max?: number; required?: boolean } = {}) => {
    const validator = body(field).isString().trim();
    if (options.min) validator.isLength({ min: options.min });
    if (options.max) validator.isLength({ max: options.max });
    if (options.required) validator.notEmpty();
    return validator;
  },

  // Email
  email: (field: string = 'email') =>
    body(field).isEmail().normalizeEmail().withMessage(`${field} must be a valid email`),

  // Password
  password: (field: string = 'password') =>
    body(field).isLength({ min: 8 }).withMessage(`${field} must be at least 8 characters long`),

  // Numbers
  number: (field: string, options: { min?: number; max?: number; required?: boolean } = {}) => {
    const validator = body(field).isNumeric();
    if (options.min) validator.isFloat({ min: options.min });
    if (options.max) validator.isFloat({ max: options.max });
    if (options.required) validator.notEmpty();
    return validator;
  },

  // Arrays
  array: (field: string, options: { min?: number; max?: number; required?: boolean } = {}) => {
    const validator = body(field).isArray();
    if (options.min) validator.isArray({ min: options.min });
    if (options.max) validator.isArray({ max: options.max });
    if (options.required) validator.notEmpty();
    return validator;
  },

  // Enum validation
  enum: (field: string, values: string[]) =>
    body(field)
      .isIn(values)
      .withMessage(`${field} must be one of: ${values.join(', ')}`),
};
