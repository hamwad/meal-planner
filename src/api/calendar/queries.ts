import { useQuery } from "@tanstack/vue-query";
import { supabase } from "@/services/supabase";
import { useAuthStore } from "@/stores/auth";
import { transformToCalendarMeal } from "@/utils/transformers";
import type { CalendarMeal } from "@/types";

/**
 * Fetch all calendar entries for the current family from Supabase
 */
async function fetchCalendar(familyId: string): Promise<CalendarMeal[]> {
  const { data, error } = await supabase
    .from("calendar_meals")
    .select("*")
    .eq("family_id", familyId);

  if (error) {
    throw error;
  }

  return (data || []).map(transformToCalendarMeal);
}

/**
 * Query hook for fetching calendar entries
 */
export function useCalendarQuery() {
  const authStore = useAuthStore();

  return useQuery({
    queryKey: ["calendar", authStore.familyId],
    queryFn: () => fetchCalendar(authStore.familyId!),
    enabled: !!authStore.familyId && authStore.isInitialized,
    staleTime: 5 * 60 * 1000, // 5 minutes - data stays fresh longer
    // Polling disabled - rely on mutation invalidation + refetch on focus/reconnect
    // refetchInterval: 10000,
  });
}
