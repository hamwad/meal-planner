import { supabase } from "@/services/supabase";
import { useQuery } from "@tanstack/vue-query";
import { useAuthStore } from "@/stores/auth";
import { familyKeys } from "./keys";
import type { FamilyWithMembership } from "@/types";

/**
 * Fetch all families the current user belongs to
 */
export const useUserFamiliesQuery = () => {
  const authStore = useAuthStore();

  return useQuery({
    queryKey: computed(() => familyKeys.userFamilies(authStore.userId!)),
    queryFn: async (): Promise<FamilyWithMembership[]> => {
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
        `
        )
        .eq("user_id", authStore.userId!);

      if (error) throw error;

      return (data || []).map((row: any) => ({
        id: row.families.id,
        code: row.families.code,
        created_at: row.families.created_at,
        joinedAt: row.joined_at,
      }));
    },
    enabled: computed(() => !!authStore.userId && authStore.isAuthenticated),
  });
};

/**
 * @deprecated Use useUserFamiliesQuery instead for multi-family support
 * Kept for backwards compatibility
 */
export const useGetCurrentFamily = () => {
  return useQuery({
    queryFn: async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return { family: null, error: null };

      // Get family membership
      const { data: member, error: memberError } = await supabase
        .from("family_members")
        .select("family_id")
        .eq("user_id", user.id)
        .limit(1)
        .maybeSingle();

      if (memberError || !member) return { family: null, error: null };

      // Get family details
      const { data: family, error: familyError } = await supabase
        .from("families")
        .select("*")
        .eq("id", member.family_id)
        .single();

      if (familyError) throw familyError;

      return family;
    },
    queryKey: ["currentFamily"],
  });
};
