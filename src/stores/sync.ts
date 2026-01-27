import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import type { SyncStatus } from '@/types';

export const useSyncStore = defineStore('sync', () => {
  const status = ref<SyncStatus>('offline');
  const lastSyncedAt = ref<Date | null>(null);
  const error = ref<string | null>(null);

  const setSyncing = () => {
    status.value = 'syncing';
    error.value = null;
  };

  const setSynced = () => {
    status.value = 'synced';
    lastSyncedAt.value = new Date();
    error.value = null;
  };

  const setOffline = () => {
    status.value = 'offline';
    error.value = null;
  };

  const setError = (errorMessage: string) => {
    status.value = 'error';
    error.value = errorMessage;
  };

  const isSynced = computed(() => status.value === 'synced');
  const isSyncing = computed(() => status.value === 'syncing');
  const isOffline = computed(() => status.value === 'offline');
  const hasError = computed(() => status.value === 'error');

  return {
    status,
    lastSyncedAt,
    error,
    setSyncing,
    setSynced,
    setOffline,
    setError,
    isSynced,
    isSyncing,
    isOffline,
    hasError,
  };
});
