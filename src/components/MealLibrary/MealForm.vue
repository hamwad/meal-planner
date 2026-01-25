<script setup lang="ts">
import { ref, computed, watch, onBeforeUnmount } from "vue";
import { v4 as uuidv4 } from "uuid";
import { useMealsStore } from "@/stores/meals";
import { fetchRecipeFromUrl } from "@/utils/recipeParser";
import type { Meal, Ingredient, Unit } from "@/types";

const mealsStore = useMealsStore();

const dialogRef = ref<HTMLDialogElement | null>(null);
const editingMealId = ref<string | null>(null);
const recipeUrl = ref("");
const isLoading = ref(false);
const errorMessage = ref("");
const deleteConfirmation = ref(false);
let deleteConfirmationTimer: ReturnType<typeof setTimeout> | null = null;
const mealName = ref("");
const defaultServings = ref(4);
const originalServings = ref<number | null>(null); // Track original servings for scaling
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

const units: Unit[] = ["g", "kg", "ml", "l", "pcs"];

const isEditMode = computed(() => editingMealId.value !== null);

const canSubmit = computed(() => {
  return (
    mealName.value.trim() !== "" &&
    defaultServings.value > 0 &&
    ingredients.value.some((i) => i.name.trim() !== "" && i.quantity > 0)
  );
});

// Watch for servings changes and scale ingredients accordingly
watch(defaultServings, (newServings, oldServings) => {
  if (originalServings.value !== null && newServings > 0 && oldServings > 0) {
    // Scale ingredients based on servings ratio
    const scaleFactor = newServings / originalServings.value;
    ingredients.value = baseIngredients.value.map((ing) => ({
      name: ing.name,
      quantity: Math.round(ing.quantity * scaleFactor * 10) / 10, // Round to 1 decimal
      unit: ing.unit,
    }));
  }
});

const openDialog = (meal?: Meal) => {
  // Always reset form first
  resetForm();

  if (meal) {
    // Edit mode - populate form with existing meal data
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
  }

  dialogRef.value?.showModal();
};

const closeDialog = () => {
  dialogRef.value?.close();
};

// Expose openDialog so parent can call it
defineExpose({ openDialog });

const fetchRecipe = async () => {
  if (!recipeUrl.value.trim()) return;

  isLoading.value = true;
  errorMessage.value = "";

  try {
    const recipe = await fetchRecipeFromUrl(recipeUrl.value);

    if (recipe) {
      mealName.value = recipe.name;
      defaultServings.value = recipe.servings;
      originalServings.value = recipe.servings; // Store original for scaling
      baseIngredients.value = JSON.parse(JSON.stringify(recipe.ingredients)); // Deep copy
      ingredients.value = recipe.ingredients;
      recipeSteps.value = recipe.steps.length > 0 ? recipe.steps : [""];
      prepTime.value = recipe.prepTime;
      cookTime.value = recipe.cookTime;
      tags.value = recipe.tags || [];
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

  // If we're tracking base ingredients for scaling, add to base as well
  if (originalServings.value !== null) {
    baseIngredients.value.push({ ...newIng });
  }
};

const removeIngredient = (index: number) => {
  if (ingredients.value.length > 1) {
    ingredients.value.splice(index, 1);

    // If we're tracking base ingredients for scaling, remove from base as well
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
  };

  if (isEditMode.value) {
    mealsStore.updateMeal(mealData.id, mealData);
  } else {
    mealsStore.addMeal(mealData);
  }

  resetForm();
  closeDialog();
};

const handleDelete = () => {
  if (!editingMealId.value) return;

  // If not in confirmation state, enter confirmation mode
  if (!deleteConfirmation.value) {
    deleteConfirmation.value = true;

    // Reset confirmation after 3 seconds
    deleteConfirmationTimer = setTimeout(() => {
      deleteConfirmation.value = false;
    }, 3000);

    return;
  }

  // If already in confirmation state, actually delete
  if (deleteConfirmationTimer) {
    clearTimeout(deleteConfirmationTimer);
  }

  mealsStore.deleteMeal(editingMealId.value);
  resetForm();
  closeDialog();
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
};

const handleCancel = () => {
  resetForm();
  closeDialog();
};

// Cleanup timer on unmount
onBeforeUnmount(() => {
  if (deleteConfirmationTimer) {
    clearTimeout(deleteConfirmationTimer);
  }
});
</script>

<template>
  <div>
    <!-- Trigger Button -->
    <button class="btn btn-primary btn-block" @click="() => openDialog()">
      + Add New Meal
    </button>

    <!-- Modal Dialog -->
    <Teleport to="body">
      <dialog ref="dialogRef" class="modal">
        <div class="modal-box max-w-2xl max-h-[90vh] overflow-y-auto">
        <form @submit.prevent="handleSubmit" class="space-y-4">
          <div
            class="flex justify-between items-center sticky top-0 bg-base-100 pb-4 border-b"
          >
            <h3 class="font-bold text-lg">
              {{ isEditMode ? "Edit Meal" : "Add New Meal" }}
            </h3>
            <button
              type="button"
              class="btn btn-ghost btn-sm btn-circle"
              @click="handleCancel"
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
                v-for="(_step, index) in recipeSteps"
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

          <!-- Submit Buttons -->
          <div class="flex gap-2 pt-4 sticky bottom-0 bg-base-100 border-t">
            <button
              v-if="isEditMode"
              type="button"
              class="btn"
              :class="deleteConfirmation ? 'btn-error animate-pulse' : 'btn-outline btn-error'"
              @click="handleDelete"
            >
              {{ deleteConfirmation ? "Click again to confirm" : "Delete from library" }}
            </button>
            <button
              type="submit"
              class="btn btn-primary flex-1"
              :disabled="!canSubmit"
            >
              {{ isEditMode ? "Update Meal" : "Save Meal" }}
            </button>
            <button type="button" class="btn btn-ghost" @click="handleCancel">
              Cancel
            </button>
          </div>
        </form>
      </div>
        <form method="dialog" class="modal-backdrop">
          <button @click="handleCancel">close</button>
        </form>
      </dialog>
    </Teleport>
  </div>
</template>
