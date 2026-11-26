// =============================================
// LEAD SERVICE - Business Logic Layer
// Contains all business rules and orchestration
// =============================================

import { LeadRepository } from './repository';
import {
  LeadQuery,
  LeadWithDetails,
  LeadsListResponse,
  LeadStats,
  LeadScoreBreakdown,
  CreateLeadInput,
  UpdateLeadInput,
  LeadNotFoundError,
  LeadAuthorizationError,
  ViewedProperty,
  LastInteraction,
} from './types';

export class LeadService {
  constructor(private repository: LeadRepository) {}

  /**
   * Get leads list with full enrichment and filtering
   */
  async getLeadsList(
    userId: string,
    userRole: string,
    query: LeadQuery
  ): Promise<LeadsListResponse> {
    // Fetch base leads data
    const isAdmin = userRole === 'admin';
    const rawLeads = isAdmin
      ? await this.repository.getAllLeads({
          score_min: query.score_min,
          score_max: query.score_max,
          status: query.status,
          created_after: query.created_after,
          created_before: query.created_before,
        })
      : await this.repository.getLeadsByBuilder(userId, {
          score_min: query.score_min,
          score_max: query.score_max,
          status: query.status,
          created_after: query.created_after,
          created_before: query.created_before,
        });

    // Enrich leads with activity data
    const enrichedLeads = await Promise.all(
      rawLeads.map((lead) => this.enrichLead(lead, userId))
    );

    // Apply client-side filters
    let filteredLeads = this.applyFilters(enrichedLeads, query);

    // Apply sorting
    filteredLeads = this.sortLeads(filteredLeads, query.sort_by, query.sort_order);

    // Calculate stats
    const stats = this.calculateStats(filteredLeads);

    // Apply pagination
    const total = filteredLeads.length;
    const totalPages = Math.ceil(total / query.limit);
    const offset = (query.page - 1) * query.limit;
    const paginatedLeads = filteredLeads.slice(offset, offset + query.limit);

    return {
      leads: paginatedLeads,
      pagination: {
        page: query.page,
        limit: query.limit,
        total,
        total_pages: totalPages,
        has_next: query.page < totalPages,
        has_prev: query.page > 1,
      },
      stats,
      filters_applied: query,
    };
  }

  /**
   * Get a single lead by ID
   */
  async getLeadById(
    leadId: string,
    userId: string,
    userRole: string
  ): Promise<LeadWithDetails> {
    const lead = await this.repository.getLeadById(leadId);

    if (!lead) {
      throw new LeadNotFoundError(leadId);
    }

    // Check authorization (unless admin)
    if (userRole !== 'admin' && lead.builder_id !== userId) {
      throw new LeadAuthorizationError();
    }

    return this.enrichLead(lead, userId);
  }

  /**
   * Create a new lead
   */
  async createLead(input: CreateLeadInput) {
    // Calculate initial score
    const initialScore = this.calculateInitialScore(input);

    const leadData = {
      ...input,
      score: initialScore,
    };

    const created = await this.repository.createLead(leadData);
    return created;
  }

  /**
   * Update a lead
   */
  async updateLead(
    leadId: string,
    updates: UpdateLeadInput,
    userId: string,
    userRole: string
  ) {
    // Check if lead exists and user has access
    const existing = await this.repository.getLeadById(leadId);

    if (!existing) {
      throw new LeadNotFoundError(leadId);
    }

    // Check authorization (unless admin)
    if (userRole !== 'admin' && existing.builder_id !== userId) {
      throw new LeadAuthorizationError();
    }

    const updated = await this.repository.updateLead(leadId, updates);

    if (!updated) {
      throw new LeadNotFoundError(leadId);
    }

    return updated;
  }

  /**
   * Delete a lead
   */
  async deleteLead(leadId: string, userId: string, userRole: string) {
    // Check if lead exists and user has access
    const existing = await this.repository.getLeadById(leadId);

    if (!existing) {
      throw new LeadNotFoundError(leadId);
    }

    // Check authorization (unless admin)
    if (userRole !== 'admin' && existing.builder_id !== userId) {
      throw new LeadAuthorizationError();
    }

    await this.repository.deleteLead(leadId);
    return true;
  }

  // =============================================
  // PRIVATE HELPER METHODS
  // =============================================

