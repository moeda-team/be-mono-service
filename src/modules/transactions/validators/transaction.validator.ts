import { Request, Response, NextFunction } from 'express';
import { body, validationResult } from 'express-validator';
import { ResponseHandler } from '../../../utils/response/responseHandler';
import prisma from '../../../config/database';

export const validateCreateTransaction = [
  body('outletId').trim().notEmpty().withMessage('Outlet ID is required'),
  body('transactionType')
    .trim()
    .notEmpty()
    .withMessage('Transaction type is required')
    .isIn(['dine-in', 'take-away', 'delivery']),
  body('tableId')
    .if((value, { req }) => req.body.transactionType === 'dine-in')
    .notEmpty()
    .withMessage('Table ID is required for dine-in')
    .isUUID()
    .withMessage('Table ID must be a valid UUID'),
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
  body('cart.*.addOn').optional().isString().withMessage('addOn must be a string'),
  body('cart.*.addOnPrice')
    .optional()
    .isFloat({ min: 0 })
    .withMessage('addOnPrice must be a non-negative number'),
  body('cart.*.note').optional(),
  body('cart.*.discount')
    .default(0)
    .isFloat({ min: 0 })
    .withMessage('Discount must be a non-negative number'),
  body('voucher').optional(),
  body('discount')
    .default(0)
    .isFloat({ min: 0 })
    .withMessage('Discount must be a non-negative number'),
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
  body('tableId')
    .trim()
    .notEmpty()
    .withMessage('Table ID is required for dine-in')
    .isUUID()
    .withMessage('Table ID must be a valid UUID'),
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

export const validateCalculation = [
  body('paymentMethod')
    .trim()
    .notEmpty()
    .withMessage('Payment method is required')
    .isIn(['cash', 'qris']),
  body('total')
    .notEmpty()
    .withMessage('Total is required')
    .isFloat({ gt: 0 })
    .withMessage('Total must be a positive number'),
  body('discount').optional().isFloat({ min: 0 }).withMessage('Discount must be a number'),
  body('discountMenu').optional().isFloat({ min: 0 }).withMessage('Discount menu must be a number'),
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

export const validateIngredientAvailability = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const { cart } = req.body;

    if (!cart || !Array.isArray(cart) || cart.length === 0) {
      return next();
    }

    // Get all menu IDs from cart
    const menuIds = cart.map((item: any) => item.menuId);

    // Get menu ingredients for all items in cart
    const menuIngredients = await prisma.menuIngredient.findMany({
      where: {
        menuId: {
          in: menuIds,
        },
      },
      include: {
        ingredient: true,
        menu: true,
      },
    });

    // Check ingredient availability
    const insufficientIngredients: Array<{
      ingredientName: string;
      menuName: string;
      required: number;
      available: number;
      unit: string;
    }> = [];

    for (const cartItem of cart) {
      const menuItemIngredients = menuIngredients.filter(mi => mi.menuId === cartItem.menuId);

      for (const menuIngredient of menuItemIngredients) {
        const requiredQuantity = Number(menuIngredient.quantity) * cartItem.quantity;
        const availableQuantity = Number(menuIngredient.ingredient.currentStock);

        if (availableQuantity < requiredQuantity) {
          insufficientIngredients.push({
            ingredientName: menuIngredient.ingredient.name,
            menuName: menuIngredient.menu.name,
            required: requiredQuantity,
            available: availableQuantity,
            unit: menuIngredient.ingredient.unit,
          });
        }
      }
    }

    if (insufficientIngredients.length > 0) {
      const errorMessage = insufficientIngredients
        .map(
          item =>
            `${item.ingredientName} for ${item.menuName}: need ${item.required} ${item.unit}, only ${item.available} ${item.unit} available`,
        )
        .join('; ');

      return ResponseHandler.error(res, {
        message: 'Insufficient ingredients for order',
        statusCode: 400,
        error: {
          code: 'INSUFFICIENT_INGREDIENTS',
          details: {
            message: errorMessage,
            insufficientIngredients,
          },
        },
      });
    }

    next();
  } catch (error) {
    return ResponseHandler.error(res, {
      message: 'Error validating ingredient availability',
      statusCode: 500,
    });
  }
};
