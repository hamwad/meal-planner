import { supabase } from './supabase';
import { generateFamilyCode } from '@/utils/familyCodeGenerator';
import type { Family } from '@/types';

export class FamilyService {
  /**
   * Creates a new family with a unique code
   */
  async createFamily(): Promise<{ family: Family; error: Error | null }> {
    try {
      // Generate a unique code
      const code = generateFamilyCode();

      // Create the family
      const { data, error } = await supabase
        .from('families')
        .insert({ code })
        .select()
        .single();

      if (error) throw error;

      // Get current user
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('No authenticated user');

      // Add creator as family member
      const { error: memberError } = await supabase
        .from('family_members')
        .insert({
          family_id: data.id,
          user_id: user.id,
        });

      if (memberError) throw memberError;

      return { family: data as Family, error: null };
    } catch (error) {
      return { family: null as any, error: error as Error };
    }
  }

  /**
   * Joins an existing family using a family code
   */
  async joinFamily(code: string): Promise<{ family: Family | null; error: Error | null }> {
    try {
      // Find family by code
      const { data: family, error: familyError } = await supabase
        .from('families')
        .select('*')
        .eq('code', code.toUpperCase())
        .single();

      if (familyError) throw new Error('Family code not found');

      // Get current user
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('No authenticated user');

      // Check if already a member
      const { data: existingMember } = await supabase
        .from('family_members')
        .select('*')
        .eq('family_id', family.id)
        .eq('user_id', user.id)
        .maybeSingle();

      if (!existingMember) {
        // Add user as family member
        const { error: memberError } = await supabase
          .from('family_members')
          .insert({
            family_id: family.id,
            user_id: user.id,
          });

        if (memberError) throw memberError;
      }

      return { family: family as Family, error: null };
    } catch (error) {
      return { family: null, error: error as Error };
    }
  }

  /**
   * Gets the family for the current user
   */
  async getCurrentFamily(): Promise<{ family: Family | null; error: Error | null }> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return { family: null, error: null };

      // Get family membership
      const { data: member, error: memberError } = await supabase
        .from('family_members')
        .select('family_id')
        .eq('user_id', user.id)
        .maybeSingle();

      if (memberError || !member) return { family: null, error: null };

      // Get family details
      const { data: family, error: familyError } = await supabase
        .from('families')
        .select('*')
        .eq('id', member.family_id)
        .single();

      if (familyError) throw familyError;

      return { family: family as Family, error: null };
    } catch (error) {
      return { family: null, error: error as Error };
    }
  }

  /**
   * Leaves the current family
   */
  async leaveFamily(): Promise<{ error: Error | null }> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('No authenticated user');

      const { error } = await supabase
        .from('family_members')
        .delete()
        .eq('user_id', user.id);

      if (error) throw error;

      return { error: null };
    } catch (error) {
      return { error: error as Error };
    }
  }
}

export const familyService = new FamilyService();
