export interface Ingredient {
  id: string;
  outletId: string;
  menuId: string;
  stockId: string;
  value: number;
  uom: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateIngredientDTO {
  outletId: string;
  menuId: string;
  stockId: string;
  value: number;
  uom: string;
}

export interface UpdateIngredientDTO {
  stockId: string;
  value: number;
  uom: string;
}
