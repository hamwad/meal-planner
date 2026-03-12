<script setup lang="ts">
import { useMealsQuery } from "@/api/meals";
import { useWeekStore } from "@/stores/week";
import type { Meal } from "@/types";
import { useBreakpoints, breakpointsTailwind } from "@vueuse/core";

const { smaller } = useBreakpoints(breakpointsTailwind);
const isMobile = smaller("md");

const route = useRoute();
const weekStore = useWeekStore();

watch(
  () => route.query.date,
  (date) => {
    if (date && typeof date === "string") {
      weekStore.setWeekFromDate(new Date(date));
    }
  },
  { immediate: true },
);

const { data: meals, isLoading: isLoadingMeals } = useMealsQuery();

const viewMode = ref<"browse" | "add">("browse");
const searchQuery = ref("");
const editingMeal = ref<Meal | null>(null);

const filteredMeals = computed(() => {
  if (!meals.value) return [];
  if (!searchQuery.value.trim()) return meals.value;

  const query = searchQuery.value.toLowerCase().trim();
  return meals.value.filter((meal) => {
    return (
      meal.name.toLowerCase().includes(query) ||
      meal.tags?.some((tag) => tag.toLowerCase().includes(query)) ||
      meal.ingredients.some((ing) => ing.name.toLowerCase().includes(query))
    );
  });
});

const showAddForm = () => {
  editingMeal.value = null;
  viewMode.value = "add";
};

const handleEditMeal = (meal: Meal) => {
  editingMeal.value = meal;
  viewMode.value = "add";
};

const backToBrowse = () => {
  viewMode.value = "browse";
  editingMeal.value = null;
};

const handleFormSubmit = () => {
  backToBrowse();
};

const handleFormCancel = () => {
  backToBrowse();
};

const handleFormDelete = () => {
  backToBrowse();
};
</script>

<template>
  <div class="flex flex-col gap-4 pb-24 md:pb-0">
    <!-- 'Browse' mode -->
    <div
      v-if="viewMode === 'browse'"
      class="flex flex-col gap-4 flex-1 min-h-0"
    >
      <div class="flex gap-4 items-center w-full self-center">
        <IconField class="grow">
          <InputIcon class="pi pi-search" />
          <InputText
            v-model="searchQuery"
            placeholder="Search meals by name, tag, or ingredient..."
            fluid
          />
        </IconField>
        <span v-if="!isMobile" class="text-gray-500">OR</span>
        <Button
          v-if="!isMobile"
          icon="pi pi-plus"
          label="Add new meal"
          @click="showAddForm"
        />
      </div>

      <WeekNavigator disable-past />

      <div v-if="isLoadingMeals" class="text-center py-12">
        <i class="pi pi-spin pi-spinner" style="font-size: 2rem" />
        <p class="text-sm mt-4 text-surface-600">
          Loading your meal library...
        </p>
      </div>

      <div
        v-else-if="filteredMeals.length > 0"
        class="flex-1 min-h-0 overflow-y-auto pb-8"
      >
        <div class="grid grid-cols-1 sm:grid-cols-4 xl:grid-cols-7 gap-4">
          <MealCard
            v-for="meal in filteredMeals"
            :key="meal.id"
            :meal="meal"
            :week-start="weekStore.weekStart"
            @edit="handleEditMeal"
          />
        </div>
      </div>

      <div v-else-if="searchQuery.trim()" class="text-center py-12">
        <p class="text-lg mb-2">No meals found</p>
        <p class="text-sm text-surface-600">Try a different search term</p>
      </div>

      <div v-else class="text-center py-12">
        <p class="text-lg mb-2">No meals in your library yet</p>
        <p class="text-sm text-surface-600">
          Click "Add New Meal" above to get started
        </p>
      </div>
    </div>
    <!-- 'Add' mode -->
    <div v-else class="px-20">
      <Button
        label="Back to library"
        icon="pi pi-arrow-left"
        text
        @click="backToBrowse"
      />
      <MealForm
        :meal="editingMeal"
        @submit="handleFormSubmit"
        @cancel="handleFormCancel"
        @delete="handleFormDelete"
      />
    </div>
  </div>
</template>
