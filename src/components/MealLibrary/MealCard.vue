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
import emptyPlateImg from "@/assets/images/empty_plate.jpg";
import { breakpointsTailwind, useBreakpoints } from "@vueuse/core";

const { smaller } = useBreakpoints(breakpointsTailwind);
const isMobile = smaller("md");

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
  <!-- Mobile layout -->
  <div
    v-if="isMobile"
    class="flex flex-col w-full rounded-lg border border-gray-200 bg-white mb-2 overflow-hidden"
  >
    <div class="flex flex-row h-fit">
      <img
        :src="meal.imageUrl || emptyPlateImg"
        :alt="meal.name"
        class="h-full w-16 object-cover shrink-0"
      />
      <div
        class="flex flex-col justify-center px-3 py-2 overflow-hidden flex-1"
      >
        <p class="text-sm font-medium line-clamp-2 leading-tight">
          {{ meal.name }}
        </p>
        <p class="text-xs text-gray-500 mt-1">
          {{ meal.defaultServings }} servings · {{ meal.ingredients.length }}
          ingredients
        </p>
      </div>
      <div class="flex items-center gap-3 pr-3 shrink-0">
        <i
          class="pi pi-pencil text-gray-400 cursor-pointer"
          @click.stop="handleEdit"
        />
        <i
          class="pi pi-trash text-gray-400 cursor-pointer"
          @click.stop="showDeleteDialog = true"
        />
      </div>
    </div>
    <div class="flex flex-col px-3 py-2 border-t border-gray-100">
      <span class="text-[0.7rem] text-gray-400 mb-1.5"
        >Schedule for {{ weekLabel }}</span
      >
      <div class="flex gap-1.5">
        <Button
          v-for="day in weekDays"
          :key="day.dateISO"
          :pt="{ root: '!p-0 flex-1 min-w-0', label: 'text-[0.7rem]' }"
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
  </div>

  <!-- Desktop layout -->
  <MealCardBase v-else :meal="meal" class="h-full min-w-36" @click="handleEdit">
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
            :pt="{ root: '!p-1 w-6', label: 'text-xs' }"
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
