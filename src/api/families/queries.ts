import { supabase } from "@/services/supabase";
import { useQuery } from "@tanstack/vue-query";

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
    queryKey: [],
  });
};
