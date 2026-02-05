<script setup lang="ts">
import { ref, computed } from "vue";
import { useAuthStore } from "@/stores/auth";
import { useMealsQuery } from "@/api/meals";
import { useCalendarQuery } from "@/api/calendar";
import { useFamilySync } from "@/composables/useFamilySync";
import { familyService } from "@/services/familyService";
import FamilySetupDialog from "@/components/FamilySetupDialog.vue";
import { useGetCurrentFamily } from "@/api/families";

const { data: family } = useGetCurrentFamily();

const { hasFamily, familyCode } = useAuthStore();

const { isFetching: isFetchingMeals, isError: mealsError } = useMealsQuery();
const { isFetching: isFetchingCalendar, isError: calendarError } =
  useCalendarQuery();
const { onFamilyLeft } = useFamilySync();

const showToast = ref(false);
const confirmDialog = ref<HTMLDialogElement | null>(null);

const isSyncing = computed(
  () => isFetchingMeals.value || isFetchingCalendar.value,
);
const hasError = computed(() => mealsError.value || calendarError.value);

const syncStatusClass = computed(() => {
  if (isSyncing.value) return "syncing";
  if (hasError.value) return "error";
  return "synced";
});

const syncStatusText = computed(() => {
  if (isSyncing.value) return "Syncing...";
  if (hasError.value) return "Error syncing data";
  return "Synced";
});

const copyFamilyCode = async () => {
  try {
    await navigator.clipboard.writeText(familyCode || "");
    showToast.value = true;
    setTimeout(() => {
      showToast.value = false;
    }, 3000);
  } catch (error) {
    console.error("Failed to copy:", error);
  }
};

const handleLeaveFamily = () => confirmDialog.value?.showModal();

const closeConfirmDialog = () => confirmDialog.value?.close();

const confirmLeaveFamily = async () => {
  try {
    // Leave family on Supabase
    await familyService.leaveFamily();

    // Clear TanStack Query cache and auth state
    onFamilyLeft();

    closeConfirmDialog();

    // Reload page to show family setup dialog
    window.location.reload();
  } catch (error) {
    console.error("Error leaving family:", error);
    alert("Failed to leave family. Please try again.");
  }
};

const familySetupDialogVisible = ref(false);
</script>

<!-- 
TODO: 
- enable click on family code to open dropdown with 
  - copy code 
  - leave family 
-->

<template>
  <div>
    <Button
      v-if="!family"
      label="Create or join family"
      outlined
      @click="familySetupDialogVisible = true"
    />
    <p class="bg-accent px-4 py-1 rounded" v-else>{{ family.code }}</p>

    <FamilySetupDialog
      v-if="familySetupDialogVisible"
      @close="familySetupDialogVisible = false"
    />
  </div>
</template>
