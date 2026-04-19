import { Request, Response, NextFunction } from 'express';
import { body, validationResult } from 'express-validator';
import { ResponseHandler } from '../../../utils/response/responseHandler';

export const validateCreateFile = [
  body('category')
    .trim()
    .notEmpty()
    .isIn(['icon', 'menu', 'attendance', 'logo'])
    .withMessage('Category not allowed'),
  (req: Request, res: Response, next: NextFunction) => {
    const errors = validationResult(req);
    const errorMessages = [];

    if (!req.file) {
      errorMessages.push({
        type: 'field',
        value: '',
        msg: 'File is required',
        path: 'file',
        location: 'body',
      });
    } else {
      const allowedMimeTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
      if (!allowedMimeTypes.includes(req.file.mimetype)) {
        errorMessages.push({
          type: 'field',
          value: req.file.mimetype,
          msg: 'Only image files are allowed (JPEG, PNG, GIF, WebP)',
          path: 'file',
          location: 'body',
        });
      }
    }

    if (!errors.isEmpty() || errorMessages.length > 0) {
      const allErrors = [...errors.array(), ...errorMessages];
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
