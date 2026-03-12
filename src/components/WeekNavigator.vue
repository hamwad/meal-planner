<script setup lang="ts">
import { useWeekStore } from "@/stores/week";

const props = defineProps<{
  disablePast?: boolean;
}>();

const weekStore = useWeekStore();

const prevDisabled = computed(
  () => props.disablePast && weekStore.isCurrentWeek,
);
</script>

<template>
  <div class="flex gap-1">
    <Button
      label="← Prev"
      text
      size="small"
      :disabled="prevDisabled"
      @click="weekStore.previousWeek"
    />
    <Button
      label="This week"
      text
      size="small"
      :disabled="weekStore.isCurrentWeek"
      @click="weekStore.goToCurrentWeek"
    />
    <Button
      label="Next →"
      text
      size="small"
      @click="weekStore.goToNextWeek"
    />
  </div>
</template>
