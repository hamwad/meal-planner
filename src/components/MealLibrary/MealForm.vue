<script setup lang="ts">
import { v4 as uuidv4 } from "uuid";
import { useMealMutations } from "@/api/meals";
import { fetchRecipeFromUrl } from "@/utils/recipeParser";
import type { Meal, Ingredient } from "@/types";
import { useAddMealForm } from "@/composables/useAddMealForm";

interface Props {
  meal?: Meal | null;
}

const props = defineProps<Props>();
const emit = defineEmits<{
  submit: [];
  cancel: [];
  delete: [];
}>();

// Use form composable
const {
  handleSubmit,
  errors,
  resetForm,
  values,
  setValues,
  setFieldValue,
  // Field bindings
  mealName,
  defaultServings,
  originalServings,
  prepTime,
  cookTime,
  imageUrl,
  // Array helpers
  addIngredient,
  removeIngredient,
  addRecipeStep,
  removeRecipeStep,
  addTag: addTagToForm,
  removeTag: removeTagFromForm,
  updateIngredientField,
  updateRecipeStep,
  populateForm,
} = useAddMealForm();

// Mutations
const { addMeal, updateMeal, deleteMeal } = useMealMutations();

// Form state
const recipeUrl = ref("");
const isLoadingRecipe = ref(false);
const recipeErrorMessage = ref("");
const deleteConfirmation = ref(false);
let deleteConfirmationTimer: ReturnType<typeof setTimeout> | null = null;
const tagInput = ref("");
const editingMealId = ref<string | null>(null);

// Computed
const isEditMode = computed(() => !!editingMealId.value);

// Watch for prop changes
watch(
  () => props.meal,
  (newMeal) => {
    if (newMeal) {
      editingMealId.value = newMeal.id;
      populateForm(newMeal);
    } else {
      editingMealId.value = null;
      resetForm();
    }
  },
  { immediate: true }
);

// Watch for servings changes and scale ingredients accordingly
watch(defaultServings, (newServings, oldServings) => {
  if (originalServings.value !== null && newServings > 0 && oldServings > 0) {
    const scaleFactor = newServings / originalServings.value;
    const scaledIngredients = values.ingredients.map((ing) => ({
      ...ing,
      quantity: Math.round(ing.quantity * scaleFactor * 10) / 10,
    }));
    setFieldValue("ingredients", scaledIngredients);
  }
});

const fetchRecipe = async () => {
  if (!recipeUrl.value.trim()) return;

  isLoadingRecipe.value = true;
  recipeErrorMessage.value = "";

  try {
    const recipe = await fetchRecipeFromUrl(recipeUrl.value);
    if (recipe) {
      setValues({
        mealName: recipe.name,
        defaultServings: recipe.servings,
        originalServings: recipe.servings,
        ingredients: recipe.ingredients,
        recipeSteps: recipe.steps.length > 0 ? recipe.steps : [""],
        prepTime: recipe.prepTime,
        cookTime: recipe.cookTime,
        tags: recipe.tags || [],
        imageUrl: recipe.imageUrl || "",
      });
    } else {
      recipeErrorMessage.value = "Could not parse recipe from this URL.";
    }
  } catch (error) {
    recipeErrorMessage.value =
      error instanceof Error ? error.message : "Failed to fetch recipe";
  } finally {
    isLoadingRecipe.value = false;
  }
};

const onSubmit = handleSubmit(async (formValues) => {
  const validIngredients: Ingredient[] = formValues.ingredients
    .filter((i) => i.name.trim() && i.quantity > 0)
    .map((i) => ({
      id: uuidv4(),
      name: i.name.trim(),
      quantity: i.quantity,
      unit: i.unit,
    }));

  const validSteps = formValues.recipeSteps
    .map((s) => s.trim())
    .filter((s) => s !== "");

  const mealData: Meal = {
    id: editingMealId.value || uuidv4(),
    name: formValues.mealName.trim(),
    defaultServings: formValues.defaultServings,
    ingredients: validIngredients,
    recipe:
      validSteps.length > 0
        ? {
            steps: validSteps,
            prepTime: formValues.prepTime,
            cookTime: formValues.cookTime,
          }
        : undefined,
    tags: formValues.tags.length > 0 ? formValues.tags : undefined,
    imageUrl: formValues.imageUrl?.trim() || undefined,
  };

  if (isEditMode.value) {
    await updateMeal.mutateAsync({ id: mealData.id, meal: mealData });
  } else {
    await addMeal.mutateAsync(mealData);
  }

  emit("submit");
});

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

  deleteMeal.mutate(editingMealId.value);
  emit("delete");
};

const addTag = () => {
  const tag = tagInput.value.trim();
  if (tag) {
    addTagToForm(tag);
    tagInput.value = "";
  }
};

const handleCancel = () => {
  emit("cancel");
};

// Cleanup
onBeforeUnmount(() => {
  if (deleteConfirmationTimer) {
    clearTimeout(deleteConfirmationTimer);
  }
});

// Expose methods if needed
defineExpose({
  resetForm,
});
</script>

