<script setup lang="ts">
import { computed, ref } from "vue";
import type { CalendarMeal, Meal } from "@/types";
import { useMealsQuery } from "@/api/meals";
import { useCalendarMutations } from "@/api/calendar";
import { useDragAndDrop } from "@/composables/useDragAndDrop";
import MealCardBase from "@/components/MealCardBase.vue";
import MealCardCompact from "@/components/MealCardCompact.vue";
import RecipeDrawer from "./RecipeDrawer.vue";
import { breakpointsTailwind, useBreakpoints } from "@vueuse/core";

const { smaller } = useBreakpoints(breakpointsTailwind);
const isMobile = smaller("md");

const props = defineProps<{
  calendarMeal: CalendarMeal;
}>();

const emit = defineEmits<{
  edit: [meal: Meal];
}>();

const { data: meals } = useMealsQuery();
const { removeMealFromDate } = useCalendarMutations();
const { startDrag, endDrag } = useDragAndDrop();

const isDragging = ref(false);
const recipeDrawerVisible = ref(false);

const meal = computed(() => {
  if (!meals.value) return undefined;
  return meals.value.find((m) => m.id === props.calendarMeal.mealId);
});

const handleRemove = () => {
  removeMealFromDate.mutate({
    mealId: props.calendarMeal.mealId,
    date: props.calendarMeal.date,
  });
};

const handleEdit = () => {
  if (meal.value) {
    emit("edit", meal.value);
  }
};

const handleShowRecipe = () => {
  recipeDrawerVisible.value = true;
};

const handleDragStart = (event: DragEvent) => {
  isDragging.value = true;
  startDrag(props.calendarMeal.mealId, props.calendarMeal.date);
  if (event.dataTransfer) {
    event.dataTransfer.effectAllowed = "move";
  }
};

const handleDragEnd = () => {
  isDragging.value = false;
  endDrag();
};
</script>

<template>
  <template v-if="meal">
    <RecipeDrawer
      :visible="recipeDrawerVisible"
      :meal="meal"
      @edit="emit('edit', $event)"
    />
    <MealCardCompact
      v-if="isMobile"
      :meal="meal"
      :date="new Date(calendarMeal.date)"
      :servings-override="calendarMeal.servingsOverride"
      :draggable="true"
      :class="{ 'opacity-50 cursor-grabbing': isDragging }"
      @dragstart="handleDragStart"
      @dragend="handleDragEnd"
      @click="handleShowRecipe"
    >
      <template #header-actions>
        <i
          class="pi pi-times text-gray-300 cursor-pointer"
          @click.stop="handleRemove"
        />
      </template>
    </MealCardCompact>
    <MealCardBase
      v-else
      :meal="meal"
      :servings-override="calendarMeal.servingsOverride"
      :draggable="true"
      class="h-80"
      :class="{ 'opacity-50 cursor-grabbing': isDragging }"
      @dragstart="handleDragStart"
      @dragend="handleDragEnd"
      @click="handleEdit"
    >
      <template #header-actions>
        <i
          class="pi pi-times text-gray-300 cursor-pointer"
          @click.stop="handleRemove"
        />
      </template>
    </MealCardBase>
  </template>
</template>
