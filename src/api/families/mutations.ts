import { generateFamilyCode } from "@/utils/familyCodeGenerator";
import { useMutation } from "@tanstack/vue-query";
import { supabase } from "@/services/supabase";
import type { Family } from "@/types";

export const useCreateFamily = () => {
  return useMutation({
    mutationFn: async () => {
      const code = generateFamilyCode();

      // Create the family
      const { data, error } = await supabase
        .from("families")
        .insert({ code })
        .select()
        .single();

      if (error) throw error;

      // Get current user
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) throw new Error("No authenticated user");

      // Add creator as family member
      const { error: memberError } = await supabase
        .from("family_members")
        .insert({
          family_id: data.id,
          user_id: user.id,
        });

      if (memberError) throw memberError;

      return { family: data as Family, error: null };
    },
  });
};

export const useJoinFamily = () => {
  return useMutation({
    mutationFn: async (code: string) => {
      if (!code || code.length !== 6) return;
      // Find family by code
      const { data: family, error: familyError } = await supabase
        .from("families")
        .select("*")
        .eq("code", code.toUpperCase())
        .single();

      if (familyError) throw new Error("Family code not found");

      // Get current user
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) throw new Error("No authenticated user");

      // Check if already a member
      const { data: existingMember } = await supabase
        .from("family_members")
        .select("*")
        .eq("family_id", family.id)
        .eq("user_id", user.id)
        .maybeSingle();

      if (existingMember)
        throw new Error("Member already belongs to this family");

      if (!existingMember) {
        // Add user as family member
        const { error: memberError } = await supabase
          .from("family_members")
          .insert({
            family_id: family.id,
            user_id: user.id,
          });

        if (memberError) throw memberError;
      }

      return { family: family as Family, error: null };
    },
  });
};

export const useLeaveFamily = () => {
  return useMutation({
    mutationFn: async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) throw new Error("No authenticated user");

      const { error } = await supabase
        .from("family_members")
        .delete()
        .eq("user_id", user.id);

      if (error) throw error;

      return { error: null };
    },
  });
};