<template>
  <form @submit.prevent="onSubmit" class="flex flex-col gap-4" id="meal-form">
    <!-- Recipe URL Import -->
    <div
      v-if="!isEditMode"
      class="bg-surface-50 p-4 rounded-lg border border-surface-200"
    >
      <label class="block text-sm font-medium mb-2">
        Import from URL (Optional)
      </label>
      <div class="flex gap-2">
        <InputText
          v-model="recipeUrl"
          placeholder="https://www.hellofresh.co.nz/recipes/..."
          class="flex-1"
          :disabled="isLoadingRecipe"
        />
        <Button
          label="Fetch recipe"
          :loading="isLoadingRecipe"
          @click="fetchRecipe"
          :disabled="!recipeUrl.trim() || isLoadingRecipe"
        />
      </div>
      <small v-if="recipeErrorMessage" class="text-red-500 mt-1 block">
        {{ recipeErrorMessage }}
      </small>
      <small class="text-surface-600 mt-2 block">
        Paste a recipe URL from HelloFresh, BBC Good Food, or other recipe sites
      </small>
    </div>

    <Divider v-if="!isEditMode">OR ENTER MANUALLY</Divider>

    <!-- Meal Name -->
    <CoreInputText
      v-model="mealName"
      label="Meal name"
      required
      :error="errors.mealName"
    />

    <!-- Default Servings -->
    <div class="flex flex-col gap-2">
      <label class="text-sm font-medium">
        Default servings
        <span
          v-if="originalServings !== null"
          class="text-xs text-primary-500 ml-2"
        >
          (Auto-scaling from {{ originalServings }} servings)
        </span>
      </label>
      <InputNumber
        v-model="defaultServings"
        showButtons
        :min="1"
        :max="20"
        :step="1"
        buttonLayout="horizontal"
      >
        <template #incrementbuttonicon>
          <span class="pi pi-plus" />
        </template>
        <template #decrementbuttonicon>
          <span class="pi pi-minus" />
        </template>
      </InputNumber>
      <small v-if="errors.defaultServings" class="text-red-500">
        {{ errors.defaultServings }}
      </small>
    </div>

    <!-- Ingredients -->
    <div class="flex flex-col gap-2">
      <label class="text-sm font-medium">Ingredients</label>
      <div
        v-for="(ingredient, index) in values.ingredients"
        :key="index"
        class="flex gap-2 items-end"
      >
        <div class="flex-1">
          <InputText
            :model-value="ingredient.name"
            @update:model-value="updateIngredientField(index, 'name', $event)"
            placeholder="Ingredient name"
            class="w-full"
          />
        </div>
        <div class="w-32">
          <InputNumber
            :model-value="ingredient.quantity"
            @update:model-value="updateIngredientField(index, 'quantity', $event)"
            showButtons
            :min="0"
            :step="0.1"
            buttonLayout="horizontal"
            class="w-full"
          >
            <template #incrementbuttonicon>
              <span class="pi pi-plus" />
            </template>
            <template #decrementbuttonicon>
              <span class="pi pi-minus" />
            </template>
          </InputNumber>
        </div>
        <Select
          :model-value="ingredient.unit"
          @update:model-value="updateIngredientField(index, 'unit', $event)"
          :options="['g', 'kg', 'ml', 'l', 'pcs']"
          class="w-20"
        />
        <Button
          icon="pi pi-times"
          rounded
          text
          severity="danger"
          @click="removeIngredient(index)"
          :disabled="values.ingredients.length === 1"
        />
      </div>
      <Button
        label="Add ingredient"
        icon="pi pi-plus"
        outlined
        size="small"
        @click="addIngredient"
        class="self-start"
      />
    </div>

    <!-- Recipe Steps -->
    <div class="flex flex-col gap-2">
      <label class="text-sm font-medium">Recipe Steps (Optional)</label>
      <div
        v-for="(step, index) in values.recipeSteps"
        :key="index"
        class="flex gap-2 items-start"
      >
        <Chip :label="`${index + 1}`" class="mt-2" />
        <Textarea
          :model-value="step"
          @update:model-value="updateRecipeStep(index, $event)"
          :placeholder="`Step ${index + 1}`"
          rows="2"
          class="flex-1"
        />
        <Button
          icon="pi pi-times"
          rounded
          text
          severity="danger"
          @click="removeRecipeStep(index)"
          :disabled="values.recipeSteps.length === 1"
        />
      </div>
      <Button
        label="Add step"
        icon="pi pi-plus"
        outlined
        size="small"
        @click="addRecipeStep"
        class="self-start"
      />
    </div>

    <!-- Prep & Cook Time -->
    <div class="grid grid-cols-2 gap-4">
      <div class="flex flex-col gap-2">
        <label class="text-sm font-medium">Prep Time (minutes)</label>
        <InputNumber v-model="prepTime" :min="0" placeholder="Optional" />
      </div>
      <div class="flex flex-col gap-2">
        <label class="text-sm font-medium">Cook Time (minutes)</label>
        <InputNumber v-model="cookTime" :min="0" placeholder="Optional" />
      </div>
    </div>

    <!-- Tags -->
    <div class="flex flex-col gap-2">
      <label class="text-sm font-medium">Tags (Optional)</label>
      <div class="flex gap-2">
        <InputText
          v-model="tagInput"
          placeholder="e.g., Italian, Quick"
          class="flex-1"
          @keyup.enter.prevent="addTag"
        />
        <Button label="Add" @click="addTag" />
      </div>
      <div v-if="values.tags.length > 0" class="flex flex-wrap gap-2 mt-2">
        <Chip
          v-for="tag in values.tags"
          :key="tag"
          :label="tag"
          removable
          @remove="removeTagFromForm(tag)"
        />
      </div>
    </div>

    <!-- Image URL -->
    <CoreInputText
      v-model="imageUrl"
      label="Image URL (Optional)"
      placeholder="https://example.com/image.jpg"
      :error="errors.imageUrl"
    />

    <!-- Delete Button (in edit mode) -->
    <div v-if="isEditMode" class="flex gap-2">
      <Button
        :label="deleteConfirmation ? 'Click again to confirm' : 'Delete meal'"
        :severity="deleteConfirmation ? 'danger' : 'secondary'"
        outlined
        @click="handleDelete"
      />
    </div>
  </form>
</template>
