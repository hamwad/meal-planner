<script setup lang="ts">
import { ref, computed, watch } from "vue";
import { v4 as uuidv4 } from "uuid";
import { useMealsStore } from "@/stores/meals";
import { useCalendarStore } from "@/stores/calendar";
import {
  getWeekStart,
  addDays,
  formatDateISO,
  formatDate,
} from "@/utils/dateHelpers";
import { fetchRecipeFromUrl } from "@/utils/recipeParser";
import type { Meal, Ingredient, Unit } from "@/types";

const mealsStore = useMealsStore();
const calendarStore = useCalendarStore();

const dialogRef = ref<HTMLDialogElement | null>(null);
const currentWeekStart = ref(getWeekStart());
const viewMode = ref<"browse" | "form">("browse");
const searchQuery = ref("");

// Form state
const editingMealId = ref<string | null>(null);
const recipeUrl = ref("");
const isLoading = ref(false);
const errorMessage = ref("");
const mealName = ref("");
const defaultServings = ref(4);
const originalServings = ref<number | null>(null);
const baseIngredients = ref<
  Array<{ name: string; quantity: number; unit: Unit }>
>([]);
const ingredients = ref<Array<{ name: string; quantity: number; unit: Unit }>>([
  { name: "", quantity: 0, unit: "g" },
]);
const recipeSteps = ref<string[]>([""]);
const prepTime = ref<number | undefined>(undefined);
const cookTime = ref<number | undefined>(undefined);
const tagInput = ref("");
const tags = ref<string[]>([]);
const imageUrl = ref("");
const deleteConfirmation = ref(false);
let deleteConfirmationTimer: ReturnType<typeof setTimeout> | null = null;

const units: Unit[] = ["g", "kg", "ml", "l", "pcs"];

// Watch for servings changes and scale ingredients accordingly
watch(defaultServings, (newServings, oldServings) => {
  if (originalServings.value !== null && newServings > 0 && oldServings > 0) {
    const scaleFactor = newServings / originalServings.value;
    ingredients.value = baseIngredients.value.map((ing) => ({
      name: ing.name,
      quantity: Math.round(ing.quantity * scaleFactor * 10) / 10,
      unit: ing.unit,
    }));
  }
});

// Generate current week dates for scheduling
const weekDays = computed(() => {
  return Array.from({ length: 7 }, (_, i) => {
    const date = addDays(currentWeekStart.value, i);
    return {
      date,
      dateISO: formatDateISO(date),
      label: formatDate(date),
    };
  });
});

// Filter meals based on search query
const filteredMeals = computed(() => {
  if (!searchQuery.value.trim()) {
    return mealsStore.meals;
  }

  const query = searchQuery.value.toLowerCase().trim();
  return mealsStore.meals.filter((meal) => {
    // Search in meal name
    if (meal.name.toLowerCase().includes(query)) {
      return true;
    }

    // Search in tags
    if (meal.tags?.some((tag) => tag.toLowerCase().includes(query))) {
      return true;
    }

    // Search in ingredient names
    if (meal.ingredients.some((ing) => ing.name.toLowerCase().includes(query))) {
      return true;
    }

    return false;
  });
});

const openDialog = () => {
  viewMode.value = "browse";
  searchQuery.value = ""; // Clear search when opening
  dialogRef.value?.showModal();
};

const closeDialog = () => {
  dialogRef.value?.close();
  viewMode.value = "browse";
  resetForm();
};

const isMealScheduledForDay = (mealId: string, dateISO: string): boolean => {
  return calendarStore.calendarMeals.some(
    (cm) => cm.mealId === mealId && cm.date === dateISO,
  );
};

const toggleScheduleForDay = (meal: Meal, dateISO: string) => {
  const isScheduled = isMealScheduledForDay(meal.id, dateISO);

  if (isScheduled) {
    calendarStore.removeMealFromDate(meal.id, dateISO);
  } else {
    calendarStore.addMealToDate(meal.id, dateISO);
  }
};

const isEditMode = computed(() => editingMealId.value !== null);

const canSubmit = computed(() => {
  return (
    mealName.value.trim() !== "" &&
    defaultServings.value > 0 &&
    ingredients.value.some((i) => i.name.trim() !== "" && i.quantity > 0)
  );
});

const showAddForm = () => {
  resetForm();
  viewMode.value = "form";
};

