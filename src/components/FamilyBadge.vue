<template>
  <div v-if="authStore.hasFamily()" class="family-badge">
    <div class="dropdown dropdown-end">
      <div tabindex="0" role="button" class="badge-container">
        <div class="family-info">
          <span class="family-label">Family:</span>
          <span class="family-code">{{ authStore.familyCode }}</span>
        </div>
        <div class="sync-indicator" :class="syncStatusClass" :title="syncStatusText">
          <div v-if="syncStore.isSyncing" class="loading loading-spinner loading-xs"></div>
          <div v-else class="status-dot"></div>
        </div>
      </div>
      <ul tabindex="0" class="dropdown-content menu bg-base-100 rounded-box z-[1] w-52 p-2 shadow">
        <li>
          <a @click="copyFamilyCode">
            <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
            </svg>
            Copy Family Code
          </a>
        </li>
        <li>
          <a @click="handleLeaveFamily" class="text-error">
            <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
            </svg>
            Leave Family
          </a>
        </li>
      </ul>
    </div>

    <!-- Toast notification -->
    <div v-if="showToast" class="toast toast-top toast-center">
      <div class="alert alert-success">
        <span>Family code copied to clipboard!</span>
      </div>
    </div>

    <!-- Leave confirmation dialog -->
    <dialog ref="confirmDialog" class="modal">
      <div class="modal-box">
        <h3 class="font-bold text-lg">Leave Family?</h3>
        <p class="py-4">
          Are you sure you want to leave this family? You will lose access to all shared meals and calendar entries.
        </p>
        <div class="modal-action">
          <button class="btn" @click="closeConfirmDialog">Cancel</button>
          <button class="btn btn-error" @click="confirmLeaveFamily">Leave Family</button>
        </div>
      </div>
      <form method="dialog" class="modal-backdrop">
        <button @click="closeConfirmDialog">close</button>
      </form>
    </dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue';
import { useAuthStore } from '@/stores/auth';
import { useSyncStore } from '@/stores/sync';
import { useMealsStore } from '@/stores/meals';
import { useCalendarStore } from '@/stores/calendar';
import { familyService } from '@/services/familyService';

const authStore = useAuthStore();
const syncStore = useSyncStore();
const mealsStore = useMealsStore();
const calendarStore = useCalendarStore();

const showToast = ref(false);
const confirmDialog = ref<HTMLDialogElement | null>(null);

const syncStatusClass = computed(() => {
  if (syncStore.isSyncing) return 'syncing';
  if (syncStore.isSynced) return 'synced';
  if (syncStore.hasError) return 'error';
  return 'offline';
});

const syncStatusText = computed(() => {
  if (syncStore.isSyncing) return 'Syncing...';
  if (syncStore.isSynced) return 'Synced';
  if (syncStore.hasError) return `Error: ${syncStore.error}`;
  return 'Offline';
});

const copyFamilyCode = async () => {
  try {
    await navigator.clipboard.writeText(authStore.familyCode || '');
    showToast.value = true;
    setTimeout(() => {
      showToast.value = false;
    }, 3000);
  } catch (error) {
    console.error('Failed to copy:', error);
  }
};

const handleLeaveFamily = () => {
  confirmDialog.value?.showModal();
};

const closeConfirmDialog = () => {
  confirmDialog.value?.close();
};

const confirmLeaveFamily = async () => {
  try {
    // Leave family on Supabase
    await familyService.leaveFamily();

    // Clear local state
    authStore.clearFamily();
    mealsStore.clearMeals();
    calendarStore.clearCalendar();

    closeConfirmDialog();

    // Reload page to show family setup dialog
    window.location.reload();
  } catch (error) {
    console.error('Error leaving family:', error);
    alert('Failed to leave family. Please try again.');
  }
};
</script>

<style scoped>
.family-badge {
  position: relative;
}

.badge-container {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.5rem 1rem;
  background-color: hsl(var(--b2));
  border-radius: 0.5rem;
  cursor: pointer;
  transition: background-color 0.2s;
}

.badge-container:hover {
  background-color: hsl(var(--b3));
}

.family-info {
  display: flex;
  align-items: center;
  gap: 0.25rem;
  font-size: 0.875rem;
}

.family-label {
  color: hsl(var(--bc) / 0.6);
}

.family-code {
  font-weight: 600;
  color: hsl(var(--bc));
  font-family: monospace;
}

.sync-indicator {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 1rem;
  height: 1rem;
}

.status-dot {
  width: 0.5rem;
  height: 0.5rem;
  border-radius: 50%;
}

.sync-indicator.synced .status-dot {
  background-color: hsl(var(--su));
}

.sync-indicator.offline .status-dot {
  background-color: hsl(var(--bc) / 0.3);
}

.sync-indicator.error .status-dot {
  background-color: hsl(var(--er));
}

.toast {
  z-index: 9999;
}
</style>
