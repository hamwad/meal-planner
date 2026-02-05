<script setup lang="ts">
import { getWeekStart, addDays } from "@/utils/dateHelpers";
import type { Meal } from "@/types";
import { useMealsQuery } from "@/api/meals";
import MealForm from "./MealForm.vue";

const emit = defineEmits(["close"]);

// Data queries
const { data: meals, isLoading: isLoadingMeals } = useMealsQuery();

// Dialog and form state
const visible = ref(true);
const currentWeekStart = ref(getWeekStart());
const viewMode = ref<"browse" | "form">("browse");
const searchQuery = ref("");
const editingMeal = ref<Meal | null>(null);

// Computed
const isEditMode = computed(() => editingMeal.value !== null);

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

// Methods
const closeDialog = () => {
  visible.value = false;
  viewMode.value = "browse";
  editingMeal.value = null;
  emit("close");
};

const showAddForm = () => {
  editingMeal.value = null;
  viewMode.value = "form";
};

const handleEditMeal = (meal: Meal) => {
  editingMeal.value = meal;
  viewMode.value = "form";
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

const previousWeek = () => {
  currentWeekStart.value = addDays(currentWeekStart.value, -7);
};

const nextWeek = () => {
  currentWeekStart.value = addDays(currentWeekStart.value, 7);
};

const goToCurrentWeek = () => {
  currentWeekStart.value = getWeekStart();
};
</script>

<template>
  <Dialog
    :visible="visible"
    modal
    class="w-[90%] px-4"
    :header="viewMode === 'browse' ? 'Meal library' : 'Add new meal'"
    @update:visible="visible = false"
    @after-hide="closeDialog"
  >
    <!-- BROWSE MODE -->
    <div v-if="viewMode === 'browse'" class="flex flex-col gap-4">
      <p class="text-sm text-surface-500">Click a day to schedule meals</p>

      <InputText
        v-model="searchQuery"
        placeholder="Search meals by name, tag, or ingredient..."
        class="w-full"
      />

      <div class="flex justify-between items-center">
        <div class="flex items-center gap-2">
          <span class="text-xs text-surface-600">Schedule for:</span>
          <div class="flex gap-1">
            <Button label="← Prev" text size="small" @click="previousWeek" />
            <Button
              label="This week"
              text
              size="small"
              @click="goToCurrentWeek"
            />
            <Button label="Next →" text size="small" @click="nextWeek" />
          </div>
        </div>

        <Button label="Add new meal" icon="pi pi-plus" @click="showAddForm" />
      </div>

      <div class="overflow-y-auto max-h-[calc(90vh-240px)]">
        <div v-if="isLoadingMeals" class="text-center py-12">
          <i class="pi pi-spin pi-spinner" style="font-size: 2rem"></i>
          <p class="text-sm mt-4 text-surface-600">
            Loading your meal library...
          </p>
        </div>

        <div
          v-else-if="filteredMeals.length > 0"
          class="grid grid-cols-1 md:grid-cols-5 gap-4"
        >
          <MealCard :meals="filteredMeals" @edit="handleEditMeal" />
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
    </div>

    <!-- FORM MODE -->
    <div v-else class="max-h-[90vh]">
      <Button
        class="mb-4"
        label="Back to library"
        icon="pi pi-arrow-left"
        text
        rounded
        @click="backToBrowse"
        severity="secondary"
      />
      <MealForm
        :meal="editingMeal"
        @submit="handleFormSubmit"
        @cancel="handleFormCancel"
        @delete="handleFormDelete"
      />
    </div>
    <template #footer>
      <div class="flex gap-2">
        <Button
          v-if="viewMode === 'form'"
          label="Cancel"
          severity="secondary"
          outlined
          @click="backToBrowse"
        />
        <Button
          v-if="viewMode === 'browse'"
          label="Done"
          @click="closeDialog"
        />
        <Button
          v-else
          form="meal-form"
          type="submit"
          :label="isEditMode ? 'Update meal' : 'Save meal'"
        />
      </div>
    </template>
  </Dialog>
</template>
