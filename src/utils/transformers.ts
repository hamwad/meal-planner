import type { Meal, CalendarMeal } from '@/types';

/**
 * Database types matching Supabase schema
 */
export interface SupabaseMeal {
  family_id: string;
  meal_id: string;
  name: string;
  default_servings: number;
  ingredients: any;
  recipe: any;
  tags: string[] | null;
  image_url: string | null;
  updated_at: string;
}

export interface SupabaseCalendarMeal {
  family_id: string;
  meal_id: string;
  date: string;
  servings_override: number | null;
  updated_at: string;
}

/**
 * Transform Supabase meal data to app Meal type
 */
export function transformToMeal(sm: SupabaseMeal): Meal {
  return {
    id: sm.meal_id,
    name: sm.name,
    defaultServings: sm.default_servings,
    ingredients: sm.ingredients,
    recipe: sm.recipe,
    tags: sm.tags || undefined,
    imageUrl: sm.image_url || undefined,
    familyId: sm.family_id,
    updatedAt: sm.updated_at,
  };
}

/**
 * Transform app Meal type to Supabase format
 */
export function transformMealToSupabase(meal: Meal, familyId: string): SupabaseMeal {
  return {
    family_id: familyId,
    meal_id: meal.id,
    name: meal.name,
    default_servings: meal.defaultServings,
    ingredients: meal.ingredients,
    recipe: meal.recipe || null,
    tags: meal.tags || null,
    image_url: meal.imageUrl || null,
    updated_at: new Date().toISOString(),
  };
}

/**
 * Transform Supabase calendar meal data to app CalendarMeal type
 */
export function transformToCalendarMeal(sc: SupabaseCalendarMeal): CalendarMeal {
  return {
    mealId: sc.meal_id,
    date: sc.date,
    servingsOverride: sc.servings_override || undefined,
    familyId: sc.family_id,
    updatedAt: sc.updated_at,
  };
}

/**
 * Transform app CalendarMeal type to Supabase format
 */
export function transformCalendarMealToSupabase(
  calendarMeal: CalendarMeal,
  familyId: string
): SupabaseCalendarMeal {
  return {
    family_id: familyId,
    meal_id: calendarMeal.mealId,
    date: calendarMeal.date,
    servings_override: calendarMeal.servingsOverride || null,
    updated_at: new Date().toISOString(),
  };
}
