import { useMutation, useQueryClient } from "@tanstack/vue-query";
import { supabase } from "@/services/supabase";
import { useAuthStore } from "@/stores/auth";
import {
  transformCalendarMealToSupabase,
  transformToCalendarMeal,
} from "@/utils/transformers";
import type { CalendarMeal } from "@/types";

/**
 * Composable for calendar mutations
 */
export function useCalendarMutations() {
  const queryClient = useQueryClient();
  const authStore = useAuthStore();

  /**
   * Add a meal to a date
   */
  const addMealToDate = useMutation({
    mutationFn: async ({
      mealId,
      date,
      servingsOverride,
    }: {
      mealId: string;
      date: string;
      servingsOverride?: number;
    }) => {
      if (!authStore.activeFamilyId) {
        throw new Error("Family not initialized. Please refresh the page.");
      }

      const calendarMeal: CalendarMeal = {
        mealId,
        date,
        servingsOverride,
        updatedAt: new Date().toISOString(),
      };

      const calendarData = transformCalendarMealToSupabase(
        calendarMeal,
        authStore.activeFamilyId
      );

      const { data, error } = await supabase
        .from("calendar_meals")
        .insert(calendarData)
        .select()
        .single();

      if (error) throw error;
      return transformToCalendarMeal(data);
    },
    onMutate: async ({ mealId, date, servingsOverride }) => {
      const familyId = authStore.activeFamilyId;
      await queryClient.cancelQueries({
        queryKey: ["calendar", familyId],
      });

      const previousCalendar = queryClient.getQueryData<CalendarMeal[]>([
        "calendar",
        familyId,
      ]);

      const newCalendarMeal: CalendarMeal = {
        mealId,
        date,
        servingsOverride,
        updatedAt: new Date().toISOString(),
      };

      queryClient.setQueryData<CalendarMeal[]>(
        ["calendar", familyId],
        (old) => {
          return old ? [...old, newCalendarMeal] : [newCalendarMeal];
        }
      );

      return { previousCalendar, familyId };
    },
    onError: (err, _variables, context) => {
      if (context?.previousCalendar) {
        queryClient.setQueryData(
          ["calendar", context.familyId],
          context.previousCalendar
        );
      }
      console.error("Error adding meal to calendar:", err);
    },
    onSettled: (_data, _error, _variables, context) => {
      queryClient.invalidateQueries({
        queryKey: ["calendar", context?.familyId],
      });
    },
  });

  /**
   * Remove a meal from a date
   */
  const removeMealFromDate = useMutation({
    mutationFn: async ({ mealId, date }: { mealId: string; date: string }) => {
      if (!authStore.activeFamilyId) {
        throw new Error("Family not initialized. Please refresh the page.");
      }

      const { error } = await supabase
        .from("calendar_meals")
        .delete()
        .eq("family_id", authStore.activeFamilyId)
        .eq("meal_id", mealId)
        .eq("date", date);

      if (error) throw error;
      return { mealId, date };
    },
    onMutate: async ({ mealId, date }) => {
      const familyId = authStore.activeFamilyId;
      await queryClient.cancelQueries({
        queryKey: ["calendar", familyId],
      });

      const previousCalendar = queryClient.getQueryData<CalendarMeal[]>([
        "calendar",
        familyId,
      ]);

      queryClient.setQueryData<CalendarMeal[]>(
        ["calendar", familyId],
        (old) => {
          if (!old) return [];
          return old.filter(
            (cm) => !(cm.mealId === mealId && cm.date === date)
          );
        }
      );

      return { previousCalendar, familyId };
    },
    onError: (err, _variables, context) => {
      if (context?.previousCalendar) {
        queryClient.setQueryData(
          ["calendar", context.familyId],
          context.previousCalendar
        );
      }
      console.error("Error removing meal from calendar:", err);
    },
    onSettled: (_data, _error, _variables, context) => {
      queryClient.invalidateQueries({
        queryKey: ["calendar", context?.familyId],
      });
    },
  });

  /**
   * Update servings for a calendar meal
   */
  const updateServings = useMutation({
    mutationFn: async ({
      mealId,
      date,
      servings,
    }: {
      mealId: string;
      date: string;
      servings: number;
    }) => {
      if (!authStore.activeFamilyId) {
        throw new Error("Family not initialized. Please refresh the page.");
      }

      const { data, error } = await supabase
        .from("calendar_meals")
        .update({
          servings_override: servings,
          updated_at: new Date().toISOString(),
        })
        .eq("family_id", authStore.activeFamilyId)
        .eq("meal_id", mealId)
        .eq("date", date)
        .select()
        .single();

      if (error) throw error;
      return transformToCalendarMeal(data);
    },
    onMutate: async ({ mealId, date, servings }) => {
      const familyId = authStore.activeFamilyId;
      await queryClient.cancelQueries({
        queryKey: ["calendar", familyId],
      });

      const previousCalendar = queryClient.getQueryData<CalendarMeal[]>([
        "calendar",
        familyId,
      ]);

      queryClient.setQueryData<CalendarMeal[]>(
        ["calendar", familyId],
        (old) => {
          if (!old) return [];
          return old.map((cm) => {
            if (cm.mealId === mealId && cm.date === date) {
              return {
                ...cm,
                servingsOverride: servings,
                updatedAt: new Date().toISOString(),
              };
            }
            return cm;
          });
        }
      );

      return { previousCalendar, familyId };
    },
    onError: (err, _variables, context) => {
      if (context?.previousCalendar) {
        queryClient.setQueryData(
          ["calendar", context.familyId],
          context.previousCalendar
        );
      }
      console.error("Error updating servings:", err);
    },
    onSettled: (_data, _error, _variables, context) => {
      queryClient.invalidateQueries({
        queryKey: ["calendar", context?.familyId],
      });
    },
  });

  return {
    addMealToDate,
    removeMealFromDate,
    updateServings,
  };
}
