<script setup lang="ts">
import type { Meal } from "@/types";

const props = defineProps<{
  meal?: Meal;
}>();

const emit = defineEmits(["close", "confirm"]);

const visible = ref(true);
</script>

<template>
  <Dialog
    :visible="visible"
    modal
    :header="`Delete ${meal?.name ?? 'meal'}?`"
    class="w-200"
    closasble
    @update:visible="$emit('close')"
    @after-hide="$emit('close')"
  >
    <template #header>
      <h3 class="text-lg font-semibold truncate">
        Delete {{ meal?.name ?? "meal" }}?
      </h3>
    </template>
    <p>
      Are you sure you want to delete this meal? This action cannot be undone.
    </p>
    <template #footer>
      <div class="flex gap-4">
        <Button label="Cancel" outlined @click="$emit('close')" />
        <Button label="Delete" @click="$emit('confirm')" />
      </div>
    </template>
  </Dialog>
</template>
