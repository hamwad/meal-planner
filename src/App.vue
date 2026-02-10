<script setup lang="ts">
import { RouterView } from "vue-router";
import { VueQueryDevtools } from "@tanstack/vue-query-devtools";
import { useAuthStore } from "./stores/auth";
import FamilySetupDialog from "@/components/FamilySetupDialog.vue";
import Auth from "./pages/auth.vue";

const authStore = useAuthStore();

// Show family setup dialog when authenticated but no family
const showRequiredFamilySetup = computed(
  () =>
    authStore.isAuthenticated &&
    authStore.isInitialized &&
    !authStore.activeFamilyId,
);

// Show main app when authenticated with active family
const showMainApp = computed(
  () =>
    authStore.isAuthenticated &&
    authStore.isInitialized &&
    authStore.activeFamilyId,
);

// Show auth page when not authenticated
const showAuth = computed(
  () => !authStore.isAuthenticated && authStore.isInitialized,
);

onMounted(async () => {
  await authStore.initialize();
});
</script>

<template>
  <div class="app-wrapper h-screen overflow-hidden">
    <!-- Loading state -->
    <div
      v-if="!authStore.isInitialized"
      class="flex items-center justify-center h-screen"
    >
      <div class="text-center">
        <ProgressSpinner />
        <p class="mt-4">Initializing...</p>
      </div>
    </div>

    <!-- Required family setup (authenticated but no family) -->
    <div
      v-else-if="showRequiredFamilySetup"
      class="flex items-center justify-center h-screen"
    >
      <FamilySetupDialog :required="true" />
    </div>

    <!-- Main app -->
    <RouterView v-else-if="showMainApp" />

    <!-- Auth page -->
    <Auth v-else-if="showAuth" />

    <!-- Fallback - should be handled by router guards -->
    <div v-else class="flex items-center justify-center h-screen">
      <p>Redirecting...</p>
    </div>
  </div>
  <VueQueryDevtools button-position="bottom-left" />
</template>
