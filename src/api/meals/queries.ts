import { useQuery } from "@tanstack/vue-query";
import { supabase } from "@/services/supabase";
import { useAuthStore } from "@/stores/auth";
import { transformToMeal } from "@/utils/transformers";
import type { Meal } from "@/types";

/**
 * Fetch all meals for the current family from Supabase
 */
async function fetchMeals(familyId: string): Promise<Meal[]> {
  const { data, error } = await supabase
    .from("meals")
    .select("*")
    .eq("family_id", familyId);

  if (error) {
    throw error;
  }

  return (data || []).map(transformToMeal);
}

/**
 * Query hook for fetching meals
 */
export function useMealsQuery() {
  const authStore = useAuthStore();

  return useQuery({
    queryKey: computed(() => ["meals", authStore.activeFamilyId]),
    queryFn: () => fetchMeals(authStore.activeFamilyId!),
    enabled: computed(() => !!authStore.activeFamilyId && authStore.isInitialized),
    staleTime: 5 * 60 * 1000, // 5 minutes - data stays fresh longer
  });
}
