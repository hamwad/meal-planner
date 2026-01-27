import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import type { Meal } from '@/types';
import { loadFromLocalStorage, saveToLocalStorage } from '@/composables/useLocalStorage';
import { sampleMeals } from '@/utils/sampleData';
import { supabase, isSupabaseConfigured } from '@/services/supabase';
import { useAuthStore } from './auth';

const STORAGE_KEY = 'meal-planner-meals';

export const useMealsStore = defineStore('meals', () => {
  const meals = ref<Meal[]>([]);

  // Initialize with sample data if localStorage is empty
  const initialize = () => {
    const stored = loadFromLocalStorage<Meal[]>(STORAGE_KEY, []);
    if (stored.length === 0) {
      meals.value = sampleMeals;
      saveToLocalStorage(STORAGE_KEY, meals.value);
    } else {
      meals.value = stored;
    }
  };

  const persist = () => {
    saveToLocalStorage(STORAGE_KEY, meals.value);
  };

  const getMealById = (id: string) => {
    return meals.value.find(meal => meal.id === id);
  };

  const addMeal = async (meal: Meal) => {
    // Add to local state immediately (optimistic update)
    meals.value.push(meal);
    persist();

    // Sync to Supabase
    await syncMealToSupabase(meal);
  };

  const updateMeal = async (id: string, updatedMeal: Meal) => {
    const index = meals.value.findIndex(meal => meal.id === id);
    if (index !== -1) {
      // Update local state immediately (optimistic update)
      meals.value[index] = updatedMeal;
      persist();

      // Sync to Supabase
      await syncMealToSupabase(updatedMeal);
    }
  };

  const deleteMeal = async (id: string) => {
    // Remove from local state immediately (optimistic update)
    meals.value = meals.value.filter(meal => meal.id !== id);
    persist();

    // Sync deletion to Supabase
    await deleteMealFromSupabase(id);
  };

  /**
   * Sync a meal to Supabase (insert or update)
   */
  const syncMealToSupabase = async (meal: Meal) => {
    if (!isSupabaseConfigured()) return;

    const authStore = useAuthStore();
    if (!authStore.familyId) return;

    try {
      const mealData = {
        family_id: authStore.familyId,
        meal_id: meal.id,
        name: meal.name,
        default_servings: meal.defaultServings,
        ingredients: meal.ingredients,
        recipe: meal.recipe || null,
        tags: meal.tags || null,
        image_url: meal.imageUrl || null,
        updated_at: new Date().toISOString(),
      };

      // Try to update first, if it doesn't exist, insert
      const { error: updateError } = await supabase
        .from('meals')
        .update(mealData)
        .eq('family_id', authStore.familyId)
        .eq('meal_id', meal.id);

      // If no rows were updated, insert instead
      if (updateError) {
        const { error: insertError } = await supabase
          .from('meals')
          .insert(mealData);

        if (insertError) throw insertError;
      }
    } catch (error) {
      console.error('Error syncing meal to Supabase:', error);
    }
  };

  /**
   * Delete a meal from Supabase
   */
  const deleteMealFromSupabase = async (mealId: string) => {
    if (!isSupabaseConfigured()) return;

    const authStore = useAuthStore();
    if (!authStore.familyId) return;

    try {
      const { error } = await supabase
        .from('meals')
        .delete()
        .eq('family_id', authStore.familyId)
        .eq('meal_id', mealId);

      if (error) throw error;
    } catch (error) {
      console.error('Error deleting meal from Supabase:', error);
    }
  };

  /**
   * Merge meals from Supabase into local state
   */
  const mergeMealsFromSupabase = (supabaseMeals: any[]) => {
    supabaseMeals.forEach(sm => {
      const localMeal = meals.value.find(m => m.id === sm.meal_id);

      const supabaseMeal: Meal = {
        id: sm.meal_id,
        name: sm.name,
        defaultServings: sm.default_servings,
        ingredients: sm.ingredients,
        recipe: sm.recipe,
        tags: sm.tags,
        imageUrl: sm.image_url,
        familyId: sm.family_id,
        updatedAt: sm.updated_at,
      };

      if (!localMeal) {
        // Meal doesn't exist locally, add it
        meals.value.push(supabaseMeal);
      } else if (sm.updated_at && supabaseMeal.updatedAt) {
        // Meal exists, check if Supabase version is newer
        const localUpdatedAt = new Date(localMeal.updatedAt || 0);
        const supabaseUpdatedAt = new Date(sm.updated_at);

        if (supabaseUpdatedAt > localUpdatedAt) {
          // Supabase version is newer, update local
          const index = meals.value.findIndex(m => m.id === sm.meal_id);
          if (index !== -1) {
            meals.value[index] = supabaseMeal;
          }
        }
      }
    });

    // Remove meals that don't exist in Supabase
    const supabaseMealIds = new Set(supabaseMeals.map(sm => sm.meal_id));
    meals.value = meals.value.filter(meal => supabaseMealIds.has(meal.id));

    persist();
  };

  /**
   * Upload all local meals to Supabase (used during family creation)
   */
  const uploadAllMealsToSupabase = async () => {
    if (!isSupabaseConfigured()) return;

    const authStore = useAuthStore();
    if (!authStore.familyId) return;

    try {
      const mealsData = meals.value.map(meal => ({
        family_id: authStore.familyId,
        meal_id: meal.id,
        name: meal.name,
        default_servings: meal.defaultServings,
        ingredients: meal.ingredients,
        recipe: meal.recipe || null,
        tags: meal.tags || null,
        image_url: meal.imageUrl || null,
        updated_at: new Date().toISOString(),
      }));

      if (mealsData.length > 0) {
        const { error } = await supabase
          .from('meals')
          .insert(mealsData);

        if (error) throw error;
      }
    } catch (error) {
      console.error('Error uploading meals to Supabase:', error);
      throw error;
    }
  };

  /**
   * Clear all local meals (used when joining a family)
   */
  const clearMeals = () => {
    meals.value = [];
    persist();
  };

  // Initialize on store creation
  initialize();

  return {
    meals: computed(() => meals.value),
    getMealById,
    addMeal,
    updateMeal,
    deleteMeal,
    mergeMealsFromSupabase,
    uploadAllMealsToSupabase,
    clearMeals,
  };
});
