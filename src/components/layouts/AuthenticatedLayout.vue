<script setup lang="ts">
const shoppingListVisible = ref(true);
</script>

<template>
  <div class="h-screen flex flex-col overflow-hidden">
    <TopNav
      class="hidden md:flex"
      @show-shopping-list="shoppingListVisible = $event"
    />
    <MobileHeader class="md:hidden" />
    <main class="flex-1 overflow-y-auto">
      <RouterView :shopping-list-visible="shoppingListVisible" />
    </main>
    <BottomNav class="md:hidden" />
  </div>
</template>
