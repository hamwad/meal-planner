<script setup lang="ts">
import { useCalendarMutations, useCalendarQuery } from "@/api/calendar";
import type { Meal } from "@/types";
import {
  addDays,
  formatDateISO,
  getWeekStart,
  formatDate,
} from "@/utils/dateHelpers";
import { useMealMutations } from "@/api/meals";
import MealCardBase from "@/components/MealCardBase.vue";

const props = defineProps<{
  meal: Meal;
  weekStart: Date;
}>();

const emit = defineEmits<{
  edit: [meal: Meal];
}>();

const { addMealToDate, removeMealFromDate } = useCalendarMutations();
const { deleteMeal } = useMealMutations();
const { data: calendarMeals } = useCalendarQuery();

const handleEdit = () => {
  emit("edit", props.meal);
};

const handleDelete = () => {
  deleteMeal.mutate(props.meal.id);
};

const weekLabel = computed(() => {
  const thisWeekISO = formatDateISO(getWeekStart());
  const nextWeekISO = formatDateISO(addDays(getWeekStart(), 7));
  const selectedISO = formatDateISO(props.weekStart);

  if (selectedISO === thisWeekISO) return "this week";
  if (selectedISO === nextWeekISO) return "next week";
  return `wk beginning ${formatDate(props.weekStart)}`;
});

const weekDays = computed(() => {
  return Array.from({ length: 7 }, (_, i) => {
    const date = addDays(props.weekStart, i);
    return {
      date,
      dateISO: formatDateISO(date),
    };
  });
});

const isMealScheduledForDay = (dateISO: string): boolean => {
  if (!calendarMeals.value) return false;
  return calendarMeals.value.some(
    (cm) => cm.mealId === props.meal.id && cm.date === dateISO,
  );
};

const toggleScheduleForDay = (dateISO: string) => {
  const isScheduled = isMealScheduledForDay(dateISO);
  if (isScheduled) {
    removeMealFromDate.mutate({ mealId: props.meal.id, date: dateISO });
  } else {
    addMealToDate.mutate({ mealId: props.meal.id, date: dateISO });
  }
};

const showDeleteDialog = ref(false);
</script>

<template>
  <MealCardBase :meal="meal" class="h-full" @click="handleEdit">
    <template #header-actions>
      <i
        class="pi pi-pencil text-gray-300 cursor-pointer mr-2"
        @click.stop="handleEdit"
      />
      <i
        class="pi pi-trash text-gray-300 cursor-pointer"
        @click="showDeleteDialog = true"
      />
    </template>
    <template #footer>
      <div class="flex flex-col">
        <span class="text-[0.75rem] mb-2 text-center text-gray-400"
          >Schedule for {{ weekLabel }}</span
        >
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
              isMealScheduledForDay(day.dateISO) ? 'primary' : 'secondary'
            "
            @click.stop="toggleScheduleForDay(day.dateISO)"
          />
        </div>
      </div>
    </template>
  </MealCardBase>

  <DeleteMealDialog
    :meal="meal"
    v-model:visible="showDeleteDialog"
    @confirm="handleDelete"
    @close="showDeleteDialog = false"
  />
</template>
