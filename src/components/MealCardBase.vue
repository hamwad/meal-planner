<script setup lang="ts">
import type { Meal } from "@/types";
import emptyPlateImg from "@/assets/images/empty_plate.jpg";

const props = defineProps<{
  meal?: Meal;
  draggable?: boolean;
  servingsOverride?: number;
}>();

defineEmits<{
  dragstart: [event: DragEvent];
  dragend: [event: DragEvent];
  click: [];
}>();

const servings = computed(() => {
  return props.servingsOverride ?? props.meal?.defaultServings ?? 0;
});
</script>

<template>
  <Card
    :draggable="draggable ? 'true' : undefined"
    @dragstart="$emit('dragstart', $event)"
    @dragend="$emit('dragend', $event)"
    @click="$emit('click')"
    class="w-full overflow-hidden group mb-4 flex flex-col border border-gray-200 hover:border-gray-400"
    :pt="{ body: 'flex flex-col flex-1', content: 'flex-1' }"
  >
    <template #header>
      <div class="relative overflow-hidden">
        <img
          :src="meal?.imageUrl || emptyPlateImg"
          :alt="meal?.name || 'Empty plate'"
          class="w-full h-36 object-cover"
        />
        <div
          v-if="$slots['header-actions']"
          class="absolute bottom-0 left-0 right-0 flex justify-end items-center px-2 py-1 bg-black/50 translate-y-full group-hover:translate-y-0 transition-transform duration-200"
          @click.stop
        >
          <slot name="header-actions" />
        </div>
      </div>
    </template>
    <template v-if="meal" #title>
      <p class="text-sm line-clamp-2">
        {{ meal.name }}
      </p>
    </template>
    <template #content>
      <template v-if="meal">
        <div class="flex flex-col mb-2">
          <p class="text-xs">{{ servings }} servings</p>
          <p class="text-xs">{{ meal.ingredients.length }} ingredients</p>
        </div>
        <Tag
          v-for="(tag, index) in meal.tags?.slice(0, 3)"
          :key="index"
          class="mr-1 mb-1"
          pill
          severity="info"
        >
          <p class="text-[0.66rem] font-light">{{ tag.toLowerCase() }}</p>
        </Tag>
      </template>
      <slot v-else />
    </template>
    <template v-if="$slots.footer" #footer>
      <slot name="footer" />
    </template>
  </Card>
</template>
