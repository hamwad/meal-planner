<script setup lang="ts">
import { useWeekStore } from "@/stores/week";

const weekStore = useWeekStore();
</script>

<template>
  <div class="flex gap-1">
    <Button
      label="← Prev"
      text
      size="small"
      @click="weekStore.previousWeek"
    />
    <Button
      label="This week"
      text
      size="small"
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
