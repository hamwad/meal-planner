<script setup lang="ts">
import { v4 as uuidv4 } from "uuid";
import { useMealMutations } from "@/api/meals";
import { fetchRecipeFromUrl } from "@/utils/recipeParser";
import type { Meal, Ingredient, Unit } from "@/types";
import { useAddMealForm } from "@/composables/useAddMealForm";
import { toSentenceCase } from "@/utils/stringHelpers";

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
const baseIngredients = ref<
  Array<{ name: string; quantity: number; unit: Unit }>
>([]);

// Computed
const isEditMode = computed(() => !!editingMealId.value);

// Watch for prop changes
watch(
  () => props.meal,
  (newMeal) => {
    if (newMeal) {
      editingMealId.value = newMeal.id;
      populateForm(newMeal);
      baseIngredients.value =
        newMeal.ingredients?.map((ing) => ({
          name: ing.name,
          quantity: ing.quantity,
          unit: ing.unit,
        })) ?? [];
    } else {
      editingMealId.value = null;
      resetForm();
      baseIngredients.value = [];
    }
  },
  { immediate: true },
);

// Watch for servings changes and scale ingredients from base quantities
watch(defaultServings, (newServings) => {
  if (
    originalServings.value !== null &&
    newServings > 0 &&
    baseIngredients.value.length > 0
  ) {
    const scaleFactor = newServings / originalServings.value;
    const scaledIngredients = baseIngredients.value.map((ing) => ({
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
      baseIngredients.value =
        recipe.ingredients?.map((ing) => ({
          name: ing.name,
          quantity: ing.quantity,
          unit: ing.unit,
        })) ?? [];
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

const submitError = ref<string | null>(null);

const onSubmit = handleSubmit(
  async (formValues) => {
    submitError.value = null;

    const validIngredients: Ingredient[] =
      formValues.ingredients
        ?.filter((i) => i.name.trim() && i.quantity > 0)
        .map((i) => ({
          id: uuidv4(),
          name: toSentenceCase(i.name.trim()),
          quantity: i.quantity,
          unit: i.unit,
        })) ?? [];

    const validSteps = formValues.recipeSteps
      ?.map((s) => s.trim())
      .filter((s) => s !== "");

    const mealData: Meal = {
      id: editingMealId.value || uuidv4(),
      name: toSentenceCase(formValues.mealName.trim()),
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

    try {
      if (isEditMode.value) {
        await updateMeal.mutateAsync({ id: mealData.id, meal: mealData });
      } else {
        await addMeal.mutateAsync(mealData);
      }
      emit("submit");
    } catch (error) {
      submitError.value =
        error instanceof Error ? error.message : "Failed to save meal";
      console.error("Error saving meal:", error);
    }
  },
  (errors) => {
    console.error("Validation errors:", errors);
    submitError.value = "Please fix the validation errors above";
  },
);

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

  if (!tag) return;
  if (values.tags.length >= 5) return;
  if (values.tags.includes(tag)) {
    tagInput.value = "";
    return;
  }
  addTagToForm(tag);
  tagInput.value = "";
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
  <form
    @submit.prevent="onSubmit"
    class="flex flex-col gap-4 max-h-[80vh] overflow-y-auto"
    id="meal-form"
  >
    <!-- Recipe URL Import -->
    <div
      v-if="!isEditMode"
      class="bg-gray-50 px-8 py-4 rounded-lg border border-gray-200 w-fit"
    >
      <label class="block text-sm font-medium mb-2">
        Import from URL (Optional)
      </label>
      <div class="flex gap-2">
        <InputText
          v-model="recipeUrl"
          class="min-w-lg"
          :disabled="isLoadingRecipe"
          @keyup.enter="fetchRecipe"
        />
        <Button
          label="Fetch recipe"
          :loading="isLoadingRecipe"
          @click="fetchRecipe"
          @keyup.enter="fetchRecipe"
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

    <Divider v-if="!isEditMode" align="left"> Or enter manually </Divider>

    <div class="grid grid-cols-2 gap-4 items-start">
      <!-- Meal Name -->
      <CoreInputText
        v-model="mealName"
        label="Meal name"
        required
        :error="errors.mealName"
      />

      <!-- Default Servings -->
      <div class="flex flex-col ml-2">
        <label>
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
          class="w-fit"
        >
          <template #incrementicon>
            <span class="pi pi-plus" />
          </template>
          <template #decrementicon>
            <span class="pi pi-minus" />
          </template>
        </InputNumber>
        <small v-if="errors.defaultServings" class="text-red-500">
          {{ errors.defaultServings }}
        </small>
      </div>

      <!-- Ingredients -->
      <div class="flex flex-col col-span-2">
        <label>Ingredients</label>
        <div
          v-for="(ingredient, index) in values.ingredients"
          :key="index"
          class="flex items-end gap-4 mb-2"
        >
          <InputText
            :model-value="toSentenceCase(ingredient.name)"
            @update:model-value="updateIngredientField(index, 'name', $event)"
            class="w-1/2"
          />
          <InputNumber
            :model-value="ingredient.quantity"
            @update:model-value="
              updateIngredientField(index, 'quantity', $event)
            "
            showButtons
            :min="0"
            :step="0.1"
            buttonLayout="horizontal"
          >
            <template #incrementicon>
              <span class="pi pi-plus" />
            </template>
            <template #decrementicon>
              <span class="pi pi-minus" />
            </template>
          </InputNumber>
          <Select
            :model-value="ingredient.unit"
            @update:model-value="updateIngredientField(index, 'unit', $event)"
            :options="['g', 'kg', 'ml', 'l', 'pcs', 'cup']"
            class="w-24"
          />
          <Button
            icon="pi pi-times"
            text
            size="small"
            class="self-center"
            severity="danger"
            @click="removeIngredient(index)"
            :disabled="values.ingredients?.length === 1"
          />
          <Button
            label="Add ingredient"
            icon="pi pi-plus"
            class="self-center"
            size="small"
            :disabled="!ingredient.name"
            @click="addIngredient"
          />
        </div>
      </div>

      <!-- Recipe Steps -->
      <div class="flex flex-col col-span-2">
        <label>Recipe steps</label>
        <div
          v-for="(step, index) in values.recipeSteps"
          :key="index"
          class="flex gap-2 items-start mb-2"
        >
          <Badge :value="`${index + 1}`" severity="info" class="mt-2" />
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
            class="self-center"
            :disabled="values.recipeSteps.length === 1"
            @click="removeRecipeStep(index)"
          />
          <Button
            label="Add step"
            icon="pi pi-plus"
            size="small"
            class="self-center"
            :disabled="!step"
            @click="addRecipeStep"
          />
        </div>
      </div>

      <!-- Prep & Cook Time -->
      <div class="grid grid-cols-2 gap-4">
        <div class="flex flex-col">
          <label>Prep time <span class="text-xs">(mins)</span></label>
          <InputNumber v-model="prepTime" :min="0" />
        </div>
        <div class="flex flex-col">
          <label>Cook time <span class="text-xs">(mins)</span></label>
          <InputNumber v-model="cookTime" :min="0" />
        </div>
      </div>

      <!-- Tags -->
      <div class="flex flex-col">
        <label>Tags <span class="text-xs">(max 5)</span></label>
        <div class="flex gap-2">
          <InputText
            v-model="tagInput"
            class="flex-1"
            @keyup.enter.prevent="addTag"
          />
          <Button
            icon="pi pi-plus"
            size="small"
            class="self-center"
            label="Add tag"
            :disabled="!tagInput"
            @click="addTag"
          />
        </div>
        <div v-if="values.tags.length" class="flex flex-wrap gap-2 mt-2">
          <Chip
            v-for="tag in values.tags"
            :key="tag"
            :label="tag.toLowerCase()"
            size="small"
            removable
            @remove="removeTagFromForm(tag)"
          />
        </div>
      </div>

      <!-- Image URL -->
      <div class="flex items-start gap-4 col-span-2">
        <div class="w-1/2">
          <CoreInputText
            v-model="imageUrl"
            label="Image URL (Optional)"
            :error="errors.imageUrl"
          />
        </div>
        <Image
          v-if="imageUrl"
          :src="imageUrl"
          width="200"
          class="mt-6"
          alt="Meal image preview"
        />
      </div>
    </div>

    <!-- Submit Error -->
    <Message v-if="submitError" severity="error" :closable="false">
      {{ submitError }}
    </Message>

    <div class="flex gap-4 justify-end">
      <Button label="Cancel" outlined @click="$emit('cancel')" />

      <Button
        label="Save meal"
        form="meal-form"
        type="submit"
        :disabled="!mealName"
      />
    </div>
  </form>
</template>
