<script setup lang="ts">
import type { Meal } from "@/types";
import { useCalendarQuery } from "@/api/calendar";
import { useCalendarMutations } from "@/api/calendar";
import { useDragAndDrop } from "@/composables/useDragAndDrop";
import emptyPlateImg from "@/assets/images/empty_plate.jpg";
import PlannedMealCard from "./PlannedMealCard.vue";
import MealCardBase from "@/components/MealCardBase.vue";
import CalendarDayBadge from "./CalendarDayBadge.vue";
import { formatDate } from "@/utils/dateHelpers";

const isMobile = useIsMobile();

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
    <div v-if="!isMobile" class="mb-1 text-gray-700">
      {{ formatDate(date) }}
    </div>

    <div class="flex-1">
      <PlannedMealCard
        v-for="(calendarMeal, index) in meals"
        :key="`${calendarMeal.mealId}-${index}`"
        :calendar-meal="calendarMeal"
        @edit="$emit('editMeal', $event)"
      />
      <template v-if="!meals.length">
        <!-- Mobile empty state -->
        <div
          v-if="isMobile"
          class="flex flex-row w-full h-18 overflow-hidden rounded-lg border border-gray-200 mb-1 bg-white"
        >
          <CalendarDayBadge :date="date" />
          <img
            :src="emptyPlateImg"
            alt=""
            class="h-full w-16 object-cover shrink-0 opacity-40"
          />
          <div class="flex flex-col justify-center px-3 py-2 flex-1">
            <p class="text-sm text-gray-400 italic">No meal planned</p>
            <Button
              link
              @click="
                $router.push({ path: '/meals', query: { date: dateISO } })
              "
              label="Select a meal"
              size="small"
              class="p-0! justify-start!"
            />
          </div>
        </div>
        <!-- Desktop empty state -->
        <MealCardBase v-else class="h-80">
          <div class="flex flex-col flex-1 justify-center items-center gap-4">
            <p class="text-center text-sm">
              Looks like you're going hungry tonight!
            </p>
            <Button
              link
              @click="
                $router.push({ path: '/meals', query: { date: dateISO } })
              "
              label="Select a meal"
              size="small"
              class="m-auto opacity-0 transition-opacity duration-200 group-hover:opacity-100"
            />
          </div>
        </MealCardBase>
      </template>
    </div>
  </div>
</template>
