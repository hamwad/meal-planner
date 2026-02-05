<script setup lang="ts">
import { RouterView } from "vue-router";
import { VueQueryDevtools } from "@tanstack/vue-query-devtools";
import { useAuthStore } from "./stores/auth";

const authStore = useAuthStore();

onMounted(async () => {
  await authStore.initialize();
});
</script>

<template>
  <div class="app-wrapper">
    <RouterView v-if="authStore.isAuthenticated && authStore.isInitialized && authStore.familyId" />
    <div v-else-if="!authStore.isInitialized" class="flex items-center justify-center h-screen">
      <div class="text-center">
        <div class="loading loading-spinner loading-lg"></div>
        <p class="mt-4">Initializing...</p>
      </div>
    </div>
    <div v-else class="flex items-center justify-center h-screen">
      <p>Authentication failed. Please refresh the page.</p>
    </div>

    <!-- Main Content -->
    <!-- <div class="app-container">
      <Planner @edit-meal="handleEditMeal" @open-library="openLibrary" />
      <ShoppingList />
      <MealLibraryDialog ref="libraryDialogRef" />
    </div> -->

    <!-- Family Setup Dialog -->
    <!-- <FamilySetup
      ref="familySetupRef"
      @family-created="handleFamilyCreated"
      @family-joined="handleFamilyJoined"
    /> -->
  </div>
  <VueQueryDevtools button-position="bottom-left" />
</template>
