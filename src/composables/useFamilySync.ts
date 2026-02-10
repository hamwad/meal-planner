import { useQueryClient } from "@tanstack/vue-query";
import { useAuthStore } from "@/stores/auth";
import { supabase } from "@/services/supabase";
import {
  transformMealToSupabase,
  transformCalendarMealToSupabase,
} from "@/utils/transformers";
import type { Family, Meal, CalendarMeal } from "@/types";

/**
 * Composable for family sync operations with TanStack Query
 */
export function useFamilySync() {
  const queryClient = useQueryClient();
  const authStore = useAuthStore();

  /**
   * Upload existing meals to Supabase during family creation
   */
  const uploadExistingMeals = async (familyId: string, meals: Meal[]) => {
    if (meals.length === 0) {
      return;
    }

    const mealsData = meals.map((meal) =>
      transformMealToSupabase(meal, familyId)
    );

    const { error } = await supabase.from("meals").insert(mealsData);

    if (error) {
      console.error("Error uploading meals:", error);
      throw error;
    }
  };

  /**
   * Upload existing calendar to Supabase during family creation
   */
  const uploadExistingCalendar = async (
    familyId: string,
    calendarMeals: CalendarMeal[]
  ) => {
    if (calendarMeals.length === 0) {
      return;
    }

    const calendarData = calendarMeals.map((cm) =>
      transformCalendarMealToSupabase(cm, familyId)
    );

    const { error } = await supabase
      .from("calendar_meals")
      .insert(calendarData);

    if (error) {
      console.error("Error uploading calendar:", error);
      throw error;
    }
  };

  /**
   * Handle family creation
   * - Sets family in auth store
   * - Uploads existing meals and calendar to Supabase
   * - Prefetches new family data
   */
  const onFamilyCreated = async (
    family: Family,
    existingMeals: Meal[],
    existingCalendar: CalendarMeal[]
  ) => {
    // Set family in auth store first
    authStore.setActiveFamily(family.id);

    try {
      // Upload existing data
      await Promise.all([
        uploadExistingMeals(family.id, existingMeals),
        uploadExistingCalendar(family.id, existingCalendar),
      ]);

      // Prefetch with new familyId
      await prefetchFamilyData(family.id);
    } catch (error) {
      console.error("Error during family creation:", error);
      throw error;
    }
  };

  /**
   * Handle joining a family
   * - Clears cached data for previous family
   * - Sets family in auth store
   * - Prefetches new family data
   */
  const onFamilyJoined = async (family: Family) => {
    const oldFamilyId = authStore.activeFamilyId;

    // Clear old family's cached data
    if (oldFamilyId) {
      queryClient.removeQueries({ queryKey: ["meals", oldFamilyId] });
      queryClient.removeQueries({ queryKey: ["calendar", oldFamilyId] });
    }

    // Set new family in auth store
    authStore.setActiveFamily(family.id);

    try {
      // Prefetch new family data
      await prefetchFamilyData(family.id);
    } catch (error) {
      console.error("Error during family join:", error);
      throw error;
    }
  };

  /**
   * Handle leaving a family
   * - Clears cached data for the left family
   * - Auth store handles switching to another family or clearing
   */
  const onFamilyLeft = (familyId: string) => {
    // Remove specific family's cached data
    queryClient.removeQueries({ queryKey: ["meals", familyId] });
    queryClient.removeQueries({ queryKey: ["calendar", familyId] });
  };

  /**
   * Handle switching active family
   * - Clears cached data for old family
   * - Prefetches data for new family
   */
  const onFamilySwitch = async (
    newFamilyId: string,
    oldFamilyId: string | null
  ) => {
    // Remove old family's cached data
    if (oldFamilyId) {
      queryClient.removeQueries({ queryKey: ["meals", oldFamilyId] });
      queryClient.removeQueries({ queryKey: ["calendar", oldFamilyId] });
    }

    // Prefetch new family's data
    await prefetchFamilyData(newFamilyId);
  };

  /**
   * Prefetch meals and calendar data for a family
   */
  const prefetchFamilyData = async (familyId: string) => {
    await Promise.all([
      queryClient.prefetchQuery({
        queryKey: ["meals", familyId],
        queryFn: async () => {
          const { data } = await supabase
            .from("meals")
            .select("*")
            .eq("family_id", familyId);
          return data || [];
        },
      }),
      queryClient.prefetchQuery({
        queryKey: ["calendar", familyId],
        queryFn: async () => {
          const { data } = await supabase
            .from("calendar_meals")
            .select("*")
            .eq("family_id", familyId);
          return data || [];
        },
      }),
    ]);
  };

  return {
    onFamilyCreated,
    onFamilyJoined,
    onFamilyLeft,
    onFamilySwitch,
    prefetchFamilyData,
  };
}
