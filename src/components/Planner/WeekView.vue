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
    <h3 class="text-lg font-semibold">{{ title }}</h3>
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
