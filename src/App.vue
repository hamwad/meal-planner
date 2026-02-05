<template>
  <div class="app-wrapper">
    <!-- Header with Family Badge -->
    <header class="app-header">
      <h1 class="app-title">Meal Planner!</h1>
      <FamilyBadge />
    </header>

    <!-- Main Content -->
    <div class="app-container">
      <Planner @edit-meal="handleEditMeal" @open-library="openLibrary" />
      <ShoppingList />
      <MealLibraryDialog ref="libraryDialogRef" />
    </div>

    <!-- Family Setup Dialog -->
    <FamilySetup
      ref="familySetupRef"
      @family-created="handleFamilyCreated"
      @family-joined="handleFamilyJoined"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from "vue";
import type { Meal } from "./types";
import MealLibraryDialog from "./components/MealLibrary/MealLibraryDialog.vue";
import Planner from "./components/Planner/Planner.vue";
import ShoppingList from "./components/ShoppingList/ShoppingList.vue";
import FamilyBadge from "./components/FamilyBadge.vue";
import FamilySetup from "./components/FamilySetup.vue";
import { useAuthStore } from "./stores/auth";
import { useSupabaseSync } from "./composables/useSupabaseSync";
import { isSupabaseConfigured } from "./services/supabase";

const libraryDialogRef = ref<InstanceType<typeof MealLibraryDialog> | null>(
  null,
);
const familySetupRef = ref<InstanceType<typeof FamilySetup> | null>(null);

const authStore = useAuthStore();
const { startSync } = useSupabaseSync();

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

const handleFamilyCreated = () => {
  // Start syncing after family is created
  startSync();
};

const handleFamilyJoined = () => {
  // Start syncing after joining family
  startSync();
};

onMounted(async () => {
  // Initialize authentication
  await authStore.initialize();

  // If Supabase is configured and auth is initialized
  if (
    isSupabaseConfigured() &&
    authStore.isInitialized &&
    authStore.isAuthenticated
  ) {
    if (!authStore.hasFamily()) {
      // Show family setup dialog if user is not in a family
      setTimeout(() => {
        familySetupRef.value?.openDialog();
      }, 500);
    } else {
      // Start syncing if user is in a family
      startSync();
    }
  }
});
</script>

<style scoped>
.app-wrapper {
  height: 100vh;
  display: flex;
  flex-direction: column;
}

.app-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 1rem 2rem;
  background-color: hsl(var(--b1));
  border-bottom: 1px solid hsl(var(--b3));
}

.app-title {
  font-size: 1.5rem;
  font-weight: 700;
  color: hsl(var(--bc));
}

.app-container {
  display: grid;
  grid-template-columns: 1fr 350px;
  flex: 1;
  gap: 0;
  overflow: hidden;
}

.app-container > * {
  overflow: hidden;
}
</style>
