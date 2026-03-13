<script setup lang="ts">
import { useWeekStore } from "@/stores/week";

const isMobile = useIsMobile();
const weekStore = useWeekStore();

const props = defineProps<{ shoppingListVisible?: boolean }>();

onMounted(() => {
  weekStore.goToCurrentWeek();
});
</script>

<template>
  <div class="flex flex-col md:flex-row flex-1 gap-12 h-full">
    <Planner class="flex-1 min-w-0 h-full" />
    <ShoppingList
      v-if="!isMobile && props.shoppingListVisible !== false"
      class="hidden md:block w-88 h-full"
    />
  </div>
</template>
