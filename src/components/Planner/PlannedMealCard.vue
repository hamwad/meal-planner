<template>
  <div
    class="card bg-white shadow-sm border border-base-300 hover:border-primary hover:shadow-md transition-all cursor-pointer group overflow-hidden"
    @click="handleEdit"
  >
    <!-- Meal Image -->
    <div class="relative h-32 overflow-hidden">
      <img
        v-if="meal?.imageUrl"
        :src="meal.imageUrl"
        :alt="meal.name"
        class="w-full h-full object-cover"
      />
      <div
        v-else
        class="w-full h-full flex items-center justify-center text-4xl bg-gradient-to-br from-primary/20 to-secondary/20"
      >
        🍽️
      </div>
    </div>

    <div class="card-body p-3">
      <div class="flex justify-between items-start">
        <div class="flex-1">
          <h4 class="font-semibold text-sm group-hover:text-primary transition-colors">
            {{ meal?.name || 'Unknown Meal' }}
          </h4>
          <p class="text-xs text-base-content/70 mt-1">
            {{ servings }} servings
          </p>
        </div>
        <button
          class="btn btn-ghost btn-xs btn-circle hover:btn-error"
          @click.stop="handleRemove"
          title="Remove from calendar"
        >
          ✕
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import type { CalendarMeal, Meal } from '@/types';
import { useMealsStore } from '@/stores/meals';
import { useCalendarStore } from '@/stores/calendar';

const props = defineProps<{
  calendarMeal: CalendarMeal;
}>();

const emit = defineEmits<{
  edit: [meal: Meal];
}>();

const mealsStore = useMealsStore();
const calendarStore = useCalendarStore();

const meal = computed(() => mealsStore.getMealById(props.calendarMeal.mealId));

const servings = computed(() => {
  if (!meal.value) return 0;
  return props.calendarMeal.servingsOverride ?? meal.value.defaultServings;
});

const handleRemove = () => {
  calendarStore.removeMealFromDate(props.calendarMeal.mealId, props.calendarMeal.date);
};

const handleEdit = () => {
  if (meal.value) {
    emit('edit', meal.value);
  }
};
</script>
