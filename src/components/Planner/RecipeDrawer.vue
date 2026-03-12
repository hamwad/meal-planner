<script setup lang="ts">
import type { Meal } from "@/types";
import emptyPlateImg from "@/assets/images/empty_plate.jpg";

defineProps<{
  meal: Meal;
}>();

const visible = defineModel<boolean>("visible", { required: true });

const emit = defineEmits<{
  edit: [meal: Meal];
}>();
</script>

<template>
  <Drawer
    v-model:visible="visible"
    position="bottom"
    :show-close-icon="false"
    :block-scroll="true"
    class="!rounded-t-2xl !h-auto max-h-4/5"
  >
    <template #header>
      <div class="flex items-center gap-3 w-full">
        <img
          :src="meal.imageUrl || emptyPlateImg"
          :alt="meal.name"
          class="w-12 h-12 rounded-lg object-cover shrink-0"
        />
        <div class="flex-1 min-w-0">
          <h2 class="text-base font-semibold leading-tight truncate">{{ meal.name }}</h2>
          <p class="text-xs text-surface-400 mt-0.5">
            {{ meal.defaultServings }} servings · {{ meal.ingredients.length }} ingredients
            <template v-if="meal.recipe?.prepTime || meal.recipe?.cookTime">
              · {{ (meal.recipe.prepTime ?? 0) + (meal.recipe.cookTime ?? 0) }} min
            </template>
          </p>
        </div>
        <Button
          icon="pi pi-pencil"
          text
          rounded
          severity="secondary"
          size="small"
          @click="emit('edit', meal)"
        />
        <Button
          icon="pi pi-times"
          text
          rounded
          severity="secondary"
          size="small"
          @click="visible = false"
        />
      </div>
    </template>

    <div class="flex flex-col gap-6 pb-6">
      <!-- Ingredients -->
      <section>
        <h3 class="text-sm font-semibold uppercase tracking-wide text-surface-400 mb-3">
          Ingredients
        </h3>
        <ul class="flex flex-col gap-2">
          <li
            v-for="ingredient in meal.ingredients"
            :key="ingredient.id"
            class="flex justify-between items-center text-sm"
          >
            <span>{{ ingredient.name }}</span>
            <span class="text-surface-400">{{ ingredient.quantity }} {{ ingredient.unit }}</span>
          </li>
        </ul>
        <p v-if="!meal.ingredients.length" class="text-sm text-surface-400 italic">
          No ingredients listed.
        </p>
      </section>

      <!-- Steps -->
      <section v-if="meal.recipe?.steps?.length">
        <h3 class="text-sm font-semibold uppercase tracking-wide text-surface-400 mb-3">
          Instructions
        </h3>
        <ol class="flex flex-col gap-4">
          <li
            v-for="(step, index) in meal.recipe.steps"
            :key="index"
            class="flex gap-3 text-sm"
          >
            <span class="shrink-0 w-6 h-6 rounded-full bg-primary text-primary-contrast text-xs font-bold flex items-center justify-center">
              {{ index + 1 }}
            </span>
            <p class="leading-relaxed">{{ step }}</p>
          </li>
        </ol>
      </section>
      <p v-else class="text-sm text-surface-400 italic">No instructions added yet.</p>
    </div>
  </Drawer>
</template>
