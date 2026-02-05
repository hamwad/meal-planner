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
      if (!authStore.familyId) {
        throw new Error("Family not initialized. Please refresh the page.");
      }

      const mealData = transformMealToSupabase(meal, authStore.familyId);

      const { data, error } = await supabase
        .from("meals")
        .insert(mealData)
        .select()
        .single();

      if (error) throw error;
      return transformToMeal(data);
    },
    onMutate: async (newMeal) => {
      // Cancel any outgoing refetches
      await queryClient.cancelQueries({
        queryKey: ["meals", authStore.familyId],
      });

      // Snapshot the previous value
      const previousMeals = queryClient.getQueryData<Meal[]>([
        "meals",
        authStore.familyId,
      ]);

      // Optimistically update to the new value
      queryClient.setQueryData<Meal[]>(["meals", authStore.familyId], (old) => {
        return old ? [...old, newMeal] : [newMeal];
      });

      // Return a context object with the snapshotted value
      return { previousMeals };
    },
    onError: (err, _newMeal, context) => {
      // If the mutation fails, use the context returned from onMutate to roll back
      if (context?.previousMeals) {
        queryClient.setQueryData(
          ["meals", authStore.familyId],
          context.previousMeals,
        );
      }
      console.error("Error adding meal:", err);
    },
    onSettled: () => {
      // Always refetch after error or success to ensure we have the latest data
      queryClient.invalidateQueries({
        queryKey: ["meals", authStore.familyId],
      });
    },
  });

  /**
   * Update an existing meal
   */
  const updateMeal = useMutation({
    mutationFn: async ({ id, meal }: { id: string; meal: Meal }) => {
      if (!authStore.familyId) {
        throw new Error("Family not initialized. Please refresh the page.");
      }

      const mealData = transformMealToSupabase(meal, authStore.familyId);

      const { data, error } = await supabase
        .from("meals")
        .update(mealData)
        .eq("family_id", authStore.familyId)
        .eq("meal_id", id)
        .select()
        .single();

      if (error) throw error;
      return transformToMeal(data);
    },
    onMutate: async ({ id, meal }) => {
      await queryClient.cancelQueries({
        queryKey: ["meals", authStore.familyId],
      });

      const previousMeals = queryClient.getQueryData<Meal[]>([
        "meals",
        authStore.familyId,
      ]);

      queryClient.setQueryData<Meal[]>(["meals", authStore.familyId], (old) => {
        if (!old) return [meal];
        return old.map((m) => (m.id === id ? meal : m));
      });

      return { previousMeals };
    },
    onError: (err, _variables, context) => {
      if (context?.previousMeals) {
        queryClient.setQueryData(
          ["meals", authStore.familyId],
          context.previousMeals,
        );
      }
      console.error("Error updating meal:", err);
    },
    onSettled: () => {
      queryClient.invalidateQueries({
        queryKey: ["meals", authStore.familyId],
      });
    },
  });

  /**
   * Delete a meal
   */
  const deleteMeal = useMutation({
    mutationFn: async (mealId: string) => {
      if (!authStore.familyId) {
        throw new Error("Family not initialized. Please refresh the page.");
      }

      const { error } = await supabase
        .from("meals")
        .delete()
        .eq("family_id", authStore.familyId)
        .eq("meal_id", mealId);

      if (error) throw error;
      return mealId;
    },
    onMutate: async (mealId) => {
      await queryClient.cancelQueries({
        queryKey: ["meals", authStore.familyId],
      });

      const previousMeals = queryClient.getQueryData<Meal[]>([
        "meals",
        authStore.familyId,
      ]);

      queryClient.setQueryData<Meal[]>(["meals", authStore.familyId], (old) => {
        if (!old) return [];
        return old.filter((m) => m.id !== mealId);
      });

      return { previousMeals };
    },
    onError: (err, _mealId, context) => {
      if (context?.previousMeals) {
        queryClient.setQueryData(
          ["meals", authStore.familyId],
          context.previousMeals,
        );
      }
      console.error("Error deleting meal:", err);
    },
    onSettled: () => {
      queryClient.invalidateQueries({
        queryKey: ["meals", authStore.familyId],
      });
    },
  });

  return {
    addMeal,
    updateMeal,
    deleteMeal,
  };
}
