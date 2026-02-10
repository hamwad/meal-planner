<script setup lang="ts">
const shoppingListVisible = ref(true);
</script>

<template>
  <div class="h-screen flex flex-col overflow-x-hidden overflow-y-auto">
    <TopNav @show-shopping-list="shoppingListVisible = $event" />
    <main class="px-12 min-h-225 mb-12">
      <div class="flex flex-1 gap-12 h-full">
        <Planner class="flex-1 min-w-0 h-full" />
        <ShoppingList v-if="shoppingListVisible" class="w-88 h-full" />
      </div>
    </main>
    <footer
      class="shrink-0 h-24 p-4 text-center text-sm text-gray-500 bg-green-500/30"
    >
      &copy; {{ new Date().getFullYear() }} Meal Planner. All rights reserved.
    </footer>
  </div>
</template>
