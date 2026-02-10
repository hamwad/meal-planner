import { ref } from 'vue';

const draggedMealId = ref<string | null>(null);
const draggedFromDate = ref<string | null>(null);

export function useDragAndDrop() {
  const startDrag = (mealId: string, fromDate: string) => {
    draggedMealId.value = mealId;
    draggedFromDate.value = fromDate;
  };

  const endDrag = () => {
    draggedMealId.value = null;
    draggedFromDate.value = null;
  };

  const getDraggedMealId = () => {
    return draggedMealId.value;
  };

  const getDraggedFromDate = () => {
    return draggedFromDate.value;
  };

  return {
    draggedMealId,
    draggedFromDate,
    startDrag,
    endDrag,
    getDraggedMealId,
    getDraggedFromDate,
  };
}
