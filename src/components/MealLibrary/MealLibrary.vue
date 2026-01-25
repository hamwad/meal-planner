<script setup lang="ts">
import { ref } from "vue";
import { useMealsStore } from "@/stores/meals";
import type { Meal } from "@/types";
import MealCard from "./MealCard.vue";
import MealForm from "./MealForm.vue";

const mealsStore = useMealsStore();
const mealFormRef = ref<InstanceType<typeof MealForm> | null>(null);

const handleEditMeal = (meal: Meal) => {
  mealFormRef.value?.openDialog(meal);
};

// Expose method so parent can trigger edit
defineExpose({
  editMeal: handleEditMeal,
});
</script>

<template>
  <div class="flex flex-col h-full bg-base-200">
    <div class="p-4 border-b border-base-300 space-y-3">
      <div>
        <h2 class="text-xl font-bold">Meal Library</h2>
        <p class="text-sm text-base-content/70 mt-1">
          Drag meals to add to your planner
        </p>
      </div>
      <MealForm ref="mealFormRef" />
    </div>

    <div class="flex-1 overflow-y-auto p-4 space-y-3">
      <MealCard
        v-for="meal in mealsStore.meals"
        :key="meal.id"
        :meal="meal"
        @edit="handleEditMeal"
      />
    </div>
  </div>
</template>
