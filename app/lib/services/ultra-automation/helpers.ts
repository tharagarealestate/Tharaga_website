/**
 * Helper functions for Ultra Automation System
 * Real-time data fetching utilities
 */

import { getSupabase } from '@/lib/supabase';

export interface BuilderInfo {
  id: string;
  name: string;
  email: string;
  companyName?: string;
  phone?: string;
}

/**
 * Get builder information from database
 */
export async function getBuilderInfo(builderId: string): Promise<BuilderInfo | null> {
  const supabase = getSupabase();

  try {
    // First try to get from profiles table
    const { data: profile } = await supabase
      .from('profiles')
      .select('id, full_name, email, phone, company_name')
      .eq('id', builderId)
      .single();

    if (profile) {
      return {
        id: profile.id,
        name: profile.full_name || profile.company_name || 'Builder',
        email: profile.email || '',
        companyName: profile.company_name || undefined,
        phone: profile.phone || undefined,
      };
    }

    // Try builder_profiles table
    const { data: builderProfile } = await supabase
      .from('builder_profiles')
      .select('user_id, company_name')
      .eq('user_id', builderId)
      .single();

    if (builderProfile) {
      // Try to get email from profiles using user_id
      const { data: userProfile } = await supabase
        .from('profiles')
        .select('email')
        .eq('id', builderProfile.user_id)
        .single();
      
      return {
        id: builderId,
        name: builderProfile.company_name || 'Builder',
        email: userProfile?.email || '',
        companyName: builderProfile.company_name || undefined,
      };
    }

    // Try to get from auth.users via profiles
    const { data: userProfile } = await supabase
      .from('profiles')
      .select('email, full_name')
      .eq('id', builderId)
      .single();
    
    if (userProfile) {
      return {
        id: builderId,
        name: userProfile.full_name || userProfile.email?.split('@')[0] || 'Builder',
        email: userProfile.email || '',
      };
    }

    return null;
  } catch (error) {
    console.error('[Helpers] Error fetching builder info:', error);
    return null;
  }
}

/**
 * Get property details with all related data
 */
export async function getPropertyDetails(propertyId: string) {
  const supabase = getSupabase();

  const { data: property, error } = await supabase
    .from('properties')
    .select('*')
    .eq('id', propertyId)
    .single();

  if (error || !property) {
    return null;
  }

  return property;
}

/**
 * Get lead details with all related data
 */
export async function getLeadDetails(leadId: string) {
  const supabase = getSupabase();

  const { data: lead, error } = await supabase
    .from('generated_leads')
    .select('*')
    .eq('id', leadId)
    .single();

  if (error || !lead) {
    return null;
  }

  return lead;
}

/**
 * Get journey details with all related data
 */
export async function getJourneyDetails(journeyId: string) {
  const supabase = getSupabase();

  const { data: journey, error } = await supabase
    .from('buyer_journey')
    .select(`
      *,
      lead:generated_leads(*),
      property:properties(*)
    `)
    .eq('id', journeyId)
    .single();

  if (error || !journey) {
    return null;
  }

  return journey;
}

