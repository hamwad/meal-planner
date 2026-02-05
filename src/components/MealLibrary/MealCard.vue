<script setup lang="ts">
import { useCalendarMutations, useCalendarQuery } from "@/api/calendar";
import type { Meal } from "@/types";
import {
  addDays,
  formatDate,
  formatDateISO,
  getWeekStart,
} from "@/utils/dateHelpers";
import emptyPlateImg from "@/assets/images/empty_plate.jpg";

defineProps<{ meals: Meal[] }>();

const emit = defineEmits<{
  edit: [meal: Meal];
}>();

const currentWeekStart = ref(getWeekStart());

// Mutations
const { addMealToDate, removeMealFromDate } = useCalendarMutations();

// Queries
const { data: calendarMeals } = useCalendarQuery();

const handleEditMeal = (meal: Meal) => {
  emit("edit", meal);
};

const weekDays = computed(() => {
  return Array.from({ length: 7 }, (_, i) => {
    const date = addDays(currentWeekStart.value, i);
    return {
      date,
      dateISO: formatDateISO(date),
      label: formatDate(date),
    };
  });
});

const isMealScheduledForDay = (mealId: string, dateISO: string): boolean => {
  if (!calendarMeals.value) return false;
  return calendarMeals.value.some(
    (cm) => cm.mealId === mealId && cm.date === dateISO,
  );
};

const toggleScheduleForDay = (meal: Meal, dateISO: string) => {
  const isScheduled = isMealScheduledForDay(meal.id, dateISO);
  if (isScheduled) {
    removeMealFromDate.mutate({ mealId: meal.id, date: dateISO });
  } else {
    addMealToDate.mutate({ mealId: meal.id, date: dateISO });
  }
};
</script>

<template>
  <Card
    v-for="meal in meals"
    :key="meal.id"
    class="overflow-hidden group min-h-96 mb-4 flex flex-col"
  >
    <template #header>
      <div class="relative">
        <img
          :src="meal.imageUrl ? meal.imageUrl : emptyPlateImg"
          :alt="meal.name"
          class="w-full h-32 object-cover"
        />

        <div
          class="absolute right-1 bottom-1 opacity-0 transition-opacity duration-200 group-hover:opacity-100"
        >
          <Button
            icon="pi pi-pencil"
            text
            rounded
            size="small"
            severity="secondary"
            class="bg-white/60 backdrop-blur hover:bg-white"
            @click="handleEditMeal(meal)"
          />
        </div>
      </div>
    </template>

    <template #title>
      <p class="truncate font-semibold text-sm">
        {{ meal.name }}
      </p>
    </template>

    <template #content>
      <div class="flex flex-col">
        <div class="flex flex-col flex-1 mb-4">
          <div class="text-sm text-surface-600 mb-3">
            <p>{{ meal.defaultServings }} servings</p>
            <p>{{ meal.ingredients.length }} ingredients</p>
          </div>

          <div
            v-if="meal.tags && meal.tags.length"
            class="flex flex-wrap gap-1 mb-3"
          >
            <Chip
              v-for="tag in meal.tags"
              :key="tag"
              :label="tag"
              class="text-xs"
            />
          </div>
        </div>

        <div class="mt-auto">
          <Divider align="center" type="solid" class="mb-2!">
            <span class="text-xs">Schedule for</span>
          </Divider>

          <div class="flex flex-wrap gap-2 justify-center">
            <Button
              v-for="day in weekDays"
              :key="day.dateISO"
              :pt="{ root: '!p-1', label: 'text-xs' }"
              :label="
                day.date.toLocaleDateString('en-US', {
                  weekday: 'narrow',
                })
              "
              :severity="
                isMealScheduledForDay(meal.id, day.dateISO)
                  ? 'primary'
                  : 'secondary'
              "
              @click="toggleScheduleForDay(meal, day.dateISO)"
            />
          </div>
        </div>
      </div>
    </template>
  </Card>
</template>
