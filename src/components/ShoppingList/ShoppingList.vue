<script setup lang="ts">
import { computed, ref, reactive } from "vue";
import { useShoppingListStore } from "@/stores/shoppingList";
import { getWeekStart, addDays, formatDateISO } from "@/utils/dateHelpers";
import IngredientItem from "./IngredientItem.vue";
import { useClipboard } from "@vueuse/core";
import {
  CATEGORY_ORDER,
  CATEGORY_META,
  type IngredientCategory,
} from "@/utils/ingredientCategorizer";

const shoppingListVisible = ref(true);

const shoppingListStore = useShoppingListStore();

type WeekFilter = "this" | "next" | "both";
const selectedWeek = ref<WeekFilter>("this");

const currentWeekStart = computed(() => getWeekStart());
const currentWeekEnd = computed(() =>
  formatDateISO(addDays(currentWeekStart.value, 6)),
);
const nextWeekStart = computed(() =>
  formatDateISO(addDays(currentWeekStart.value, 7)),
);
const nextWeekEnd = computed(() =>
  formatDateISO(addDays(currentWeekStart.value, 13)),
);

const applyFilter = (week: WeekFilter) => {
  if (week === "this") {
    shoppingListStore.setDateRangeFilter(
      formatDateISO(currentWeekStart.value),
      currentWeekEnd.value,
    );
  } else if (week === "next") {
    shoppingListStore.setDateRangeFilter(
      nextWeekStart.value,
      nextWeekEnd.value,
    );
  } else {
    shoppingListStore.clearFilter();
  }
};

watch(
  selectedWeek,
  (newSelectedWeek) => {
    applyFilter(newSelectedWeek);
  },
  { immediate: true },
);

const allItems = computed(() => shoppingListStore.allItems);
const categorizedItems = computed(() => shoppingListStore.categorizedItems);

const collapsed = reactive<Record<IngredientCategory, boolean>>({
  meat: false,
  "fruit-veg": false,
  other: false,
  pantry: true,
});

const toggleCategory = (category: IngredientCategory) => {
  collapsed[category] = !collapsed[category];
};

const formatItem = (item: {
  ingredientName: string;
  totalQuantity: number;
  unit: string;
}) => {
  const quantity = item.totalQuantity;
  const formatted =
    quantity % 1 === 0 ? quantity.toString() : quantity.toFixed(1);
  return `${item.ingredientName}: ${formatted}${item.unit}`;
};

const formattedItemsToCopy = computed(() => {
  const sections: string[] = [];
  for (const category of CATEGORY_ORDER) {
    const items = categorizedItems.value[category];
    if (items.length === 0) continue;
    sections.push(`--- ${CATEGORY_META[category].label} ---`);
    sections.push(...items.map(formatItem));
    sections.push("");
  }
  return sections.join("\n").trimEnd();
});

const { copy, copied } = useClipboard({
  source: formattedItemsToCopy,
});

const options = ref([
  { name: "This week", value: "this" },
  { name: "Next week", value: "next" },
  { name: "Both", value: "both" },
]);
</script>

<template>
  <div
    class="flex flex-col h-full px-4 bg-gray-200 rounded-xl"
    v-if="shoppingListVisible"
  >
    <div class="flex justify-between items-end my-3">
      <div class="flex items-center gap-2">
        <h2 class="text-xl font-bold">Shopping List</h2>
      </div>
      <div class="flex">
        <Button
          v-if="!copied"
          icon="pi pi-copy"
          text
          size="small"
          @click="copy()"
          :disabled="allItems.length === 0"
        />
        <Button v-else-if="copied" icon="pi pi-check" text size="small" />
      </div>
    </div>

    <SelectButton
      v-model="selectedWeek"
      :options="options"
      optionLabel="name"
      optionValue="value"
      size="small"
      :allow-empty="false"
      class="mb-2"
    />

    <div class="flex items-center gap-2 text-sm">
      <p>
        {{ allItems.length }} {{ allItems.length === 1 ? "item" : "items" }}
      </p>
    </div>

    <div class="flex-1 overflow-y-auto p-2">
      <div v-if="allItems.length === 0" class="text-center py-8">
        <p>No items in shopping list</p>
        <p class="text-sm mt-2">Add meals to your planner to generate a list</p>
      </div>

      <div v-else>
        <template v-for="category in CATEGORY_ORDER" :key="category">
          <div v-if="categorizedItems[category].length > 0" class="mb-3">
            <button
              class="flex items-center gap-2 w-full text-left py-1 font-semibold text-sm text-gray-700 hover:text-gray-900"
              @click="toggleCategory(category)"
            >
              <i
                :class="[
                  'pi text-xs',
                  collapsed[category] ? 'pi-chevron-right' : 'pi-chevron-down',
                ]"
              />
              <span>{{ CATEGORY_META[category].label }}</span>
              <span class="text-xs font-normal text-gray-500">
                ({{ categorizedItems[category].length }})
              </span>
            </button>
            <div v-show="!collapsed[category]" class="pl-4">
              <IngredientItem
                v-for="(item, index) in categorizedItems[category]"
                :key="`${item.ingredientName}-${item.unit}-${index}`"
                :item="item"
              />
            </div>
          </div>
        </template>
      </div>
    </div>
  </div>
</template>
