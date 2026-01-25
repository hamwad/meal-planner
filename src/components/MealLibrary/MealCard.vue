<template>
  <div
    class="card bg-base-100 shadow-md hover:shadow-lg transition-shadow relative group"
    draggable="true"
    @dragstart="handleDragStart"
    @dragend="handleDragEnd"
  >
    <div class="card-body p-4">
      <div class="flex justify-between items-start">
        <h3 class="card-title text-base flex-1">{{ meal.name }}</h3>
        <button
          class="btn btn-ghost btn-xs btn-circle opacity-0 group-hover:opacity-100 transition-opacity"
          @click.stop="handleEdit"
          title="Edit meal"
        >
          ✏️
        </button>
      </div>
      <div class="text-sm text-base-content/70">
        <p>{{ meal.defaultServings }} servings</p>
        <p>{{ meal.ingredients.length }} ingredients</p>
      </div>
      <div v-if="meal.tags && meal.tags.length" class="flex flex-wrap gap-1 mt-2">
        <span
          v-for="tag in meal.tags"
          :key="tag"
          class="badge badge-sm badge-primary"
        >
          {{ tag }}
        </span>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { Meal } from '@/types';
import { useDragAndDrop } from '@/composables/useDragAndDrop';

const props = defineProps<{
  meal: Meal;
}>();

const emit = defineEmits<{
  edit: [meal: Meal];
}>();

const { startDrag, endDrag } = useDragAndDrop();

const handleDragStart = (event: DragEvent) => {
  startDrag(props.meal.id);
  if (event.dataTransfer) {
    event.dataTransfer.effectAllowed = 'copy';
  }
};

const handleDragEnd = () => {
  endDrag();
};

const handleEdit = () => {
  emit('edit', props.meal);
};
</script>
