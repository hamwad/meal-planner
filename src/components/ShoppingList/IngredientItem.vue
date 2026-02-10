<script setup lang="ts">
import { ref, computed } from "vue";
import type { ShoppingListItem } from "@/types";
import { cleanIngredientName } from "@/utils/stringHelpers";

const props = defineProps<{
  item: ShoppingListItem;
}>();

const checked = ref(false);

const displayName = computed(() =>
  cleanIngredientName(props.item.ingredientName),
);

const formattedQuantity = computed(() => {
  // Remove decimal places for whole numbers
  const quantity = props.item.totalQuantity;
  const formatted =
    quantity % 1 === 0 ? quantity.toString() : quantity.toFixed(1);
  return `${formatted}${props.item.unit}`;
});
</script>

<template>
  <div class="flex items-center gap-2 py-1">
    <Checkbox v-model="checked" size="small" binary />
    <div class="flex gap-2 items-baseline">
      <span :class="['text-sm', { 'line-through text-gray-500': checked }]">
        {{ displayName }}
      </span>
      <span
        :class="[
          'text-xs text-gray-500 whitespace-nowrap',
          { 'line-through': checked },
        ]"
      >
        {{ formattedQuantity }}
      </span>
    </div>
  </div>
</template>
