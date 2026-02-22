import { StockTransactionType, StockStatus } from '@prisma/client';

export interface AddStockRequest {
  ingredientId: string;
  quantity: number;
  note?: string;
}

export interface ReduceStockRequest {
  ingredientId: string;
  quantity: number;
  note?: string;
}

export interface IngredientResponse {
  id: string;
  name: string;
  unit: string;
  currentStock: number;
  status: StockStatus;
}

export interface ActivityItem {
  id: string;
  ingredientName: string;
  type: StockTransactionType;
  quantity: number;
  note?: string;
  createdAt: Date;
}

export interface ActivityResponse {
  [date: string]: ActivityItem[];
}

export interface CreateStockTransactionDTO {
  ingredientId: string;
  outletId: string;
  type: StockTransactionType;
  quantity: number;
  note?: string;
  createdBy?: string;
}

export interface Ingredient {
  id: string;
  outletId: string;
  name: string;
  unit: string;
  currentStock: number;
  minimumStock: number;
  status: StockStatus;
  createdAt: Date;
  updatedAt: Date;
}
