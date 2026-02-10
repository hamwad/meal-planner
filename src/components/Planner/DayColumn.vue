<script setup lang="ts">
import { ref, computed } from "vue";
import type { Meal } from "@/types";
import { useCalendarQuery } from "@/api/calendar";
import { useCalendarMutations } from "@/api/calendar";
import { useDragAndDrop } from "@/composables/useDragAndDrop";
import { formatDate } from "@/utils/dateHelpers";
import PlannedMealCard from "./PlannedMealCard.vue";
import MealCardBase from "@/components/MealCardBase.vue";

const props = defineProps<{
  date: Date;
  dateISO: string;
}>();

defineEmits<{
  editMeal: [meal: Meal];
}>();

const { data: calendarData } = useCalendarQuery();
const { addMealToDate, removeMealFromDate } = useCalendarMutations();
const { getDraggedMealId, getDraggedFromDate, endDrag } = useDragAndDrop();

const isDragOver = ref(false);

const formattedDate = computed(() => formatDate(props.date));

const meals = computed(() => {
  if (!calendarData.value) return [];
  return calendarData.value.filter((cm) => cm.date === props.dateISO);
});

const handleDragOver = (event: DragEvent) => {
  isDragOver.value = true;
  if (event.dataTransfer) {
    event.dataTransfer.dropEffect = "move";
  }
};

const handleDragLeave = () => {
  isDragOver.value = false;
};

const handleDrop = () => {
  isDragOver.value = false;
  const mealId = getDraggedMealId();
  const fromDate = getDraggedFromDate();

  if (mealId && fromDate && fromDate !== props.dateISO) {
    // Move meal: remove from old date, add to new date
    removeMealFromDate.mutate({ mealId, date: fromDate });
    addMealToDate.mutate({ mealId, date: props.dateISO });
  }
  endDrag();
};
</script>

<template>
  <div
    class="flex flex-col overflow-hidden transition-colors"
    :class="{
      'bg-gray-100': isDragOver,
      'border-base-300': !isDragOver,
    }"
    @dragover.prevent="handleDragOver"
    @dragleave="handleDragLeave"
    @drop.prevent="handleDrop"
  >
    <h3 class="font-semibold text-sm">{{ formattedDate }}</h3>

    <div class="flex-1">
      <PlannedMealCard
        v-for="(calendarMeal, index) in meals"
        :key="`${calendarMeal.mealId}-${index}`"
        :calendar-meal="calendarMeal"
        @edit="$emit('editMeal', $event)"
      />
      <MealCardBase v-if="!meals.length" class="h-80">
        <div class="flex flex-col flex-1 justify-center items-center gap-4">
          <p class="text-center text-sm">
            Looks like you're going hungry tonight!
          </p>
          <Button
            link
            @click="$router.push({ path: '/meals', query: { date: dateISO } })"
            label="Select a meal"
            size="small"
            class="m-auto opacity-0 transition-opacity duration-200 group-hover:opacity-100"
          />
        </div>
      </MealCardBase>
    </div>
  </div>
</template>