  /**
   * Enrich a lead with activity data, scores, and interactions
   */
  private async enrichLead(lead: any, builderId: string): Promise<LeadWithDetails> {
    // Get user ID from email
    const userId = lead.email
      ? await this.repository.getUserIdByEmail(lead.email)
      : null;

    // Fetch related data in parallel
    const [behaviors, interactions, preferences] = await Promise.all([
      userId ? this.repository.getUserBehaviors(userId) : Promise.resolve([]),
      this.repository.getLeadInteractions(lead.id, builderId),
      userId ? this.repository.getUserPreferences(userId) : Promise.resolve(null),
    ]);

    // Calculate activity metrics
    const totalViews = behaviors.filter((b) => b.behavior_type === 'property_view').length;
    const lastActivity = behaviors[0]?.timestamp || lead.created_at;
    const daysSinceLastActivity = this.calculateDaysSince(lastActivity);

    // Get viewed properties with counts
    const viewedProperties = await this.getViewedProperties(behaviors);

    // Last interaction
    const lastInteraction: LastInteraction | null = interactions[0]
      ? {
          type: interactions[0].interaction_type,
          timestamp: interactions[0].timestamp,
          status: interactions[0].status,
        }
      : null;

    // Has pending interactions
    const hasPendingInteractions = interactions.some((i) => i.status === 'pending');

    // Calculate score breakdown
    const baseScore = lead.score || 5;
    const scoreBreakdown = this.calculateScoreBreakdown(
      baseScore,
      behaviors,
      preferences,
      lead
    );

    // Determine category from score
    const category = this.determineCategory(baseScore);

    return {
      id: lead.id,
      email: lead.email || '',
      full_name: lead.name || 'Unknown',
      phone: lead.phone || null,
      created_at: lead.created_at,

      score: baseScore,
      category,
      status: lead.status || 'new',
      score_breakdown: scoreBreakdown,

      budget_min: preferences?.budget_min || null,
      budget_max: preferences?.budget_max || null,
      preferred_location: preferences?.preferred_location || null,
      preferred_property_type: preferences?.preferred_property_type || null,

      total_views: totalViews,
      total_interactions: interactions.length,
      last_activity: lastActivity,
      days_since_last_activity: daysSinceLastActivity,

      viewed_properties: viewedProperties,

      last_interaction: lastInteraction,
      has_pending_interactions: hasPendingInteractions,

      builder_id: lead.builder_id,
      property_id: lead.property_id,
    };
  }

  /**
   * Get viewed properties from behaviors
   */
  private async getViewedProperties(behaviors: any[]): Promise<ViewedProperty[]> {
    const viewedPropertiesMap = new Map<string, { count: number; last_viewed: string }>();

    behaviors.forEach((b) => {
      if (b.behavior_type === 'property_view' && b.property_id) {
        const existing = viewedPropertiesMap.get(b.property_id) || {
          count: 0,
          last_viewed: b.timestamp,
        };
        viewedPropertiesMap.set(b.property_id, {
          count: existing.count + 1,
          last_viewed:
            b.timestamp > existing.last_viewed ? b.timestamp : existing.last_viewed,
        });
      }
    });

    const propertyIds = Array.from(viewedPropertiesMap.keys());
    if (propertyIds.length === 0) return [];

    const properties = await this.repository.getPropertiesByIds(propertyIds);

    return properties
      .map((prop) => ({
        property_id: prop.id,
        property_title: prop.title,
        view_count: viewedPropertiesMap.get(prop.id)?.count || 0,
        last_viewed: viewedPropertiesMap.get(prop.id)?.last_viewed || '',
      }))
      .sort((a, b) => b.view_count - a.view_count);
  }

