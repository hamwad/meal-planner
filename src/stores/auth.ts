import { defineStore } from 'pinia';
import { ref } from 'vue';
import { supabase, isSupabaseConfigured } from '@/services/supabase';
import { familyService } from '@/services/familyService';
import type { Family } from '@/types';

const FAMILY_CODE_KEY = 'meal-planner-family-code';
const FAMILY_ID_KEY = 'meal-planner-family-id';

export const useAuthStore = defineStore('auth', () => {
  const userId = ref<string | null>(null);
  const familyId = ref<string | null>(null);
  const familyCode = ref<string | null>(null);
  const isAuthenticated = ref(false);
  const isInitialized = ref(false);

  /**
   * Initialize authentication
   */
  const initialize = async () => {
    if (!isSupabaseConfigured()) {
      isInitialized.value = true;
      return;
    }

    try {
      // Check if user is already authenticated
      const { data: { user } } = await supabase.auth.getUser();

      if (user) {
        userId.value = user.id;
        isAuthenticated.value = true;

        // Load family info from localStorage
        const storedFamilyCode = localStorage.getItem(FAMILY_CODE_KEY);
        const storedFamilyId = localStorage.getItem(FAMILY_ID_KEY);

        if (storedFamilyCode && storedFamilyId) {
          familyCode.value = storedFamilyCode;
          familyId.value = storedFamilyId;
        } else {
          // Try to get family from Supabase
          const { family } = await familyService.getCurrentFamily();
          if (family) {
            setFamily(family);
          }
        }
      } else {
        // Sign in anonymously
        await signInAnonymously();
      }
    } catch (error) {
      console.error('Error initializing auth:', error);
    } finally {
      isInitialized.value = true;
    }
  };

  /**
   * Sign in anonymously
   */
  const signInAnonymously = async () => {
    try {
      const { data, error } = await supabase.auth.signInAnonymously();

      if (error) throw error;

      if (data.user) {
        userId.value = data.user.id;
        isAuthenticated.value = true;
      }
    } catch (error) {
      console.error('Error signing in anonymously:', error);
      throw error;
    }
  };

  /**
   * Set current family
   */
  const setFamily = (family: Family) => {
    familyId.value = family.id;
    familyCode.value = family.code;

    // Persist to localStorage
    localStorage.setItem(FAMILY_CODE_KEY, family.code);
    localStorage.setItem(FAMILY_ID_KEY, family.id);
  };

  /**
   * Clear family (when leaving)
   */
  const clearFamily = () => {
    familyId.value = null;
    familyCode.value = null;

    localStorage.removeItem(FAMILY_CODE_KEY);
    localStorage.removeItem(FAMILY_ID_KEY);
  };

  /**
   * Check if user is in a family
   */
  const hasFamily = () => {
    return Boolean(familyId.value && familyCode.value);
  };

  return {
    userId,
    familyId,
    familyCode,
    isAuthenticated,
    isInitialized,
    initialize,
    signInAnonymously,
    setFamily,
    clearFamily,
    hasFamily,
  };
});
