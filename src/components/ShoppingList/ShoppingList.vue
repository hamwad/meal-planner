<template>
  <div class="flex flex-col h-full bg-base-200">
    <div class="p-4 border-b border-base-300">
      <div class="flex justify-between items-center mb-3">
        <h2 class="text-xl font-bold">Shopping List</h2>
        <button
          class="btn btn-sm btn-primary"
          @click="copyToClipboard"
          :disabled="items.length === 0"
        >
          📋 Copy
        </button>
      </div>

      <!-- Week Filter -->
      <div class="flex gap-1 mb-2">
        <button
          class="btn btn-xs flex-1"
          :class="selectedWeek === 'this' ? 'btn-primary' : 'btn-ghost'"
          @click="changeFilter('this')"
        >
          This Week
        </button>
        <button
          class="btn btn-xs flex-1"
          :class="selectedWeek === 'next' ? 'btn-primary' : 'btn-ghost'"
          @click="changeFilter('next')"
        >
          Next Week
        </button>
        <button
          class="btn btn-xs flex-1"
          :class="selectedWeek === 'both' ? 'btn-primary' : 'btn-ghost'"
          @click="changeFilter('both')"
        >
          Both
        </button>
      </div>

      <p class="text-sm text-base-content/70">
        {{ items.length }} {{ items.length === 1 ? 'item' : 'items' }}
      </p>
    </div>

    <div class="flex-1 overflow-y-auto p-2">
      <div v-if="items.length === 0" class="text-center text-base-content/60 py-8">
        <p>No items in shopping list</p>
        <p class="text-sm mt-2">Add meals to your planner to generate a list</p>
      </div>

      <div v-else class="space-y-1">
        <IngredientItem
          v-for="(item, index) in items"
          :key="`${item.ingredientName}-${item.unit}-${index}`"
          :item="item"
        />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue';
import { useShoppingListStore } from '@/stores/shoppingList';
import { getWeekStart, addDays, formatDateISO } from '@/utils/dateHelpers';
import IngredientItem from './IngredientItem.vue';

const shoppingListStore = useShoppingListStore();

type WeekFilter = 'this' | 'next' | 'both';
const selectedWeek = ref<WeekFilter>('this');

const currentWeekStart = computed(() => getWeekStart());
const currentWeekEnd = computed(() => formatDateISO(addDays(currentWeekStart.value, 6)));
const nextWeekStart = computed(() => formatDateISO(addDays(currentWeekStart.value, 7)));
const nextWeekEnd = computed(() => formatDateISO(addDays(currentWeekStart.value, 13)));

// Apply filter when selection changes
const applyFilter = () => {
  if (selectedWeek.value === 'this') {
    shoppingListStore.setDateRangeFilter(
      formatDateISO(currentWeekStart.value),
      currentWeekEnd.value
    );
  } else if (selectedWeek.value === 'next') {
    shoppingListStore.setDateRangeFilter(nextWeekStart.value, nextWeekEnd.value);
  } else {
    shoppingListStore.clearFilter();
  }
};

// Apply initial filter
applyFilter();

// Watch for filter changes
const changeFilter = (filter: WeekFilter) => {
  selectedWeek.value = filter;
  applyFilter();
};

const items = computed(() => shoppingListStore.items);

const copyToClipboard = async () => {
  const text = items.value
    .map((item) => {
      const quantity = item.totalQuantity;
      const formatted = quantity % 1 === 0 ? quantity.toString() : quantity.toFixed(1);
      return `${item.ingredientName}: ${formatted}${item.unit} (${item.mealNames.join(', ')})`;
    })
    .join('\n');

  try {
    await navigator.clipboard.writeText(text);
    alert('Shopping list copied to clipboard!');
  } catch (error) {
    console.error('Failed to copy:', error);
    alert('Failed to copy to clipboard');
  }
};
</script>
