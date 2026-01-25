<template>
  <div class="flex flex-col h-full bg-base-100">
    <div class="p-4 border-b border-base-300">
      <div class="flex justify-between items-center mb-3">
        <h2 class="text-xl font-bold">Weekly Planner</h2>
        <button class="btn btn-primary" @click="emit('openLibrary')">
          📚 Meal Library
        </button>
      </div>
      <div class="flex justify-between items-center">
        <div class="text-sm text-base-content/70">
          <p class="font-semibold">This Week: {{ currentWeekRange }}</p>
          <p class="text-xs">Next Week: {{ nextWeekRange }}</p>
        </div>
        <div class="flex gap-2">
          <button class="btn btn-sm btn-outline" @click="previousWeek">
            ← Previous
          </button>
          <button class="btn btn-sm btn-outline" @click="nextWeek">
            Next →
          </button>
          <button class="btn btn-sm btn-ghost" @click="goToCurrentWeek">
            Today
          </button>
        </div>
      </div>
    </div>

    <div class="flex-1 overflow-y-auto">
      <div class="space-y-6">
        <!-- Current Week -->
        <div>
          <h3 class="text-lg font-semibold px-4 pt-4 pb-2">This Week</h3>
          <WeekView :week-start="weekStart" @edit-meal="emit('editMeal', $event)" />
        </div>

        <!-- Next Week -->
        <div>
          <h3 class="text-lg font-semibold px-4 pb-2">Next Week</h3>
          <WeekView :week-start="nextWeekStart" @edit-meal="emit('editMeal', $event)" />
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue';
import type { Meal } from '@/types';
import { getWeekStart, addDays, formatDate } from '@/utils/dateHelpers';
import WeekView from './WeekView.vue';

const emit = defineEmits<{
  editMeal: [meal: Meal];
  openLibrary: [];
}>();

const weekStart = ref(getWeekStart());

const currentWeekRange = computed(() => {
  const start = formatDate(weekStart.value);
  const end = formatDate(addDays(weekStart.value, 6));
  return `${start} - ${end}`;
});

const nextWeekStart = computed(() => addDays(weekStart.value, 7));

const nextWeekRange = computed(() => {
  const start = formatDate(nextWeekStart.value);
  const end = formatDate(addDays(nextWeekStart.value, 6));
  return `${start} - ${end}`;
});

const previousWeek = () => {
  weekStart.value = addDays(weekStart.value, -7);
};

const nextWeek = () => {
  weekStart.value = addDays(weekStart.value, 7);
};

const goToCurrentWeek = () => {
  weekStart.value = getWeekStart();
};
</script>
