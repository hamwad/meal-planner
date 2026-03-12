<script setup lang="ts">
import type { Meal } from "@/types";
import emptyPlateImg from "@/assets/images/empty_plate.jpg";

const props = defineProps<{
  meal: Meal;
  date: Date;
  draggable?: boolean;
  servingsOverride?: number;
}>();

defineEmits<{
  dragstart: [event: DragEvent];
  dragend: [event: DragEvent];
  click: [];
}>();

const servings = computed(() => {
  return props.servingsOverride ?? props.meal.defaultServings ?? 0;
});
</script>

<template>
  <div
    :draggable="draggable ? 'true' : undefined"
    class="flex flex-row w-full h-18 overflow-hidden rounded-lg border border-gray-200 hover:border-gray-400 mb-1 bg-white group cursor-pointer transition-colors"
    @dragstart="$emit('dragstart', $event)"
    @dragend="$emit('dragend', $event)"
    @click="$emit('click')"
  >
    <CalendarDayBadge :date="date" />

    <img
      :src="meal.imageUrl || emptyPlateImg"
      :alt="meal.name"
      class="h-full w-16 object-cover shrink-0"
    />
    <div class="flex flex-col justify-center px-3 py-2 overflow-hidden flex-1">
      <p class="text-sm font-medium line-clamp-2 leading-tight">
        {{ meal.name }}
      </p>
      <p class="text-xs text-gray-500 mt-1">
        {{ servings }} servings · {{ meal.ingredients.length }} ingredients
      </p>
    </div>
    <div
      v-if="$slots['header-actions']"
      class="flex items-center pr-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200"
      @click.stop
    >
      <slot name="header-actions" />
    </div>
  </div>
</template>
