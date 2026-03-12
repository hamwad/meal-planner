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
    <main
      class="flex-1 overflow-y-auto px-2 md:px-12 pt-2 md:pt-12 pb-24 md:pb-12"
    >
      <RouterView :shopping-list-visible="shoppingListVisible" />
    </main>
    <BottomNav class="md:hidden" />
  </div>
</template>