  /**
   * Apply client-side filters
   */
  private applyFilters(leads: LeadWithDetails[], query: LeadQuery): LeadWithDetails[] {
    let filtered = [...leads];

    // Category filter
    if (query.category) {
      filtered = filtered.filter((lead) => lead.category === query.category);
    }

    // Budget filter
    if (query.budget_min) {
      filtered = filtered.filter(
        (lead) => lead.budget_max && lead.budget_max >= query.budget_min!
      );
    }
    if (query.budget_max) {
      filtered = filtered.filter(
        (lead) => lead.budget_min && lead.budget_min <= query.budget_max!
      );
    }

    // Location filter
    if (query.location) {
      filtered = filtered.filter((lead) =>
        lead.preferred_location?.toLowerCase().includes(query.location!.toLowerCase())
      );
    }

    // Property type filter
    if (query.property_type) {
      filtered = filtered.filter(
        (lead) =>
          lead.preferred_property_type?.toLowerCase() === query.property_type!.toLowerCase()
      );
    }

    // Search filter
    if (query.search) {
      const searchLower = query.search.toLowerCase();
      filtered = filtered.filter(
        (lead) =>
          lead.full_name.toLowerCase().includes(searchLower) ||
          lead.email.toLowerCase().includes(searchLower) ||
          lead.phone?.toLowerCase().includes(searchLower)
      );
    }

    // Has interactions filter
    if (query.has_interactions === true) {
      filtered = filtered.filter((lead) => lead.total_interactions > 0);
    }

    // No response filter
    if (query.no_response === true) {
      filtered = filtered.filter((lead) => lead.total_interactions === 0);
    }

    // Last active filters
    if (query.last_active_after) {
      const afterDate = new Date(query.last_active_after);
      filtered = filtered.filter(
        (lead) => lead.last_activity && new Date(lead.last_activity) >= afterDate
      );
    }
    if (query.last_active_before) {
      const beforeDate = new Date(query.last_active_before);
      filtered = filtered.filter(
        (lead) => lead.last_activity && new Date(lead.last_activity) <= beforeDate
      );
    }

    return filtered;
  }

  /**
   * Sort leads
   */
  private sortLeads(
    leads: LeadWithDetails[],
    sortBy: string,
    sortOrder: string
  ): LeadWithDetails[] {
    return [...leads].sort((a, b) => {
      let aVal: any, bVal: any;

      switch (sortBy) {
        case 'score':
          aVal = a.score;
          bVal = b.score;
          break;
        case 'created_at':
          aVal = new Date(a.created_at).getTime();
          bVal = new Date(b.created_at).getTime();
          break;
        case 'last_activity':
          aVal = a.last_activity ? new Date(a.last_activity).getTime() : 0;
          bVal = b.last_activity ? new Date(b.last_activity).getTime() : 0;
          break;
        case 'budget':
          aVal = a.budget_max || 0;
          bVal = b.budget_max || 0;
          break;
        default:
          aVal = a.score;
          bVal = b.score;
      }

      if (sortOrder === 'asc') {
        return aVal > bVal ? 1 : aVal < bVal ? -1 : 0;
      } else {
        return aVal < bVal ? 1 : aVal > bVal ? -1 : 0;
      }
    });
  }

  /**
   * Calculate statistics
   */
  private calculateStats(leads: LeadWithDetails[]): LeadStats {
    const total = leads.length;

    return {
      total_leads: total,
      hot_leads: leads.filter((l) => l.category === 'Hot Lead').length,
      warm_leads: leads.filter((l) => l.category === 'Warm Lead').length,
      developing_leads: leads.filter((l) => l.category === 'Developing Lead').length,
      cold_leads: leads.filter((l) => l.category === 'Cold Lead').length,
      average_score: total > 0 ? leads.reduce((sum, l) => sum + l.score, 0) / total : 0,
      pending_interactions: leads.filter((l) => l.has_pending_interactions).length,
      no_response_leads: leads.filter((l) => l.total_interactions === 0).length,
    };
  }

  /**
   * Calculate score breakdown
   */
  private calculateScoreBreakdown(
    baseScore: number,
    behaviors: any[],
    preferences: any,
    lead: any
  ): LeadScoreBreakdown {
    return {
      budget_alignment: baseScore * 0.2,
      engagement: baseScore * 0.2,
      property_fit: baseScore * 0.2,
      time_investment: baseScore * 0.15,
      contact_intent: baseScore * 0.15,
      recency: baseScore * 0.1,
    };
  }

  /**
   * Determine category from score
   */
  private determineCategory(score: number): string {
    if (score >= 9) return 'Hot Lead';
    if (score >= 7) return 'Warm Lead';
    if (score >= 5) return 'Developing Lead';
    if (score >= 3) return 'Cold Lead';
    return 'Low Quality';
  }

  /**
   * Calculate initial score for new lead
   */
  private calculateInitialScore(input: CreateLeadInput): number {
    let score = 5; // Base score

    // Bonus for providing both email and phone
    if (input.email && input.phone) score += 1;

    // Bonus for including message
    if (input.message && input.message.length > 50) score += 1;

    // Bonus for budget
    if (input.budget && input.budget > 0) score += 1;

    return Math.min(score, 10);
  }

  /**
   * Calculate days since a timestamp
   */
  private calculateDaysSince(timestamp: string): number {
    const now = Date.now();
    const then = new Date(timestamp).getTime();
    return Math.floor((now - then) / (1000 * 60 * 60 * 24));
  }
}
