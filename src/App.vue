<template>
  <div class="app-container">
    <Planner @edit-meal="handleEditMeal" @open-library="openLibrary" />
    <ShoppingList />
    <MealLibraryDialog ref="libraryDialogRef" />
  </div>
</template>

<script setup lang="ts">
import { ref } from "vue";
import type { Meal } from "./types";
import MealLibraryDialog from "./components/MealLibrary/MealLibraryDialog.vue";
import Planner from "./components/Planner/Planner.vue";
import ShoppingList from "./components/ShoppingList/ShoppingList.vue";

const libraryDialogRef = ref<InstanceType<typeof MealLibraryDialog> | null>(null);

const handleEditMeal = (meal: Meal) => {
  // Open the library dialog in edit mode
  openLibrary();
  // Give the dialog time to open, then trigger edit
  setTimeout(() => {
    libraryDialogRef.value?.editMeal?.(meal);
  }, 100);
};

const openLibrary = () => {
  libraryDialogRef.value?.openDialog();
};
</script>

<style scoped>
.app-container {
  display: grid;
  grid-template-columns: 1fr 350px;
  height: 100vh;
  gap: 0;
}

.app-container > * {
  overflow: hidden;
}
</style>
