import { generateFamilyCode } from "@/utils/familyCodeGenerator";
import { useMutation, useQueryClient } from "@tanstack/vue-query";
import { supabase } from "@/services/supabase";
import { useAuthStore } from "@/stores/auth";
import { familyKeys } from "./keys";
import type { Family } from "@/types";

export const useCreateFamily = () => {
  const queryClient = useQueryClient();
  const authStore = useAuthStore();

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
    onSuccess: (data) => {
      if (data?.family) {
        // Invalidate user families query
        queryClient.invalidateQueries({
          queryKey: familyKeys.userFamilies(authStore.userId!),
        });
        // Add to auth store's family list
        authStore.addFamilyToList(data.family);
      }
    },
  });
};

export const useJoinFamily = () => {
  const queryClient = useQueryClient();
  const authStore = useAuthStore();

  return useMutation({
    mutationFn: async (code: string) => {
      if (!code || code.length !== 6) {
        throw new Error("Invalid family code");
      }

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

      if (existingMember) {
        throw new Error("You are already a member of this family");
      }

      // Add user as family member
      const { error: memberError } = await supabase
        .from("family_members")
        .insert({
          family_id: family.id,
          user_id: user.id,
        });

      if (memberError) throw memberError;

      return { family: family as Family, error: null };
    },
    onSuccess: (data) => {
      if (data?.family) {
        // Invalidate user families query
        queryClient.invalidateQueries({
          queryKey: familyKeys.userFamilies(authStore.userId!),
        });
        // Add to auth store's family list
        authStore.addFamilyToList(data.family);
      }
    },
  });
};

export const useLeaveFamily = () => {
  const queryClient = useQueryClient();
  const authStore = useAuthStore();

  return useMutation({
    mutationFn: async (familyId: string) => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) throw new Error("No authenticated user");

      const { error } = await supabase
        .from("family_members")
        .delete()
        .eq("user_id", user.id)
        .eq("family_id", familyId);

      if (error) throw error;

      return { familyId, error: null };
    },
    onSuccess: (data) => {
      if (data?.familyId) {
        // Invalidate user families query
        queryClient.invalidateQueries({
          queryKey: familyKeys.userFamilies(authStore.userId!),
        });
        // Remove from auth store's family list
        authStore.removeFamilyFromList(data.familyId);
      }
    },
  });
};
