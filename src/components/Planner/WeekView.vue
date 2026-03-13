<script setup lang="ts">
import { computed } from "vue";
import type { Meal } from "@/types";
import { addDays, formatDateISO } from "@/utils/dateHelpers";
import DayColumn from "./DayColumn.vue";

const props = defineProps<{
  title: string;
  weekStart: Date;
}>();

const emit = defineEmits<{
  editMeal: [meal: Meal];
}>();

const weekDays = computed(() => {
  return Array.from({ length: 7 }, (_, i) => {
    const date = addDays(props.weekStart, i);
    return {
      date,
      dateISO: formatDateISO(date),
    };
  });
});
</script>

<template>
  <div>
    <h4 class="text-md text-gray-700 font-semibold">{{ title }}</h4>
    <div class="grid md:grid-cols-7 gap-2">
      <DayColumn
        v-for="day in weekDays"
        :key="day.dateISO"
        :date="day.date"
        :date-i-s-o="day.dateISO"
        @edit-meal="emit('editMeal', $event)"
      />
    </div>
  </div>
</template>
