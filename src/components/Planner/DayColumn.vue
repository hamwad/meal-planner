<template>
  <div
    class="flex flex-col min-h-[200px] bg-base-100 rounded-lg border-2 transition-colors"
    :class="{
      'border-primary bg-primary/5': isDragOver,
      'border-base-300': !isDragOver,
    }"
    @dragover.prevent="handleDragOver"
    @dragleave="handleDragLeave"
    @drop.prevent="handleDrop"
  >
    <div class="p-3 border-b border-base-300">
      <h3 class="font-semibold text-sm">{{ formattedDate }}</h3>
      <p class="text-xs text-base-content/60">{{ dateISO }}</p>
    </div>

    <div class="flex-1 p-2 space-y-2">
      <PlannedMealCard
        v-for="(calendarMeal, index) in meals"
        :key="`${calendarMeal.mealId}-${index}`"
        :calendar-meal="calendarMeal"
        @edit="emit('editMeal', $event)"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue';
import type { Meal } from '@/types';
import { useCalendarStore } from '@/stores/calendar';
import { useDragAndDrop } from '@/composables/useDragAndDrop';
import { formatDate } from '@/utils/dateHelpers';
import PlannedMealCard from './PlannedMealCard.vue';

const props = defineProps<{
  date: Date;
  dateISO: string;
}>();

const emit = defineEmits<{
  editMeal: [meal: Meal];
}>();

const calendarStore = useCalendarStore();
const { getDraggedMealId, endDrag } = useDragAndDrop();

const isDragOver = ref(false);

const formattedDate = computed(() => formatDate(props.date));

const meals = computed(() => calendarStore.getMealsForDate(props.dateISO));

const handleDragOver = (event: DragEvent) => {
  isDragOver.value = true;
  if (event.dataTransfer) {
    event.dataTransfer.dropEffect = 'copy';
  }
};

const handleDragLeave = () => {
  isDragOver.value = false;
};

const handleDrop = () => {
  isDragOver.value = false;
  const mealId = getDraggedMealId();
  if (mealId) {
    calendarStore.addMealToDate(mealId, props.dateISO);
  }
  endDrag();
};
</script>
