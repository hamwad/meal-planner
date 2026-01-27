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
  familyId?: string;
  updatedAt?: string;
}

export interface CalendarMeal {
  mealId: string;
  date: string; // "YYYY-MM-DD"
  servingsOverride?: number;
  familyId?: string;
  updatedAt?: string;
}

export interface ShoppingListItem {
  ingredientName: string;
  totalQuantity: number;
  unit: Unit;
  mealNames: string[];
}

export interface Family {
  id: string;
  code: string;
  created_at: string;
}

export interface FamilyMember {
  family_id: string;
  user_id: string;
  joined_at: string;
}

export type SyncStatus = 'synced' | 'syncing' | 'offline' | 'error';

export interface SyncState {
  status: SyncStatus;
  lastSyncedAt?: Date;
  error?: string;
}
