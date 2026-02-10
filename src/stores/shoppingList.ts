import { defineStore } from "pinia";
import { computed, ref } from "vue";
import type { ShoppingListItem } from "@/types";
import { smartRound } from "@/utils/roundingHelpers";
import { useMealsQuery } from "@/api/meals";
import { useCalendarQuery } from "@/api/calendar";
import {
  normalizeIngredientName,
  toBaseUnit,
  toDisplayUnit,
} from "@/utils/ingredientNormalizer";
import { groupByCategory } from "@/utils/ingredientCategorizer";

export const useShoppingListStore = defineStore("shoppingList", () => {
  // Use reactive queries instead of reading from cache
  const { data: mealsData } = useMealsQuery();
  const { data: calendarData } = useCalendarQuery();

  const dateRangeFilter = ref<{ start: string; end: string } | null>(null);

  const allItems = computed<ShoppingListItem[]>(() => {
    const aggregationMap = new Map<string, ShoppingListItem>();

    // Use reactive query data
    const meals = mealsData.value || [];
    const calendarMeals = calendarData.value || [];

    // Iterate all calendar meals
    for (const calendarMeal of calendarMeals) {
      // Apply date range filter if set
      if (dateRangeFilter.value) {
        if (
          calendarMeal.date < dateRangeFilter.value.start ||
          calendarMeal.date > dateRangeFilter.value.end
        ) {
          continue;
        }
      }

      const meal = meals.find((m) => m.id === calendarMeal.mealId);
      if (!meal) continue;

      // Calculate servings multiplier
      const actualServings =
        calendarMeal.servingsOverride ?? meal.defaultServings;
      const multiplier = actualServings / meal.defaultServings;

      // Aggregate ingredients with unit-group normalization
      for (const ingredient of meal.ingredients) {
        const cleanedName = normalizeIngredientName(ingredient.name);
        const baseName = cleanedName.replace(/\s*\(.*\)\s*$/, "").trim();
        if (["water"].includes(baseName)) continue;
        const scaledQuantity = ingredient.quantity * multiplier;
        const { quantity: baseQuantity, group } = toBaseUnit(
          scaledQuantity,
          ingredient.unit,
        );
        const key = `${cleanedName}-${group}`;

        if (aggregationMap.has(key)) {
          const existing = aggregationMap.get(key)!;
          existing.totalQuantity += baseQuantity;
          if (!existing.mealNames.includes(meal.name)) {
            existing.mealNames.push(meal.name);
          }
        } else {
          // Capitalize first letter for display
          const displayName =
            cleanedName.charAt(0).toUpperCase() + cleanedName.slice(1);
          aggregationMap.set(key, {
            ingredientName: displayName,
            totalQuantity: baseQuantity,
            unit: "g", // placeholder, replaced by toDisplayUnit below
            mealNames: [meal.name],
          });
        }
      }
    }

    // Convert base units to display units, then apply smart rounding
    return Array.from(aggregationMap.entries())
      .map(([key, item]) => {
        const group = key.split("-").pop() as "mass" | "volume" | "count";
        const { quantity, unit } = toDisplayUnit(item.totalQuantity, group);
        return {
          ...item,
          totalQuantity: smartRound(quantity, unit),
          unit,
        };
      })
      .sort((a, b) => a.ingredientName.localeCompare(b.ingredientName));
  });

  const categorizedItems = computed(() => groupByCategory(allItems.value));

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
    allItems,
    categorizedItems,
    dateRangeFilter: computed(() => dateRangeFilter.value),
    setDateRangeFilter,
    clearFilter,
  };
});
