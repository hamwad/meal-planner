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
    queryKey: computed(() => ["calendar", authStore.activeFamilyId]),
    queryFn: () => fetchCalendar(authStore.activeFamilyId!),
    enabled: computed(() => !!authStore.activeFamilyId && authStore.isInitialized),
    staleTime: 5 * 60 * 1000, // 5 minutes - data stays fresh longer
  });
}
