import { useMutation, useQueryClient } from "@tanstack/vue-query";
import { supabase } from "@/services/supabase";
import { useAuthStore } from "@/stores/auth";
import { transformMealToSupabase, transformToMeal } from "@/utils/transformers";
import type { Meal } from "@/types";

/**
 * Composable for meal mutations (add, update, delete)
 */
export function useMealMutations() {
  const queryClient = useQueryClient();
  const authStore = useAuthStore();

  /**
   * Add a new meal
   */
  const addMeal = useMutation({
    mutationFn: async (meal: Meal) => {
      if (!authStore.activeFamilyId) {
        throw new Error("Family not initialized. Please refresh the page.");
      }

      const mealData = transformMealToSupabase(meal, authStore.activeFamilyId);

      const { data, error } = await supabase
        .from("meals")
        .insert(mealData)
        .select()
        .single();

      if (error) throw error;
      return transformToMeal(data);
    },
    onMutate: async (newMeal) => {
      const familyId = authStore.activeFamilyId;
      // Cancel any outgoing refetches
      await queryClient.cancelQueries({
        queryKey: ["meals", familyId],
      });

      // Snapshot the previous value
      const previousMeals = queryClient.getQueryData<Meal[]>([
        "meals",
        familyId,
      ]);

      // Optimistically update to the new value
      queryClient.setQueryData<Meal[]>(["meals", familyId], (old) => {
        return old ? [...old, newMeal] : [newMeal];
      });

      // Return a context object with the snapshotted value
      return { previousMeals, familyId };
    },
    onError: (err, _newMeal, context) => {
      // If the mutation fails, use the context returned from onMutate to roll back
      if (context?.previousMeals) {
        queryClient.setQueryData(
          ["meals", context.familyId],
          context.previousMeals
        );
      }
      console.error("Error adding meal:", err);
    },
    onSettled: (_data, _error, _variables, context) => {
      // Always refetch after error or success to ensure we have the latest data
      queryClient.invalidateQueries({
        queryKey: ["meals", context?.familyId],
      });
    },
  });

  /**
   * Update an existing meal
   */
  const updateMeal = useMutation({
    mutationFn: async ({ id, meal }: { id: string; meal: Meal }) => {
      if (!authStore.activeFamilyId) {
        throw new Error("Family not initialized. Please refresh the page.");
      }

      const mealData = transformMealToSupabase(meal, authStore.activeFamilyId);

      const { data, error } = await supabase
        .from("meals")
        .update(mealData)
        .eq("family_id", authStore.activeFamilyId)
        .eq("meal_id", id)
        .select()
        .single();

      if (error) throw error;
      return transformToMeal(data);
    },
    onMutate: async ({ id, meal }) => {
      const familyId = authStore.activeFamilyId;
      await queryClient.cancelQueries({
        queryKey: ["meals", familyId],
      });

      const previousMeals = queryClient.getQueryData<Meal[]>([
        "meals",
        familyId,
      ]);

      queryClient.setQueryData<Meal[]>(["meals", familyId], (old) => {
        if (!old) return [meal];
        return old.map((m) => (m.id === id ? meal : m));
      });

      return { previousMeals, familyId };
    },
    onError: (err, _variables, context) => {
      if (context?.previousMeals) {
        queryClient.setQueryData(
          ["meals", context.familyId],
          context.previousMeals
        );
      }
      console.error("Error updating meal:", err);
    },
    onSettled: (_data, _error, _variables, context) => {
      queryClient.invalidateQueries({
        queryKey: ["meals", context?.familyId],
      });
    },
  });

  /**
   * Delete a meal and remove it from all calendar entries
   */
  const deleteMeal = useMutation({
    mutationFn: async (mealId: string) => {
      if (!authStore.activeFamilyId) {
        throw new Error("Family not initialized. Please refresh the page.");
      }

      // First, delete all calendar entries for this meal
      const { error: calendarError } = await supabase
        .from("calendar_meals")
        .delete()
        .eq("family_id", authStore.activeFamilyId)
        .eq("meal_id", mealId);

      if (calendarError) throw calendarError;

      // Then delete the meal itself
      const { error } = await supabase
        .from("meals")
        .delete()
        .eq("family_id", authStore.activeFamilyId)
        .eq("meal_id", mealId);

      if (error) throw error;
      return mealId;
    },
    onMutate: async (mealId) => {
      const familyId = authStore.activeFamilyId;

      // Cancel queries for both meals and calendar
      await queryClient.cancelQueries({
        queryKey: ["meals", familyId],
      });
      await queryClient.cancelQueries({
        queryKey: ["calendar", familyId],
      });

      const previousMeals = queryClient.getQueryData<Meal[]>([
        "meals",
        familyId,
      ]);

      // Also snapshot calendar data for rollback
      const previousCalendar = queryClient.getQueryData<{ mealId: string; date: string }[]>([
        "calendar",
        familyId,
      ]);

      // Optimistically remove meal from meals list
      queryClient.setQueryData<Meal[]>(["meals", familyId], (old) => {
        if (!old) return [];
        return old.filter((m) => m.id !== mealId);
      });

      // Optimistically remove calendar entries for this meal
      queryClient.setQueryData<{ mealId: string; date: string }[]>(
        ["calendar", familyId],
        (old) => {
          if (!old) return [];
          return old.filter((cm) => cm.mealId !== mealId);
        }
      );

      return { previousMeals, previousCalendar, familyId };
    },
    onError: (err, _mealId, context) => {
      // Rollback both meals and calendar on error
      if (context?.previousMeals) {
        queryClient.setQueryData(
          ["meals", context.familyId],
          context.previousMeals
        );
      }
      if (context?.previousCalendar) {
        queryClient.setQueryData(
          ["calendar", context.familyId],
          context.previousCalendar
        );
      }
      console.error("Error deleting meal:", err);
    },
    onSettled: (_data, _error, _variables, context) => {
      // Invalidate both queries to ensure consistency
      queryClient.invalidateQueries({
        queryKey: ["meals", context?.familyId],
      });
      queryClient.invalidateQueries({
        queryKey: ["calendar", context?.familyId],
      });
    },
  });

  return {
    addMeal,
    updateMeal,
    deleteMeal,
  };
}
