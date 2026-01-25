export type Unit = "g" | "kg" | "ml" | "l" | "pcs";

export interface Ingredient {
  id: string;
  name: string;
  quantity: number;
  unit: Unit;
}

export interface Recipe {
  steps: string[];
  prepTime?: number;
  cookTime?: number;
}

export interface Meal {
  id: string;
  name: string;
  defaultServings: number;
  ingredients: Ingredient[];
  recipe?: Recipe;
  tags?: string[];
  imageUrl?: string;
}

export interface CalendarMeal {
  mealId: string;
  date: string; // "YYYY-MM-DD"
  servingsOverride?: number;
}

export interface ShoppingListItem {
  ingredientName: string;
  totalQuantity: number;
  unit: Unit;
  mealNames: string[];
}
