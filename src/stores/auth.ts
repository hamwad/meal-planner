import { defineStore } from "pinia";
import { supabase } from "@/services/supabase";
import { familyService } from "@/services/familyService";
import type { Family } from "@/types";

export const useAuthStore = defineStore("auth", () => {
  const userId = ref<string | null>(null);
  const familyId = ref<string | null>(null);
  const familyCode = ref<string | null>(null);
  const isAuthenticated = ref(false);
  const isInitialized = ref(false);

  /**
   * Initialize authentication
   */
  const initialize = async () => {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (user) {
        userId.value = user.id;
        isAuthenticated.value = true;

        // Get or create family for user
        let { family } = await familyService.getCurrentFamily();

        // If user doesn't have a family, auto-create a personal one
        if (!family) {
          const result = await familyService.createFamily();
          if (result.error) {
            console.error("Error creating family:", result.error);
          } else {
            family = result.family;
          }
        }

        if (family) {
          setFamily(family);
        }
      } else {
        await signInAnonymously();
      }
    } catch (error) {
      console.error("Error initializing auth:", error);
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

        // Auto-create a personal family for the new user
        const result = await familyService.createFamily();
        if (result.error) {
          console.error("Error creating family:", result.error);
        } else if (result.family) {
          setFamily(result.family);
        }
      }
    } catch (error) {
      console.error("Error signing in anonymously:", error);
      throw error;
    }
  };

  /**
   * Set current family
   */
  const setFamily = (family: Family) => {
    familyId.value = family.id;
    familyCode.value = family.code;
  };

  /**
   * Clear family (when leaving)
   */
  const clearFamily = () => {
    familyId.value = null;
    familyCode.value = null;
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
