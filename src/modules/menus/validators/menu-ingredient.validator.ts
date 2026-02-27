import { Request, Response, NextFunction } from 'express';
import { body, validationResult } from 'express-validator';
import { ResponseHandler } from '../../../utils/response/responseHandler';

export const validateUpsertMenuIngredient = [
  body('menuId')
    .notEmpty()
    .withMessage('Menu ID is required')
    .isUUID()
    .withMessage('Menu ID must be a valid UUID'),

  // Accept either single ingredient object or array of ingredients
  body().custom((value, { req }) => {
    const ingredients = req.body.ingredients || [req.body];

    if (!Array.isArray(ingredients) && !req.body.ingredientId) {
      throw new Error(
        'Either ingredientId (for single) or ingredients array (for bulk) is required',
      );
    }

    if (Array.isArray(ingredients)) {
      // Bulk validation
      if (ingredients.length === 0) {
        throw new Error('Ingredients array cannot be empty');
      }

      for (let i = 0; i < ingredients.length; i++) {
        const ing = ingredients[i];
        if (!ing.ingredientId || !ing.quantity) {
          throw new Error(`Ingredient at index ${i} is missing required fields`);
        }
        if (
          typeof ing.ingredientId !== 'string' ||
          !ing.ingredientId.match(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/)
        ) {
          throw new Error(`Ingredient ID at index ${i} must be a valid UUID`);
        }
        if (typeof ing.quantity !== 'number' || ing.quantity <= 0) {
          throw new Error(`Quantity at index ${i} must be a positive number`);
        }
        // Unit is now optional - will be fetched from ingredient data
      }
    } else {
      // Single ingredient validation
      if (!req.body.ingredientId || !req.body.quantity) {
        throw new Error('ingredientId and quantity are required for single ingredient');
      }
      if (
        typeof req.body.ingredientId !== 'string' ||
        !req.body.ingredientId.match(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i)
      ) {
        throw new Error('Ingredient ID must be a valid UUID');
      }
      if (typeof req.body.quantity !== 'number' || req.body.quantity <= 0) {
        throw new Error('Quantity must be a positive number');
      }
      // Unit is now optional - will be fetched from ingredient data
    }

    return true;
  }),

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
