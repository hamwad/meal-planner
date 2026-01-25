import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import type { Meal } from '@/types';
import { loadFromLocalStorage, saveToLocalStorage } from '@/composables/useLocalStorage';
import { sampleMeals } from '@/utils/sampleData';

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

  const addMeal = (meal: Meal) => {
    meals.value.push(meal);
    persist();
  };

  const updateMeal = (id: string, updatedMeal: Meal) => {
    const index = meals.value.findIndex(meal => meal.id === id);
    if (index !== -1) {
      meals.value[index] = updatedMeal;
      persist();
    }
  };

  const deleteMeal = (id: string) => {
    meals.value = meals.value.filter(meal => meal.id !== id);
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
  };
});
