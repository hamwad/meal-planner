import { ref } from 'vue';

const draggedMealId = ref<string | null>(null);

export function useDragAndDrop() {
  const startDrag = (mealId: string) => {
    draggedMealId.value = mealId;
  };

  const endDrag = () => {
    draggedMealId.value = null;
  };

  const getDraggedMealId = () => {
    return draggedMealId.value;
  };

  return {
    draggedMealId,
    startDrag,
    endDrag,
    getDraggedMealId,
  };
}
