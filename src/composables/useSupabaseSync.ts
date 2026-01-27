import { ref, onUnmounted } from 'vue';
import { supabase, isSupabaseConfigured } from '@/services/supabase';
import { useAuthStore } from '@/stores/auth';
import { useSyncStore } from '@/stores/sync';
import { useMealsStore } from '@/stores/meals';
import { useCalendarStore } from '@/stores/calendar';

const SYNC_INTERVAL = 10000; // 10 seconds

export function useSupabaseSync() {
  const authStore = useAuthStore();
  const syncStore = useSyncStore();
  const mealsStore = useMealsStore();
  const calendarStore = useCalendarStore();

  const intervalId = ref<number | null>(null);

  /**
   * Sync meals from Supabase
   */
  const syncMeals = async () => {
    if (!isSupabaseConfigured() || !authStore.familyId) {
      return;
    }

    try {
      const { data, error } = await supabase
        .from('meals')
        .select('*')
        .eq('family_id', authStore.familyId);

      if (error) throw error;

      // Merge meals into store
      if (data) {
        mealsStore.mergeMealsFromSupabase(data);
      }
    } catch (error) {
      console.error('Error syncing meals:', error);
      throw error;
    }
  };

  /**
   * Sync calendar from Supabase
   */
  const syncCalendar = async () => {
    if (!isSupabaseConfigured() || !authStore.familyId) {
      return;
    }

    try {
      const { data, error } = await supabase
        .from('calendar_meals')
        .select('*')
        .eq('family_id', authStore.familyId);

      if (error) throw error;

      // Merge calendar into store
      if (data) {
        calendarStore.mergeCalendarFromSupabase(data);
      }
    } catch (error) {
      console.error('Error syncing calendar:', error);
      throw error;
    }
  };

  /**
   * Perform full sync
   */
  const sync = async () => {
    if (!isSupabaseConfigured() || !authStore.familyId) {
      syncStore.setOffline();
      return;
    }

    try {
      syncStore.setSyncing();
      await Promise.all([syncMeals(), syncCalendar()]);
      syncStore.setSynced();
    } catch (error: any) {
      console.error('Sync error:', error);
      syncStore.setError(error.message || 'Sync failed');
    }
  };

  /**
   * Start periodic sync
   */
  const startSync = () => {
    if (!isSupabaseConfigured() || !authStore.familyId) {
      return;
    }

    // Do initial sync
    sync();

    // Start polling every 10 seconds
    intervalId.value = window.setInterval(() => {
      sync();
    }, SYNC_INTERVAL);
  };

  /**
   * Stop periodic sync
   */
  const stopSync = () => {
    if (intervalId.value !== null) {
      clearInterval(intervalId.value);
      intervalId.value = null;
    }
  };

  // Cleanup on unmount
  onUnmounted(() => {
    stopSync();
  });

  return {
    sync,
    syncMeals,
    syncCalendar,
    startSync,
    stopSync,
  };
}
