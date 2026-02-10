<script setup lang="ts">
import type { Meal } from "@/types";
import { useWeekStore } from "@/stores/week";
import WeekView from "./WeekView.vue";

const emit = defineEmits<{
  editMeal: [meal: Meal];
}>();

const weekStore = useWeekStore();
</script>

<template>
  <div class="flex flex-col h-full">
    <div class="flex justify-between items-center mb-4 shrink-0">
      <WeekNavigator />
      <div class="text-right">
        <p class="text-sm font-semibold">
          This Week: {{ weekStore.currentWeekRange }}
        </p>
        <p class="text-xs">Next Week: {{ weekStore.nextWeekRange }}</p>
      </div>
    </div>

    <div class="flex-1 overflow-y-auto flex flex-col gap-8 pl-4">
      <WeekView
        title="This week"
        :week-start="weekStore.weekStart"
        @edit-meal="emit('editMeal', $event)"
      />

      <WeekView
        title="Next week"
        :week-start="weekStore.nextWeekStart"
        @edit-meal="emit('editMeal', $event)"
      />
    </div>
  </div>
</template>
