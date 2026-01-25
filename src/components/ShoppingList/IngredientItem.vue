<template>
  <div class="flex items-start gap-3 p-2 hover:bg-base-200 rounded">
    <input
      type="checkbox"
      class="checkbox checkbox-sm mt-1"
      v-model="checked"
    />
    <div class="flex-1 min-w-0">
      <div class="flex items-baseline gap-2">
        <span
          class="font-medium text-sm"
          :class="{ 'line-through text-base-content/50': checked }"
        >
          {{ item.ingredientName }}
        </span>
        <span
          class="text-sm text-base-content/70 whitespace-nowrap"
          :class="{ 'line-through': checked }"
        >
          {{ formattedQuantity }}
        </span>
      </div>
      <div class="text-xs text-base-content/60 mt-1">
        {{ mealNamesText }}
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue';
import type { ShoppingListItem } from '@/types';

const props = defineProps<{
  item: ShoppingListItem;
}>();

const checked = ref(false);

const formattedQuantity = computed(() => {
  // Remove decimal places for whole numbers
  const quantity = props.item.totalQuantity;
  const formatted = quantity % 1 === 0 ? quantity.toString() : quantity.toFixed(1);
  return `${formatted}${props.item.unit}`;
});

const mealNamesText = computed(() => {
  return props.item.mealNames.join(', ');
});
</script>
