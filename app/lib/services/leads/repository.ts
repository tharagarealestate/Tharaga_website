// =============================================
// LEAD REPOSITORY - Data Access Layer
// Handles all database interactions for leads
// =============================================

import { SupabaseClient } from '@supabase/supabase-js';
import { LeadServiceError } from './types';

export class LeadRepository {
  constructor(private supabase: SupabaseClient) {}

  /**
   * Get leads by builder ID with optional filters
   */
  async getLeadsByBuilder(
    builderId: string,
    filters: {
      score_min?: number;
      score_max?: number;
      status?: string;
      created_after?: string;
      created_before?: string;
    } = {}
  ) {
    try {
      let query = this.supabase
        .from('leads')
        .select(`
          id,
          created_at,
          updated_at,
          name,
          email,
          phone,
          message,
          score,
          status,
          source,
          budget,
          builder_id,
          property_id,
          properties:property_id (
            id,
            title,
            location
          )
        `)
        .eq('builder_id', builderId);

      // Apply filters
      if (filters.score_min !== undefined) {
        query = query.gte('score', filters.score_min);
      }
      if (filters.score_max !== undefined) {
        query = query.lte('score', filters.score_max);
      }
      if (filters.status) {
        query = query.eq('status', filters.status);
      }
      if (filters.created_after) {
        query = query.gte('created_at', filters.created_after);
      }
      if (filters.created_before) {
        query = query.lte('created_at', filters.created_before);
      }

      const { data, error } = await query;

      if (error) throw new LeadServiceError(error.message, 'DATABASE_ERROR', 500, true);

      return data || [];
    } catch (error: any) {
      if (error instanceof LeadServiceError) throw error;
      throw new LeadServiceError(error.message || 'Failed to fetch leads', 'DATABASE_ERROR', 500, true);
    }
  }

  /**
   * Get ALL leads (admin only - no builder filter)
   */
  async getAllLeads(filters: {
    score_min?: number;
    score_max?: number;
    status?: string;
    created_after?: string;
    created_before?: string;
  } = {}) {
    try {
      let query = this.supabase
        .from('leads')
        .select(`
          id,
          created_at,
          updated_at,
          name,
          email,
          phone,
          message,
          score,
          status,
          source,
          budget,
          builder_id,
          property_id,
          properties:property_id (
            id,
            title,
            location
          )
        `);

      // Apply filters (same as builder, but no builder_id filter)
      if (filters.score_min !== undefined) {
        query = query.gte('score', filters.score_min);
      }
      if (filters.score_max !== undefined) {
        query = query.lte('score', filters.score_max);
      }
      if (filters.status) {
        query = query.eq('status', filters.status);
      }
      if (filters.created_after) {
        query = query.gte('created_at', filters.created_after);
      }
      if (filters.created_before) {
        query = query.lte('created_at', filters.created_before);
      }

      const { data, error } = await query;

      if (error) throw new LeadServiceError(error.message, 'DATABASE_ERROR', 500, true);

      return data || [];
    } catch (error: any) {
      if (error instanceof LeadServiceError) throw error;
      throw new LeadServiceError(error.message || 'Failed to fetch all leads', 'DATABASE_ERROR', 500, true);
    }
  }

  /**
   * Get lead by ID
   */
  async getLeadById(leadId: string) {
    try {
      const { data, error } = await this.supabase
        .from('leads')
        .select(`
          *,
          properties:property_id (
            id,
            title,
            location,
            price,
            property_type
          )
        `)
        .eq('id', leadId)
        .single();

      if (error) {
        if (error.code === 'PGRST116') {
          return null; // Not found
        }
        throw new LeadServiceError(error.message, 'DATABASE_ERROR', 500, true);
      }

      return data;
    } catch (error: any) {
      if (error instanceof LeadServiceError) throw error;
      throw new LeadServiceError(error.message || 'Failed to fetch lead', 'DATABASE_ERROR', 500, true);
    }
  }

