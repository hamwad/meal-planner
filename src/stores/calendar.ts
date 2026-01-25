import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import type { CalendarMeal } from '@/types';
import { loadFromLocalStorage, saveToLocalStorage } from '@/composables/useLocalStorage';

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

  const addMealToDate = (mealId: string, date: string, servingsOverride?: number) => {
    calendarMeals.value.push({
      mealId,
      date,
      servingsOverride,
    });
    persist();
  };

  const removeMealFromDate = (mealId: string, date: string) => {
    const index = calendarMeals.value.findIndex(
      cm => cm.mealId === mealId && cm.date === date
    );
    if (index !== -1) {
      calendarMeals.value.splice(index, 1);
      persist();
    }
  };

  const updateServings = (mealId: string, date: string, servings: number) => {
    const calendarMeal = calendarMeals.value.find(
      cm => cm.mealId === mealId && cm.date === date
    );
    if (calendarMeal) {
      calendarMeal.servingsOverride = servings;
      persist();
    }
  };

  // Initialize on store creation
  initialize();

  return {
    calendarMeals: computed(() => calendarMeals.value),
    getMealsForDate,
    addMealToDate,
    removeMealFromDate,
    updateServings,
  };
});
