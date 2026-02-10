import { defineStore } from "pinia";
import { supabase } from "@/services/supabase";
import type { Family, FamilyWithMembership } from "@/types";

const LAST_ACTIVE_FAMILY_KEY = "meal-planner-last-active-family";

export const useAuthStore = defineStore("auth", () => {
  // User state
  const userId = ref<string | null>(null);
  const userEmail = ref<string | null>(null);
  const isAuthenticated = ref(false);
  const isInitialized = ref(false);

  // Multi-family state
  const families = ref<FamilyWithMembership[]>([]);
  const activeFamilyId = ref<string | null>(null);

  // Computed
  const activeFamilyCode = computed(() => {
    const family = families.value.find((f) => f.id === activeFamilyId.value);
    return family?.code ?? null;
  });

  const activeFamily = computed(
    () => families.value.find((f) => f.id === activeFamilyId.value) ?? null,
  );

  const hasAnyFamily = computed(() => families.value.length > 0);

  /**
   * Load all families the user belongs to
   */
  const loadUserFamilies = async (): Promise<FamilyWithMembership[]> => {
    if (!userId.value) return [];

    const { data, error } = await supabase
      .from("family_members")
      .select(
        `
        family_id,
        joined_at,
        families (
          id,
          code,
          created_at
        )
      `,
      )
      .eq("user_id", userId.value);

    if (error) {
      console.error("Error loading families:", error);
      return [];
    }

    return (data || []).map((row: any) => ({
      id: row.families.id,
      code: row.families.code,
      created_at: row.families.created_at,
      joinedAt: row.joined_at,
    }));
  };

  /**
   * Initialize authentication - check existing session and load families
   */
  const initialize = async () => {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (user) {
        userId.value = user.id;
        userEmail.value = user.email ?? null;
        isAuthenticated.value = true;

        // Load user's families
        families.value = await loadUserFamilies();

        // Restore last active family from localStorage
        const lastActiveFamilyId = localStorage.getItem(LAST_ACTIVE_FAMILY_KEY);
        if (
          lastActiveFamilyId &&
          families.value.some((f) => f.id === lastActiveFamilyId)
        ) {
          activeFamilyId.value = lastActiveFamilyId;
        } else if (families.value.length > 0) {
          // Default to first family
          const firstFamily = families.value[0];
          if (firstFamily) {
            activeFamilyId.value = firstFamily.id;
          }
        }
      }
    } catch (error) {
      console.error("Error initializing auth:", error);
    } finally {
      isInitialized.value = true;
    }
  };

  /**
   * Sign up with email and password
   */
  const signUp = async (email: string, password: string) => {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
    });

    if (error) throw error;

    if (data.user) {
      userId.value = data.user.id;
      userEmail.value = data.user.email ?? null;
      isAuthenticated.value = true;
      families.value = [];
      activeFamilyId.value = null;
    }

    return data;
  };

  /**
   * Sign in with email and password
   */
  const signIn = async (email: string, password: string) => {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) throw error;

    if (data.user) {
      userId.value = data.user.id;
      userEmail.value = data.user.email ?? null;
      isAuthenticated.value = true;

      // Load user's families
      families.value = await loadUserFamilies();

      // Restore last active family
      const lastActiveFamilyId = localStorage.getItem(LAST_ACTIVE_FAMILY_KEY);
      if (
        lastActiveFamilyId &&
        families.value.some((f) => f.id === lastActiveFamilyId)
      ) {
        activeFamilyId.value = lastActiveFamilyId;
      } else if (families.value.length > 0) {
        const firstFamily = families.value[0];
        if (firstFamily) {
          activeFamilyId.value = firstFamily.id;
        }
      }
    }

    return data;
  };

  /**
   * Sign in with Google OAuth
   */
  const signInWithGoogle = async () => {
    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo: window.location.origin },
    });

    if (error) throw error;

    return data;
  };

  /**
   * Sign out and clear all state
   */
  const signOut = async () => {
    const { error } = await supabase.auth.signOut();

    if (error) throw error;

    // Clear all state
    userId.value = null;
    userEmail.value = null;
    isAuthenticated.value = false;
    families.value = [];
    activeFamilyId.value = null;
    localStorage.removeItem(LAST_ACTIVE_FAMILY_KEY);
  };

  /**
   * Set active family and persist to localStorage
   */
  const setActiveFamily = (familyId: string) => {
    const family = families.value.find((f) => f.id === familyId);
    if (family) {
      activeFamilyId.value = familyId;
      localStorage.setItem(LAST_ACTIVE_FAMILY_KEY, familyId);
    }
  };

  /**
   * Clear active family (when user has no families)
   */
  const clearActiveFamily = () => {
    activeFamilyId.value = null;
    localStorage.removeItem(LAST_ACTIVE_FAMILY_KEY);
  };

  /**
   * Add a newly created/joined family to the list
   */
  const addFamilyToList = (family: Family) => {
    const familyWithMembership: FamilyWithMembership = {
      ...family,
      joinedAt: new Date().toISOString(),
    };
    families.value = [...families.value, familyWithMembership];
  };

  /**
   * Remove a family from the list (when leaving)
   */
  const removeFamilyFromList = (familyIdToRemove: string) => {
    families.value = families.value.filter((f) => f.id !== familyIdToRemove);

    // If we removed the active family, switch to another or clear
    if (activeFamilyId.value === familyIdToRemove) {
      const firstFamily = families.value[0];
      if (firstFamily) {
        setActiveFamily(firstFamily.id);
      } else {
        clearActiveFamily();
      }
    }
  };

  /**
   * Check if user has any family (legacy compatibility)
   */
  const hasFamily = () => {
    return hasAnyFamily.value;
  };

  // Legacy compatibility - expose familyId and familyCode as aliases
  const familyId = activeFamilyId;
  const familyCode = activeFamilyCode;

  return {
    // User state
    userId,
    userEmail,
    isAuthenticated,
    isInitialized,

    // Multi-family state
    families,
    activeFamilyId,
    activeFamilyCode,
    activeFamily,
    hasAnyFamily,

    // Legacy aliases
    familyId,
    familyCode,

    // Methods
    initialize,
    signUp,
    signIn,
    signInWithGoogle,
    signOut,
    loadUserFamilies,
    setActiveFamily,
    clearActiveFamily,
    addFamilyToList,
    removeFamilyFromList,
    hasFamily,
  };
});
