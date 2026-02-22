import { Router } from 'express';
import { validateAddStock, validateReduceStock } from '../validators/inventory.validator';
import { InventoryController } from '../controllers/inventory.controller';
import { PrismaClient } from '@prisma/client';
import { InventoryService } from '../services/inventory.service';
import { basicAuth, jwtAuth, roleAuth } from '../../../middlewares';
import { UserRole } from '../../../utils/auth/jwt';

const router = Router();

// Initialize dependencies
const prisma = new PrismaClient();
const inventoryService = new InventoryService(prisma);
const inventoryController = new InventoryController(inventoryService);

/**
 * @route POST /inventory/add-stock
 * @desc Add stock to an ingredient
 * @access Private
 * @headers outlet-id (required), user-id (optional)
 * @body { ingredientId: string, quantity: number, note?: string }
 */
router.post(
  '/add-stock',
  jwtAuth,
  roleAuth(UserRole.EMPLOYEE),
  validateAddStock,
  inventoryController.addStock.bind(inventoryController),
);

/**
 * @route POST /inventory/reduce-stock
 * @desc Reduce stock from an ingredient
 * @access Private
 * @headers outlet-id (required), user-id (optional)
 * @body { ingredientId: string, quantity: number, note?: string }
 */
router.post(
  '/reduce-stock',
  jwtAuth,
  roleAuth(UserRole.EMPLOYEE),
  validateReduceStock,
  inventoryController.reduceStock.bind(inventoryController),
);

/**
 * @route GET /inventory/ingredients
 * @desc Get all ingredients for an outlet with current stock and status
 * @access Private
 * @headers outlet-id (required)
 * @response { success: boolean, data: IngredientResponse[] }
 */
router.get(
  '/ingredients',
  jwtAuth,
  roleAuth(UserRole.EMPLOYEE),
  inventoryController.getIngredients.bind(inventoryController),
);

/**
 * @route GET /inventory/activity
 * @desc Get stock activity history grouped by date
 * @access Private
 * @headers outlet-id (required)
 * @response { success: boolean, data: ActivityResponse }
 */
router.get(
  '/activity',
  jwtAuth,
  roleAuth(UserRole.EMPLOYEE),
  inventoryController.getActivity.bind(inventoryController),
);

export default router;
