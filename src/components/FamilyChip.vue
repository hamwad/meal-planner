<script setup lang="ts">
import { useAuthStore } from "@/stores/auth";

const authStore = useAuthStore();
const popoverRef = ref();

const isMultiFamily = computed(() => authStore.families.length > 1);

const { copy, copied } = useClipboard({
  source: computed(() => authStore.activeFamilyCode ?? ""),
});

const handleChipClick = (event: Event) => {
  if (isMultiFamily.value) {
    popoverRef.value?.toggle(event);
  } else {
    copy(authStore.activeFamilyCode ?? "");
  }
};

const switchFamily = (familyId: string) => {
  authStore.setActiveFamily(familyId);
  popoverRef.value?.hide();
};

const copyFamilyCode = (code: string, event: Event) => {
  event.stopPropagation();
  copy(code);
};
</script>

<template>
  <div
    v-if="authStore.hasAnyFamily"
    class="family-chip"
    @click="handleChipClick"
  >
    <span class="font-mono text-sm">{{ authStore.activeFamilyCode }}</span>
    <i v-if="copied && !isMultiFamily" class="pi pi-check text-xs" />
    <i v-else-if="isMultiFamily" class="pi pi-chevron-down text-xs" />
    <i v-else class="pi pi-copy text-xs" />
  </div>

  <Popover v-if="isMultiFamily" ref="popoverRef">
    <div class="flex flex-col gap-1 min-w-48">
      <div
        v-for="family in authStore.families"
        :key="family.id"
        class="flex items-center justify-between px-3 py-2 rounded cursor-pointer hover:bg-surface-100 dark:hover:bg-surface-700"
        :class="{
          'bg-surface-100 dark:bg-surface-700':
            family.id === authStore.activeFamilyId,
        }"
        @click="switchFamily(family.id)"
      >
        <span class="font-mono text-sm">{{ family.code }}</span>
        <Button
          icon="pi pi-copy"
          text
          rounded
          size="small"
          @click="copyFamilyCode(family.code, $event)"
          v-tooltip.left="'Copy code'"
        />
      </div>
    </div>
  </Popover>
</template>

<style scoped>
.family-chip {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.375rem 0.75rem;
  border-radius: 1rem;
  background: var(--p-surface-100);
  cursor: pointer;
  user-select: none;
  transition: background 0.2s;
}

.family-chip:hover {
  background: var(--p-surface-200);
}

:root.p-dark .family-chip {
  background: var(--p-surface-700);
}

:root.p-dark .family-chip:hover {
  background: var(--p-surface-600);
}
</style>
