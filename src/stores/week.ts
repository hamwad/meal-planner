import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import { getWeekStart, addDays, formatDateISO, formatDate } from '@/utils/dateHelpers';

export const useWeekStore = defineStore('week', () => {
  const weekStart = ref(getWeekStart());

  // Current week computeds
  const currentWeekEnd = computed(() => formatDateISO(addDays(weekStart.value, 6)));
  const currentWeekRange = computed(() => {
    const start = formatDate(weekStart.value);
    const end = formatDate(addDays(weekStart.value, 6));
    return `${start} - ${end}`;
  });

  // Next week computeds
  const nextWeekStart = computed(() => addDays(weekStart.value, 7));
  const nextWeekEnd = computed(() => formatDateISO(addDays(weekStart.value, 13)));
  const nextWeekRange = computed(() => {
    const start = formatDate(nextWeekStart.value);
    const end = formatDate(addDays(nextWeekStart.value, 6));
    return `${start} - ${end}`;
  });

  // Current week check
  const isCurrentWeek = computed(() => formatDateISO(weekStart.value) === formatDateISO(getWeekStart()));

  // Navigation
  const previousWeek = () => {
    weekStart.value = addDays(weekStart.value, -7);
  };

  const goToNextWeek = () => {
    weekStart.value = addDays(weekStart.value, 7);
  };

  const goToCurrentWeek = () => {
    weekStart.value = getWeekStart();
  };

  const setWeekFromDate = (date: Date) => {
    weekStart.value = getWeekStart(date);
  };

  return {
    weekStart,
    isCurrentWeek,
    currentWeekEnd,
    currentWeekRange,
    nextWeekStart,
    nextWeekEnd,
    nextWeekRange,
    previousWeek,
    goToNextWeek,
    goToCurrentWeek,
    setWeekFromDate,
  };
});
