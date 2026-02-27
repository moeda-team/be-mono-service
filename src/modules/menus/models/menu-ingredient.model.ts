export interface MenuIngredient {
  id: string;
  menuId: string;
  ingredientId: string;
  quantity: number;
  unit: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface UpsertMenuIngredientDTO {
  menuId: string;
  ingredientId: string;
  quantity: number;
  unit: string;
}

export interface MenuWithIngredients {
  id: string;
  name: string;
  ingredients: MenuIngredient[];
}
