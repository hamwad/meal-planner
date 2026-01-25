import { defineStore } from 'pinia';
import { computed, ref } from 'vue';
import type { ShoppingListItem, Unit } from '@/types';
import { useMealsStore } from './meals';
import { useCalendarStore } from './calendar';
import { smartRound } from '@/utils/roundingHelpers';

export const useShoppingListStore = defineStore('shoppingList', () => {
  const mealsStore = useMealsStore();
  const calendarStore = useCalendarStore();

  const dateRangeFilter = ref<{ start: string; end: string } | null>(null);

  const items = computed<ShoppingListItem[]>(() => {
    const aggregationMap = new Map<string, ShoppingListItem>();

    // Iterate all calendar meals
    for (const calendarMeal of calendarStore.calendarMeals) {
      // Apply date range filter if set
      if (dateRangeFilter.value) {
        if (
          calendarMeal.date < dateRangeFilter.value.start ||
          calendarMeal.date > dateRangeFilter.value.end
        ) {
          continue;
        }
      }

      const meal = mealsStore.getMealById(calendarMeal.mealId);
      if (!meal) continue;

      // Calculate servings multiplier
      const actualServings = calendarMeal.servingsOverride ?? meal.defaultServings;
      const multiplier = actualServings / meal.defaultServings;

      // Aggregate ingredients
      for (const ingredient of meal.ingredients) {
        // Normalize the key to lowercase for case-insensitive aggregation
        const normalizedName = ingredient.name.toLowerCase().trim();
        const key = `${normalizedName}-${ingredient.unit}`;
        const scaledQuantity = ingredient.quantity * multiplier;

        if (aggregationMap.has(key)) {
          const existing = aggregationMap.get(key)!;
          existing.totalQuantity += scaledQuantity;
          if (!existing.mealNames.includes(meal.name)) {
            existing.mealNames.push(meal.name);
          }
        } else {
          // Capitalize first letter for display
          const displayName = ingredient.name.trim().charAt(0).toUpperCase() +
                             ingredient.name.trim().slice(1).toLowerCase();
          aggregationMap.set(key, {
            ingredientName: displayName,
            totalQuantity: scaledQuantity,
            unit: ingredient.unit,
            mealNames: [meal.name],
          });
        }
      }
    }

    // Convert Map to sorted array and apply smart rounding
    return Array.from(aggregationMap.values())
      .map((item) => ({
        ...item,
        totalQuantity: smartRound(item.totalQuantity, item.unit),
      }))
      .sort((a, b) => a.ingredientName.localeCompare(b.ingredientName));
  });

  const setDateRangeFilter = (start: string | null, end: string | null) => {
    if (start && end) {
      dateRangeFilter.value = { start, end };
    } else {
      dateRangeFilter.value = null;
    }
  };

  const clearFilter = () => {
    dateRangeFilter.value = null;
  };

  return {
    items,
    dateRangeFilter: computed(() => dateRangeFilter.value),
    setDateRangeFilter,
    clearFilter,
  };
});
