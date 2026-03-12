<script setup lang="ts">
import { computed } from "vue";

const props = defineProps<{
  date: Date;
}>();

const dayLabel = computed(() =>
  props.date.toLocaleDateString("en-US", { weekday: "short" }).slice(0, 2)
);

const dayNumber = computed(() =>
  String(props.date.getDate()).padStart(2, "0")
);
</script>

<template>
  <div class="flex flex-col items-center w-9 rounded-lg py-1 bg-surface-100 dark:bg-surface-800">
    <span class="text-xs font-medium text-surface-500 dark:text-surface-400 uppercase leading-none">{{ dayLabel }}</span>
    <span class="text-base font-bold text-surface-800 dark:text-surface-100 leading-tight">{{ dayNumber }}</span>
  </div>
</template>
