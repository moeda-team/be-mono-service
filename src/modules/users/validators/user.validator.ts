import { Request, Response, NextFunction } from 'express';
import { body, validationResult } from 'express-validator';
import { ResponseHandler } from '../../../utils/response/responseHandler';
import { UserRole } from '../../../utils/auth/jwt';

export const validateCreateUser = [
  body('outletId')
    .optional()
    .trim()
    .notEmpty()
    .withMessage('Outlet ID cannot be empty')
    .isUUID()
    .withMessage('Outlet ID must be a valid UUID'),
  body('name')
    .trim()
    .notEmpty()
    .withMessage('Name is required')
    .isLength({ min: 1, max: 100 })
    .withMessage('Name must be between 1 and 100 characters'),
  body('position')
    .trim()
    .notEmpty()
    .withMessage('Position is required')
    .isLength({ min: 1, max: 100 })
    .withMessage('Position must be between 1 and 100 characters'),
  body('role')
    .optional()
    .trim()
    .isIn([UserRole.OWNER, UserRole.STORE_MANAGER, UserRole.EMPLOYEE])
    .withMessage('Role must be one registered role'),
  body('email')
    .trim()
    .notEmpty()
    .withMessage('Email is required')
    .isEmail()
    .withMessage('Please provide a valid email address')
    .isLength({ max: 100 })
    .withMessage('Email must be at most 100 characters')
    .normalizeEmail(),
  body('password')
    .trim()
    .notEmpty()
    .withMessage('Password is required')
    .isLength({ min: 8, max: 255 })
    .withMessage('Password must be between 8 and 255 characters')
    .matches(/[a-z]/)
    .withMessage('Password must contain at least one lowercase letter')
    .matches(/[A-Z]/)
    .withMessage('Password must contain at least one uppercase letter')
    .matches(/\d/)
    .withMessage('Password must contain at least one number')
    .matches(/[@$!%*?&]/)
    .withMessage('Password must contain at least one special character (@$!%*?&)'),
  body('address')
    .trim()
    .notEmpty()
    .withMessage('Address is required')
    .isLength({ min: 1, max: 255 })
    .withMessage('Address must be between 1 and 255 characters'),
  body('gender')
    .trim()
    .notEmpty()
    .withMessage('Gender is required')
    .isIn(['male', 'female'])
    .withMessage('Gender must be male or female')
    .isLength({ max: 10 })
    .withMessage('Gender must be at most 10 characters'),
  body('phoneNumber')
    .trim()
    .notEmpty()
    .withMessage('Phone number is required')
    .isLength({ min: 1, max: 20 })
    .withMessage('Phone number must be between 1 and 20 characters')
    .matches(/^[+]?[\d\s\-\(\)]+$/)
    .withMessage('Phone number can only contain digits, spaces, and basic phone formatting'),
  body('fee')
    .optional()
    .isNumeric()
    .withMessage('Fee must be a number')
    .custom(value => value >= 0)
    .withMessage('Fee must be non-negative'),
  body('status')
    .optional()
    .isIn(['active', 'inactive'])
    .withMessage('Status must be active or inactive')
    .isLength({ max: 50 })
    .withMessage('Status must be at most 50 characters'),
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

export const validateUpdateUser = [
  body('outletId')
    .optional()
    .trim()
    .notEmpty()
    .withMessage('Outlet ID cannot be empty')
    .isUUID()
    .withMessage('Outlet ID must be a valid UUID'),
  body('name')
    .optional()
    .trim()
    .notEmpty()
    .withMessage('Name cannot be empty')
    .isLength({ min: 1, max: 100 })
    .withMessage('Name must be between 1 and 100 characters'),
  body('position')
    .optional()
    .trim()
    .notEmpty()
    .withMessage('Position cannot be empty')
    .isLength({ min: 1, max: 100 })
    .withMessage('Position must be between 1 and 100 characters'),
  body('role')
    .optional()
    .trim()
    .isIn([UserRole.OWNER, UserRole.STORE_MANAGER, UserRole.EMPLOYEE])
    .withMessage('Role must be one registered role'),
  body('email')
    .optional()
    .trim()
    .notEmpty()
    .withMessage('Email cannot be empty')
    .isEmail()
    .withMessage('Please provide a valid email address')
    .isLength({ max: 100 })
    .withMessage('Email must be at most 100 characters')
    .normalizeEmail(),
  body('password')
    .optional()
    .trim()
    .notEmpty()
    .withMessage('Password cannot be empty')
    .isLength({ min: 8, max: 255 })
    .withMessage('Password must be between 8 and 255 characters')
    .matches(/[a-z]/)
    .withMessage('Password must contain at least one lowercase letter')
    .matches(/[A-Z]/)
    .withMessage('Password must contain at least one uppercase letter')
    .matches(/\d/)
    .withMessage('Password must contain at least one number')
    .matches(/[@$!%*?&]/)
    .withMessage('Password must contain at least one special character (@$!%*?&)'),
  body('address')
    .optional()
    .trim()
    .notEmpty()
    .withMessage('Address cannot be empty')
    .isLength({ min: 1, max: 255 })
    .withMessage('Address must be between 1 and 255 characters'),
  body('gender')
    .optional()
    .trim()
    .notEmpty()
    .withMessage('Gender cannot be empty')
    .isIn(['male', 'female'])
    .withMessage('Gender must be male or female')
    .isLength({ max: 10 })
    .withMessage('Gender must be at most 10 characters'),
  body('phoneNumber')
    .optional()
    .trim()
    .notEmpty()
    .withMessage('Phone number cannot be empty')
    .isLength({ min: 1, max: 20 })
    .withMessage('Phone number must be between 1 and 20 characters')
    .matches(/^[+]?[\d\s\-\(\)]+$/)
    .withMessage('Phone number can only contain digits, spaces, and basic phone formatting'),
  body('fee')
    .optional()
    .isNumeric()
    .withMessage('Fee must be a number')
    .custom(value => value >= 0)
    .withMessage('Fee must be non-negative'),
  body('status')
    .optional()
    .isIn(['active', 'inactive'])
    .withMessage('Status must be active or inactive')
    .isLength({ max: 50 })
    .withMessage('Status must be at most 50 characters'),
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