const editMeal = (meal: Meal) => {
  resetForm();
  editingMealId.value = meal.id;
  mealName.value = meal.name;
  defaultServings.value = meal.defaultServings;
  originalServings.value = meal.defaultServings;
  baseIngredients.value = JSON.parse(JSON.stringify(meal.ingredients));
  ingredients.value = meal.ingredients.map((ing) => ({
    name: ing.name,
    quantity: ing.quantity,
    unit: ing.unit,
  }));
  recipeSteps.value = meal.recipe?.steps.length ? meal.recipe.steps : [""];
  prepTime.value = meal.recipe?.prepTime;
  cookTime.value = meal.recipe?.cookTime;
  tags.value = meal.tags || [];
  imageUrl.value = meal.imageUrl || "";
  viewMode.value = "form";
};

const backToBrowse = () => {
  viewMode.value = "browse";
  resetForm();
};

const resetForm = () => {
  editingMealId.value = null;
  recipeUrl.value = "";
  errorMessage.value = "";
  deleteConfirmation.value = false;

  if (deleteConfirmationTimer) {
    clearTimeout(deleteConfirmationTimer);
    deleteConfirmationTimer = null;
  }

  mealName.value = "";
  defaultServings.value = 4;
  originalServings.value = null;
  baseIngredients.value = [];
  ingredients.value = [{ name: "", quantity: 0, unit: "g" }];
  recipeSteps.value = [""];
  prepTime.value = undefined;
  cookTime.value = undefined;
  tagInput.value = "";
  tags.value = [];
  imageUrl.value = "";
};

const fetchRecipe = async () => {
  if (!recipeUrl.value.trim()) return;

  isLoading.value = true;
  errorMessage.value = "";

  try {
    const recipe = await fetchRecipeFromUrl(recipeUrl.value);

    if (recipe) {
      mealName.value = recipe.name;
      defaultServings.value = recipe.servings;
      originalServings.value = recipe.servings;
      baseIngredients.value = JSON.parse(JSON.stringify(recipe.ingredients));
      ingredients.value = recipe.ingredients;
      recipeSteps.value = recipe.steps.length > 0 ? recipe.steps : [""];
      prepTime.value = recipe.prepTime;
      cookTime.value = recipe.cookTime;
      tags.value = recipe.tags || [];
      imageUrl.value = recipe.imageUrl || "";
    } else {
      errorMessage.value =
        "Could not parse recipe from this URL. Please try manually entering the details.";
    }
  } catch (error) {
    errorMessage.value =
      error instanceof Error ? error.message : "Failed to fetch recipe";
  } finally {
    isLoading.value = false;
  }
};

const addIngredient = () => {
  const newIng = { name: "", quantity: 0, unit: "g" as Unit };
  ingredients.value.push(newIng);

  if (originalServings.value !== null) {
    baseIngredients.value.push({ ...newIng });
  }
};

const removeIngredient = (index: number) => {
  if (ingredients.value.length > 1) {
    ingredients.value.splice(index, 1);

    if (
      originalServings.value !== null &&
      baseIngredients.value.length > index
    ) {
      baseIngredients.value.splice(index, 1);
    }
  }
};

const addRecipeStep = () => {
  recipeSteps.value.push("");
};

const removeRecipeStep = (index: number) => {
  if (recipeSteps.value.length > 1) {
    recipeSteps.value.splice(index, 1);
  }
};

const addTag = () => {
  const tag = tagInput.value.trim();
  if (tag && !tags.value.includes(tag)) {
    tags.value.push(tag);
    tagInput.value = "";
  }
};

const removeTag = (tag: string) => {
  tags.value = tags.value.filter((t) => t !== tag);
};

const handleSubmit = () => {
  if (!canSubmit.value) return;

  const validIngredients: Ingredient[] = ingredients.value
    .filter((i) => i.name.trim() !== "" && i.quantity > 0)
    .map((i) => ({
      id: uuidv4(),
      name: i.name.trim(),
      quantity: i.quantity,
      unit: i.unit,
    }));

  const validSteps = recipeSteps.value
    .map((s) => s.trim())
    .filter((s) => s !== "");

  const mealData: Meal = {
    id: editingMealId.value || uuidv4(),
    name: mealName.value.trim(),
    defaultServings: defaultServings.value,
    ingredients: validIngredients,
    recipe:
      validSteps.length > 0
        ? {
            steps: validSteps,
            prepTime: prepTime.value,
            cookTime: cookTime.value,
          }
        : undefined,
    tags: tags.value.length > 0 ? tags.value : undefined,
    imageUrl: imageUrl.value.trim() || undefined,
  };

  if (isEditMode.value) {
    mealsStore.updateMeal(mealData.id, mealData);
  } else {
    mealsStore.addMeal(mealData);
  }

  backToBrowse();
};

