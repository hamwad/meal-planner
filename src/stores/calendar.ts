import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import type { CalendarMeal } from '@/types';
import { loadFromLocalStorage, saveToLocalStorage } from '@/composables/useLocalStorage';
import { supabase, isSupabaseConfigured } from '@/services/supabase';
import { useAuthStore } from './auth';

const STORAGE_KEY = 'meal-planner-calendar';

export const useCalendarStore = defineStore('calendar', () => {
  const calendarMeals = ref<CalendarMeal[]>([]);

  // Initialize from localStorage
  const initialize = () => {
    calendarMeals.value = loadFromLocalStorage<CalendarMeal[]>(STORAGE_KEY, []);
  };

  const persist = () => {
    saveToLocalStorage(STORAGE_KEY, calendarMeals.value);
  };

  const getMealsForDate = (date: string) => {
    return calendarMeals.value.filter(cm => cm.date === date);
  };

  const addMealToDate = async (mealId: string, date: string, servingsOverride?: number) => {
    // Add to local state immediately (optimistic update)
    const calendarMeal: CalendarMeal = {
      mealId,
      date,
      servingsOverride,
      updatedAt: new Date().toISOString(),
    };

    calendarMeals.value.push(calendarMeal);
    persist();

    // Sync to Supabase
    await syncCalendarMealToSupabase(calendarMeal);
  };

  const removeMealFromDate = async (mealId: string, date: string) => {
    const index = calendarMeals.value.findIndex(
      cm => cm.mealId === mealId && cm.date === date
    );
    if (index !== -1) {
      // Remove from local state immediately (optimistic update)
      calendarMeals.value.splice(index, 1);
      persist();

      // Sync deletion to Supabase
      await deleteCalendarMealFromSupabase(mealId, date);
    }
  };

  const updateServings = async (mealId: string, date: string, servings: number) => {
    const calendarMeal = calendarMeals.value.find(
      cm => cm.mealId === mealId && cm.date === date
    );
    if (calendarMeal) {
      // Update local state immediately (optimistic update)
      calendarMeal.servingsOverride = servings;
      calendarMeal.updatedAt = new Date().toISOString();
      persist();

      // Sync to Supabase
      await syncCalendarMealToSupabase(calendarMeal);
    }
  };

  /**
   * Sync a calendar meal to Supabase (insert or update)
   */
  const syncCalendarMealToSupabase = async (calendarMeal: CalendarMeal) => {
    if (!isSupabaseConfigured()) return;

    const authStore = useAuthStore();
    if (!authStore.familyId) return;

    try {
      const calendarData = {
        family_id: authStore.familyId,
        meal_id: calendarMeal.mealId,
        date: calendarMeal.date,
        servings_override: calendarMeal.servingsOverride || null,
        updated_at: new Date().toISOString(),
      };

      // Try to update first
      const { error: updateError } = await supabase
        .from('calendar_meals')
        .update(calendarData)
        .eq('family_id', authStore.familyId)
        .eq('meal_id', calendarMeal.mealId)
        .eq('date', calendarMeal.date);

      // If no rows were updated, insert instead
      if (updateError) {
        const { error: insertError } = await supabase
          .from('calendar_meals')
          .insert(calendarData);

        if (insertError) throw insertError;
      }
    } catch (error) {
      console.error('Error syncing calendar meal to Supabase:', error);
    }
  };

  /**
   * Delete a calendar meal from Supabase
   */
  const deleteCalendarMealFromSupabase = async (mealId: string, date: string) => {
    if (!isSupabaseConfigured()) return;

    const authStore = useAuthStore();
    if (!authStore.familyId) return;

    try {
      const { error } = await supabase
        .from('calendar_meals')
        .delete()
        .eq('family_id', authStore.familyId)
        .eq('meal_id', mealId)
        .eq('date', date);

      if (error) throw error;
    } catch (error) {
      console.error('Error deleting calendar meal from Supabase:', error);
    }
  };

  /**
   * Merge calendar from Supabase into local state
   */
  const mergeCalendarFromSupabase = (supabaseCalendar: any[]) => {
    supabaseCalendar.forEach(sc => {
      const localCalendarMeal = calendarMeals.value.find(
        cm => cm.mealId === sc.meal_id && cm.date === sc.date
      );

      const supabaseCalendarMeal: CalendarMeal = {
        mealId: sc.meal_id,
        date: sc.date,
        servingsOverride: sc.servings_override,
        familyId: sc.family_id,
        updatedAt: sc.updated_at,
      };

      if (!localCalendarMeal) {
        // Calendar meal doesn't exist locally, add it
        calendarMeals.value.push(supabaseCalendarMeal);
      } else if (sc.updated_at && supabaseCalendarMeal.updatedAt) {
        // Calendar meal exists, check if Supabase version is newer
        const localUpdatedAt = new Date(localCalendarMeal.updatedAt || 0);
        const supabaseUpdatedAt = new Date(sc.updated_at);

        if (supabaseUpdatedAt > localUpdatedAt) {
          // Supabase version is newer, update local
          const index = calendarMeals.value.findIndex(
            cm => cm.mealId === sc.meal_id && cm.date === sc.date
          );
          if (index !== -1) {
            calendarMeals.value[index] = supabaseCalendarMeal;
          }
        }
      }
    });

    // Remove calendar meals that don't exist in Supabase
    const supabaseKeys = new Set(
      supabaseCalendar.map(sc => `${sc.meal_id}-${sc.date}`)
    );
    calendarMeals.value = calendarMeals.value.filter(
      cm => supabaseKeys.has(`${cm.mealId}-${cm.date}`)
    );

    persist();
  };

  /**
   * Upload all local calendar meals to Supabase (used during family creation)
   */
  const uploadAllCalendarToSupabase = async () => {
    if (!isSupabaseConfigured()) return;

    const authStore = useAuthStore();
    if (!authStore.familyId) return;

    try {
      const calendarData = calendarMeals.value.map(cm => ({
        family_id: authStore.familyId,
        meal_id: cm.mealId,
        date: cm.date,
        servings_override: cm.servingsOverride || null,
        updated_at: new Date().toISOString(),
      }));

      if (calendarData.length > 0) {
        const { error } = await supabase
          .from('calendar_meals')
          .insert(calendarData);

        if (error) throw error;
      }
    } catch (error) {
      console.error('Error uploading calendar to Supabase:', error);
      throw error;
    }
  };

  /**
   * Clear all local calendar meals (used when joining a family)
   */
  const clearCalendar = () => {
    calendarMeals.value = [];
    persist();
  };

  // Initialize on store creation
  initialize();

  return {
    calendarMeals: computed(() => calendarMeals.value),
    getMealsForDate,
    addMealToDate,
    removeMealFromDate,
    updateServings,
    mergeCalendarFromSupabase,
    uploadAllCalendarToSupabase,
    clearCalendar,
  };
});