  /**
   * Create a new lead
   */
  async createLead(leadData: {
    property_id: string;
    builder_id: string;
    name: string;
    email?: string;
    phone?: string;
    message?: string;
    source?: string;
    budget?: number;
  }) {
    try {
      const { data, error } = await this.supabase
        .from('leads')
        .insert([leadData])
        .select()
        .single();

      if (error) throw new LeadServiceError(error.message, 'DATABASE_ERROR', 500, true);

      return data;
    } catch (error: any) {
      if (error instanceof LeadServiceError) throw error;
      throw new LeadServiceError(error.message || 'Failed to create lead', 'DATABASE_ERROR', 500, true);
    }
  }

  /**
   * Update a lead
   */
  async updateLead(leadId: string, updates: {
    name?: string;
    email?: string;
    phone?: string;
    message?: string;
    status?: string;
    score?: number;
    budget?: number;
  }) {
    try {
      const { data, error } = await this.supabase
        .from('leads')
        .update(updates)
        .eq('id', leadId)
        .select()
        .single();

      if (error) {
        if (error.code === 'PGRST116') {
          return null; // Not found
        }
        throw new LeadServiceError(error.message, 'DATABASE_ERROR', 500, true);
      }

      return data;
    } catch (error: any) {
      if (error instanceof LeadServiceError) throw error;
      throw new LeadServiceError(error.message || 'Failed to update lead', 'DATABASE_ERROR', 500, true);
    }
  }

  /**
   * Delete a lead
   */
  async deleteLead(leadId: string) {
    try {
      const { error } = await this.supabase
        .from('leads')
        .delete()
        .eq('id', leadId);

      if (error) throw new LeadServiceError(error.message, 'DATABASE_ERROR', 500, true);

      return true;
    } catch (error: any) {
      if (error instanceof LeadServiceError) throw error;
      throw new LeadServiceError(error.message || 'Failed to delete lead', 'DATABASE_ERROR', 500, true);
    }
  }

  /**
   * Get user behaviors for enrichment
   */
  async getUserBehaviors(userId: string) {
    try {
      const { data, error } = await this.supabase
        .from('user_behavior')
        .select('behavior_type, property_id, timestamp, duration, device_type')
        .eq('user_id', userId)
        .order('timestamp', { ascending: false });

      if (error && error.code !== 'PGRST116') {
        throw new LeadServiceError(error.message, 'DATABASE_ERROR', 500, true);
      }

      return data || [];
    } catch (error: any) {
      // Silently fail if table doesn't exist
      return [];
    }
  }

  /**
   * Get lead interactions
   */
  async getLeadInteractions(leadId: string, builderId: string) {
    try {
      const { data, error } = await this.supabase
        .from('lead_interactions')
        .select('*')
        .eq('lead_id', leadId)
        .eq('builder_id', builderId)
        .order('timestamp', { ascending: false });

      if (error && error.code !== 'PGRST116') {
        throw new LeadServiceError(error.message, 'DATABASE_ERROR', 500, true);
      }

      return data || [];
    } catch (error: any) {
      // Silently fail if table doesn't exist
      return [];
    }
  }

  /**
   * Get user preferences
   */
  async getUserPreferences(userId: string) {
    try {
      const { data, error } = await this.supabase
        .from('user_preferences')
        .select('*')
        .eq('user_id', userId)
        .maybeSingle();

      if (error && error.code !== 'PGRST116') {
        throw new LeadServiceError(error.message, 'DATABASE_ERROR', 500, true);
      }

      return data;
    } catch (error: any) {
      // Silently fail if table doesn't exist
      return null;
    }
  }

  /**
   * Get user ID from email (for enrichment)
   */
  async getUserIdByEmail(email: string): Promise<string | null> {
    try {
      const { data, error } = await this.supabase
        .from('profiles')
        .select('id')
        .eq('email', email)
        .maybeSingle();

      if (error) return null;
      return data?.id || null;
    } catch {
      return null;
    }
  }

  /**
   * Get properties by IDs
   */
  async getPropertiesByIds(propertyIds: string[]) {
    if (propertyIds.length === 0) return [];

    try {
      const { data, error } = await this.supabase
        .from('properties')
        .select('id, title')
        .in('id', propertyIds);

      if (error) return [];
      return data || [];
    } catch {
      return [];
    }
  }
}