const handleDelete = () => {
  if (!editingMealId.value) return;

  if (!deleteConfirmation.value) {
    deleteConfirmation.value = true;

    deleteConfirmationTimer = setTimeout(() => {
      deleteConfirmation.value = false;
    }, 3000);

    return;
  }

  if (deleteConfirmationTimer) {
    clearTimeout(deleteConfirmationTimer);
  }

  mealsStore.deleteMeal(editingMealId.value);
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

defineExpose({
  openDialog,
  editMeal,
});
</script>

<template>
  <dialog ref="dialogRef" class="modal">
    <div class="modal-box max-w-6xl max-h-[90vh] p-0">
      <!-- BROWSE MODE -->
      <div v-if="viewMode === 'browse'">
        <!-- Header -->
        <div class="sticky top-0 bg-base-100 z-10 border-b border-base-300">
          <div class="flex justify-between items-center p-6 pb-4">
            <div>
              <h2 class="text-2xl font-bold">Meal Library</h2>
              <p class="text-sm text-base-content/70 mt-1">
                Click a day to schedule meals
              </p>
            </div>
            <button
              type="button"
              class="btn btn-ghost btn-sm btn-circle"
              @click="closeDialog"
            >
              ✕
            </button>
          </div>

          <!-- Search Bar -->
          <div class="px-6 pb-3">
            <div class="relative">
              <input
                v-model="searchQuery"
                type="text"
                placeholder="Search meals by name, tag, or ingredient..."
                class="input input-bordered w-full pr-20"
              />
              <div class="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-2">
                <span
                  v-if="searchQuery.trim()"
                  class="text-xs text-base-content/60"
                >
                  {{ filteredMeals.length }} {{ filteredMeals.length === 1 ? 'meal' : 'meals' }}
                </span>
                <button
                  v-if="searchQuery.trim()"
                  type="button"
                  class="btn btn-ghost btn-xs btn-circle"
                  @click="searchQuery = ''"
                  title="Clear search"
                >
                  ✕
                </button>
              </div>
            </div>
          </div>

          <div class="flex justify-between px-6 mb-3">
            <!-- Week Navigation -->
            <div class="flex justify-end items-center mb-3">
              <div class="text-xs text-base-content/70">Schedule for:</div>
              <div class="flex gap-2">
                <button class="btn btn-xs btn-ghost" @click="previousWeek">
                  ← Prev
                </button>
                <button class="btn btn-xs btn-soft" @click="goToCurrentWeek">
                  This Week
                </button>
                <button class="btn btn-xs btn-ghost" @click="nextWeek">
                  Next →
                </button>
              </div>
            </div>

            <!-- Add New Meal Button -->
            <button
              class="btn btn-primary justify-self-end flex"
              @click="showAddForm"
            >
              + Add New Meal
            </button>
          </div>
        </div>

        <!-- Meal Grid -->
        <div class="p-6 overflow-y-auto max-h-[calc(90vh-240px)]">
          <div class="grid grid-cols-1 md:grid-cols-5 gap-4">
            <div
              v-for="meal in filteredMeals"
              :key="meal.id"
              class="card bg-base-100 shadow-md hover:shadow-lg transition-shadow overflow-hidden"
            >
              <!-- Image -->
              <figure v-if="meal.imageUrl" class="h-32">
                <img
                  :src="meal.imageUrl"
                  :alt="meal.name"
                  class="w-full h-full object-cover"
                />
              </figure>
              <div v-else class="h-32 bg-gradient-to-br from-primary/20 to-secondary/20 flex items-center justify-center">
                <span class="text-4xl">🍽️</span>
              </div>

              <div class="card-body px-2 py-4 flex justify-between">
                <div class="flex justify-between items-start mb-2">
                  <h3 class="card-title text-base">{{ meal.name }}</h3>
                  <button
                    class="btn btn-ghost btn-xs"
                    @click="editMeal(meal)"
                    title="Edit meal"
                  >
                    ✏️
                  </button>
                </div>

                <div class="text-sm text-base-content/70 mb-3">
                  <p>{{ meal.defaultServings }} servings</p>
                  <p>{{ meal.ingredients.length }} ingredients</p>
                </div>

                <div
                  v-if="meal.tags && meal.tags.length"
                  class="flex flex-wrap gap-1 mb-3"
                >
                  <span
                    v-for="tag in meal.tags"
                    :key="tag"
                    class="badge badge-sm badge-soft"
                  >
                    {{ tag }}
                  </span>
                </div>

                <!-- Day Selection Buttons -->
                <div class="flex flex-col">
                  <div class="divider mb-1 text-xs">Schedule for</div>
                  <div class="flex flex-wrap justify-center">
                    <button
                      v-for="day in weekDays"
                      :key="day.dateISO"
                      class="btn btn-xs"
                      :class="
                        isMealScheduledForDay(meal.id, day.dateISO)
                          ? 'btn-circle'
                          : 'btn-ghost'
                      "
                      @click="toggleScheduleForDay(meal, day.dateISO)"
                      :title="
                        isMealScheduledForDay(meal.id, day.dateISO)
                          ? `Remove from ${day.label}`
                          : `Add to ${day.label}`
                      "
                    >
                      {{
                        day.date.toLocaleDateString("en-US", {
                          weekday: "narrow",
                        })
                      }}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <!-- No results state -->
          <div
            v-if="filteredMeals.length === 0 && searchQuery.trim()"
            class="text-center py-12 text-base-content/60"
          >
            <p class="text-lg mb-2">No meals found</p>
            <p class="text-sm">Try a different search term</p>
          </div>

          <!-- Empty library state -->
          <div
            v-else-if="mealsStore.meals.length === 0"
            class="text-center py-12 text-base-content/60"
          >
            <p class="text-lg mb-2">No meals in your library yet</p>
            <p class="text-sm">Click "Add New Meal" above to get started</p>
          </div>
        </div>

        <!-- Footer -->
        <div
          class="sticky bottom-0 bg-base-100 border-t border-base-300 p-4 justify-end"
        >
          <button class="btn btn-primary" @click="closeDialog">Done</button>
        </div>
      </div>

      <!-- FORM MODE -->
      <div v-else class="overflow-y-auto max-h-[90vh]">
        <form @submit.prevent="handleSubmit" class="p-6 space-y-4">
          <!-- Header -->
          <div class="flex justify-between items-center pb-4 border-b">
            <div class="flex items-center gap-3">
              <button
                type="button"
                class="btn btn-ghost btn-sm btn-circle"
                @click="backToBrowse"
              >
                ←
              </button>
              <h3 class="font-bold text-lg">
                {{ isEditMode ? "Edit Meal" : "Add New Meal" }}
              </h3>
            </div>
            <button
              type="button"
              class="btn btn-ghost btn-sm btn-circle"
              @click="closeDialog"
            >
              ✕
            </button>
          </div>

          <!-- Recipe URL Import (only in create mode) -->
          <div v-if="!isEditMode" class="bg-base-200 p-4 rounded-lg">
            <label class="label">
              <span class="label-text font-semibold"
                >Import from URL (Optional)</span
              >
            </label>
            <div class="flex gap-2">
              <input
                v-model="recipeUrl"
                type="url"
                placeholder="https://www.hellofresh.co.nz/recipes/..."
                class="input input-bordered input-sm flex-1"
                :disabled="isLoading"
              />
              <button
                type="button"
                class="btn btn-sm btn-primary"
                @click="fetchRecipe"
                :disabled="!recipeUrl.trim() || isLoading"
              >
                <span
                  v-if="isLoading"
                  class="loading loading-spinner loading-xs"
                ></span>
                <span v-else>Fetch Recipe</span>
              </button>
            </div>
            <p v-if="errorMessage" class="text-error text-sm mt-2">
              {{ errorMessage }}
            </p>
            <p class="text-xs text-base-content/60 mt-2">
              Paste a recipe URL from HelloFresh, BBC Good Food, or other recipe
              sites
            </p>
          </div>

          <div v-if="!isEditMode" class="divider my-2">OR ENTER MANUALLY</div>

          <!-- Meal Name -->
          <div class="form-control">
            <label class="label">
              <span class="label-text font-semibold">Meal Name *</span>
            </label>
            <input
              v-model="mealName"
              type="text"
              placeholder="e.g., Spaghetti Bolognese"
              class="input input-bordered"
              required
            />
          </div>

          <!-- Default Servings -->
          <div class="form-control">
            <label class="label">
              <span class="label-text font-semibold">Default Servings *</span>
              <span
                v-if="originalServings !== null"
                class="label-text-alt text-info"
              >
                Auto-scaling from {{ originalServings }} servings
              </span>
            </label>
            <input
              v-model.number="defaultServings"
              type="number"
              min="1"
              class="input input-bordered"
              required
            />
          </div>

          <!-- Ingredients -->
          <div class="form-control">
            <label class="label">
              <span class="label-text font-semibold">Ingredients *</span>
            </label>
            <div class="space-y-2">
              <div
                v-for="(ingredient, index) in ingredients"
                :key="index"
                class="flex gap-2"
              >
                <input
                  v-model="ingredient.name"
                  type="text"
                  placeholder="Ingredient name"
                  class="input input-bordered input-sm flex-1"
                />
                <input
                  v-model.number="ingredient.quantity"
                  type="number"
                  min="0"
                  step="0.1"
                  placeholder="Qty"
                  class="input input-bordered input-sm w-24"
                />
                <select
                  v-model="ingredient.unit"
                  class="select select-bordered select-sm w-20"
                >
                  <option v-for="unit in units" :key="unit" :value="unit">
                    {{ unit }}
                  </option>
                </select>
                <button
                  type="button"
                  class="btn btn-ghost btn-sm btn-circle"
                  @click="removeIngredient(index)"
                  :disabled="ingredients.length === 1"
                >
                  ✕
                </button>
              </div>
            </div>
            <button
              type="button"
              class="btn btn-ghost btn-sm mt-2"
              @click="addIngredient"
            >
              + Add Ingredient
            </button>
          </div>

          <!-- Recipe Steps -->
          <div class="form-control">
            <label class="label">
              <span class="label-text font-semibold"
                >Recipe Steps (Optional)</span
              >
            </label>
            <div class="space-y-2">
              <div
                v-for="(step, index) in recipeSteps"
                :key="index"
                class="flex gap-2"
              >
                <span class="badge badge-sm mt-2">{{ index + 1 }}</span>
                <textarea
                  v-model="recipeSteps[index]"
                  :placeholder="`Step ${index + 1}`"
                  class="textarea textarea-bordered textarea-sm flex-1"
                  rows="2"
                ></textarea>
                <button
                  type="button"
                  class="btn btn-ghost btn-sm btn-circle"
                  @click="removeRecipeStep(index)"
                  :disabled="recipeSteps.length === 1"
                >
                  ✕
                </button>
              </div>
            </div>
            <button
              type="button"
              class="btn btn-ghost btn-sm mt-2"
              @click="addRecipeStep"
            >
              + Add Step
            </button>
          </div>

          <!-- Prep & Cook Time -->
          <div class="grid grid-cols-2 gap-4">
            <div class="form-control">
              <label class="label">
                <span class="label-text font-semibold">Prep Time (min)</span>
              </label>
              <input
                v-model.number="prepTime"
                type="number"
                min="0"
                placeholder="Optional"
                class="input input-bordered"
              />
            </div>
            <div class="form-control">
              <label class="label">
                <span class="label-text font-semibold">Cook Time (min)</span>
              </label>
              <input
                v-model.number="cookTime"
                type="number"
                min="0"
                placeholder="Optional"
                class="input input-bordered"
              />
            </div>
          </div>

          <!-- Tags -->
          <div class="form-control">
            <label class="label">
              <span class="label-text font-semibold">Tags (Optional)</span>
            </label>
            <div class="flex gap-2 mb-2">
              <input
                v-model="tagInput"
                type="text"
                placeholder="e.g., Italian, Quick"
                class="input input-bordered input-sm flex-1"
                @keyup.enter.prevent="addTag"
              />
              <button type="button" class="btn btn-sm" @click="addTag">
                Add
              </button>
            </div>
            <div v-if="tags.length > 0" class="flex flex-wrap gap-2">
              <span
                v-for="tag in tags"
                :key="tag"
                class="badge badge-primary gap-2"
              >
                {{ tag }}
                <button
                  type="button"
                  class="btn btn-ghost btn-xs btn-circle"
                  @click="removeTag(tag)"
                >
                  ✕
                </button>
              </span>
            </div>
          </div>

          <!-- Image URL -->
          <div class="form-control">
            <label class="label">
              <span class="label-text font-semibold">Image URL (Optional)</span>
            </label>
            <input
              v-model="imageUrl"
              type="url"
              placeholder="https://example.com/image.jpg"
              class="input input-bordered"
            />
            <label class="label">
              <span class="label-text-alt">Paste a URL to an image for this meal</span>
            </label>
          </div>

          <!-- Submit Buttons -->
          <div class="flex gap-2 pt-4 border-t">
            <button
              v-if="isEditMode"
              type="button"
              class="btn"
              :class="
                deleteConfirmation
                  ? 'btn-error animate-pulse'
                  : 'btn-outline btn-error'
              "
              @click="handleDelete"
            >
              {{
                deleteConfirmation
                  ? "Click again to confirm"
                  : "Delete from library"
              }}
            </button>
            <button
              type="submit"
              class="btn btn-primary flex-1"
              :disabled="!canSubmit"
            >
              {{ isEditMode ? "Update Meal" : "Save Meal" }}
            </button>
            <button type="button" class="btn btn-ghost" @click="backToBrowse">
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>

    <form method="dialog" class="modal-backdrop">
      <button @click="closeDialog">close</button>
    </form>
  </dialog>
</template>
