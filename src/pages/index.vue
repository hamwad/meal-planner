<script setup lang="ts">
const props = defineProps<{ shoppingListVisible?: boolean }>();
</script>

<template>
  <div class="px-2 md:px-12 pb-24 md:pb-12">
    <div class="flex flex-col md:flex-row flex-1 gap-12 h-full">
      <Planner class="flex-1 min-w-0 h-full" />
      <ShoppingList
        v-if="props.shoppingListVisible !== false"
        class="hidden md:block w-88 h-full"
      />
    </div>
  </div>
</template>
