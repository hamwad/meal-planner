<script setup lang="ts">
const mealLibraryDialogVisible = ref(false);
// const showShoppingList = ref(true);
const shoppingListVisible = ref(true);
</script>

<template>
  <div class="flex flex-col gap-8">
    <header class="flex justify-between">
      <h1 class="app-title">Meal Planner</h1>
      <FamilyBadge />
    </header>
    <main class="relative">
      <div class="flex gap-8">
        <Planner @open-library="mealLibraryDialogVisible = true" />
        <ShoppingList v-if="shoppingListVisible" />

        <!-- Floating button to show shopping list when hidden -->
        <!-- <Button
          v-if="!showShoppingList"
          icon="pi pi-list"
          rounded
          severity="secondary"
          class="fixed top-6 right-6 shadow-lg bg-red-200 z-50"
          @click="showShoppingList = true"
        /> -->
      </div>
      <MealLibraryDialog
        v-if="mealLibraryDialogVisible"
        @close="mealLibraryDialogVisible = false"
      />
    </main>
  </div>
</template>
