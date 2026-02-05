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
      transformMealToSupabase(meal, familyId),
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
    calendarMeals: CalendarMeal[],
  ) => {
    if (calendarMeals.length === 0) {
      return;
    }

    const calendarData = calendarMeals.map((cm) =>
      transformCalendarMealToSupabase(cm, familyId),
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
    existingCalendar: CalendarMeal[],
  ) => {
    // Set family in auth store first
    authStore.setFamily(family);

    try {
      // Upload existing data
      await Promise.all([
        uploadExistingMeals(family.id, existingMeals),
        uploadExistingCalendar(family.id, existingCalendar),
      ]);

      // Prefetch with new familyId
      await Promise.all([
        queryClient.prefetchQuery({
          queryKey: ["meals", family.id],
          queryFn: async () => {
            const { data } = await supabase
              .from("meals")
              .select("*")
              .eq("family_id", family.id);
            return data || [];
          },
        }),
        queryClient.prefetchQuery({
          queryKey: ["calendar", family.id],
          queryFn: async () => {
            const { data } = await supabase
              .from("calendar_meals")
              .select("*")
              .eq("family_id", family.id);
            return data || [];
          },
        }),
      ]);
    } catch (error) {
      console.error("Error during family creation:", error);
      throw error;
    }
  };

  /**
   * Handle joining a family
   * - Clears all cached data
   * - Sets family in auth store
   * - Prefetches new family data
   */
  const onFamilyJoined = async (family: Family) => {
    // Clear all cached data from old family
    queryClient.clear();

    // Set new family in auth store
    authStore.setFamily(family);

    try {
      // Prefetch new family data
      await Promise.all([
        queryClient.prefetchQuery({
          queryKey: ["meals", family.id],
          queryFn: async () => {
            const { data } = await supabase
              .from("meals")
              .select("*")
              .eq("family_id", family.id);
            return data || [];
          },
        }),
        queryClient.prefetchQuery({
          queryKey: ["calendar", family.id],
          queryFn: async () => {
            const { data } = await supabase
              .from("calendar_meals")
              .select("*")
              .eq("family_id", family.id);
            return data || [];
          },
        }),
      ]);
    } catch (error) {
      console.error("Error during family join:", error);
      throw error;
    }
  };

  /**
   * Handle leaving a family
   * - Clears all cached data
   * - Clears family from auth store
   */
  const onFamilyLeft = () => {
    queryClient.clear();
    authStore.clearFamily();
  };

  return {
    onFamilyCreated,
    onFamilyJoined,
    onFamilyLeft,
  };
}
