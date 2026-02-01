// =============================================
// LEADS LISTING API - COMPLETE FILTERING & PAGINATION
// GET /api/leads?score_min=7&category=Hot Lead&page=1&limit=20
// =============================================
import { NextRequest, NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { classifySupabaseError, classifyHttpError } from '@/lib/error-handler';
import { secureApiRoute } from '@/lib/security/api-security';
import { Permissions } from '@/lib/security/permissions';
import { AuditActions, AuditResourceTypes } from '@/lib/security/audit';

// =============================================
// TYPES
// =============================================
interface LeadListQuery {
  // Pagination
  page?: number;
  limit?: number;
  
  // Filters
  score_min?: number;
  score_max?: number;
  category?: 'Hot Lead' | 'Warm Lead' | 'Developing Lead' | 'Cold Lead' | 'Low Quality';
  budget_min?: number;
  budget_max?: number;
  location?: string;
  property_type?: string;
  
  // Search
  search?: string; // Search in name, email, phone
  
  // Sorting
  sort_by?: 'score' | 'created_at' | 'last_activity' | 'budget';
  sort_order?: 'asc' | 'desc';
  
  // Date filters
  created_after?: string; // ISO date
  created_before?: string;
  last_active_after?: string;
  last_active_before?: string;
  
  // Interaction filters
  has_interactions?: boolean;
  interaction_type?: string;
  no_response?: boolean; // Leads builder hasn't responded to
}

interface LeadWithDetails {
  id: string;
  email: string;
  full_name: string;
  phone: string | null;
  created_at: string;
  
  // Lead Score
  score: number;
  category: string;
  score_breakdown: {
    budget_alignment: number;
    engagement: number;
    property_fit: number;
    time_investment: number;
    contact_intent: number;
    recency: number;
  };
  
  // User Preferences
  budget_min: number | null;
  budget_max: number | null;
  preferred_location: string | null;
  preferred_property_type: string | null;
  
  // Activity Summary
  total_views: number;
  total_interactions: number;
  last_activity: string | null;
  days_since_last_activity: number;
  
  // Properties interested in
  viewed_properties: Array<{
    property_id: string;
    property_title: string;
    view_count: number;
    last_viewed: string;
  }>;
  
  // Interaction status
  last_interaction: {
    type: string;
    timestamp: string;
    status: string;
  } | null;
  has_pending_interactions: boolean;
}

// =============================================
// GET HANDLER
// =============================================
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

// Handle OPTIONS for CORS preflight
export async function OPTIONS(request: NextRequest) {
  return new NextResponse(null, {
    status: 204,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, PUT, PATCH, DELETE, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      'Access-Control-Max-Age': '86400',
    },
  });
}

// Secure GET handler with authentication, rate limiting, and permissions
export const GET = secureApiRoute(
  async (request: NextRequest, user) => {
    const supabase = createRouteHandlerClient({ cookies });

    // CRITICAL FIX: User is already authenticated via secureApiRoute - TRUST the wrapper
    // The secureApiRoute has already validated role and permissions, including admin email override
    // NO additional role checks needed here
    
    // =============================================
    // PARSE QUERY PARAMETERS
    // =============================================
    
    const searchParams = request.nextUrl.searchParams;
    
    const query: LeadListQuery = {
      page: parseInt(searchParams.get('page') || '1'),
      limit: Math.min(parseInt(searchParams.get('limit') || '20'), 100), // Max 100
      score_min: searchParams.get('score_min') ? parseFloat(searchParams.get('score_min')!) : undefined,
      score_max: searchParams.get('score_max') ? parseFloat(searchParams.get('score_max')!) : undefined,
      category: searchParams.get('category') as any,
      budget_min: searchParams.get('budget_min') ? parseInt(searchParams.get('budget_min')!) : undefined,
      budget_max: searchParams.get('budget_max') ? parseInt(searchParams.get('budget_max')!) : undefined,
      location: searchParams.get('location') || undefined,
      property_type: searchParams.get('property_type') || undefined,
      search: searchParams.get('search') || undefined,
      sort_by: (searchParams.get('sort_by') || 'score') as any,
      sort_order: (searchParams.get('sort_order') || 'desc') as any,
      created_after: searchParams.get('created_after') || undefined,
      created_before: searchParams.get('created_before') || undefined,
      last_active_after: searchParams.get('last_active_after') || undefined,
      last_active_before: searchParams.get('last_active_before') || undefined,
      has_interactions: searchParams.get('has_interactions') === 'true' ? true : undefined,
      no_response: searchParams.get('no_response') === 'true' ? true : undefined,
    };
    
    // =============================================
    // FETCH LEADS WITH SCORING
    // =============================================

    // CRITICAL FIX: Trust the user.role from secureApiRoute wrapper (includes email override)
    // Admin email (tharagarealestate@gmail.com) is already handled in auth.ts:93-99
    const isAdmin = user.role === 'admin' || user.email === 'tharagarealestate@gmail.com';

    // Build query - admins see ALL leads, builders see only their own
    let leadsQuery = supabase
      .from('leads')
      .select(`
        id,
        created_at,
        name,
        email,
        phone,
        message,
        score,
        builder_id,
        property_id,
        properties:property_id (
          id,
          title,
          location
        )
      `);

    // Only filter by builder_id if NOT admin
    if (!isAdmin) {
      leadsQuery = leadsQuery.eq('builder_id', user.id);
    }

    // Apply score filters
    if (query.score_min !== undefined) {
      leadsQuery = leadsQuery.gte('score', query.score_min);
    }
    if (query.score_max !== undefined) {
      leadsQuery = leadsQuery.lte('score', query.score_max);
    }
    
    // Apply date filters
    if (query.created_after) {
      leadsQuery = leadsQuery.gte('created_at', query.created_after);
    }
    if (query.created_before) {
      leadsQuery = leadsQuery.lte('created_at', query.created_before);
    }
    
    // Execute query
    const { data: leadsData, error: leadsError } = await leadsQuery;
    
    if (leadsError) {
      console.error('[API/Leads] Query error:', leadsError);
      const classifiedError = classifySupabaseError(leadsError, leadsData);
      
      return NextResponse.json({
        success: false,
        error: classifiedError.message,
        errorType: classifiedError.type,
        message: classifiedError.userMessage,
        retryable: classifiedError.retryable,
        technicalDetails: classifiedError.technicalDetails,
      }, { status: classifiedError.statusCode || 500 });
    }
    
    if (!leadsData) {
      return NextResponse.json({
        success: true,
        data: {
          leads: [],
          pagination: {
            page: query.page,
            limit: query.limit,
            total: 0,
            total_pages: 0,
            has_next: false,
            has_prev: false,
          },
          stats: {
            total_leads: 0,
            hot_leads: 0,
            warm_leads: 0,
            developing_leads: 0,
            cold_leads: 0,
            average_score: 0,
            pending_interactions: 0,
            no_response_leads: 0,
          },
          filters_applied: query,
        },
        isEmpty: true,
      });
    }
    
    // =============================================
    // ENRICH WITH ACTIVITY DATA
    // =============================================
    
    const enrichedLeads: LeadWithDetails[] = await Promise.all(
      (leadsData || []).map(async (lead: any) => {
        const leadId = lead.id;
        
        // Try to get user_id from lead if available, otherwise use email to find user
        let userId: string | null = null;
        if (lead.email) {
          const { data: userData } = await supabase
            .from('profiles')
            .select('id')
            .eq('email', lead.email)
            .maybeSingle();
          userId = userData?.id || null;
        }
        
        // Fetch behavior stats (if user_behavior table exists)
        let behaviors: any[] = [];
        if (userId) {
          const { data: behaviorData } = await supabase
            .from('user_behavior')
            .select('behavior_type, property_id, timestamp, duration, device_type')
            .eq('user_id', userId)
            .order('timestamp', { ascending: false });
          behaviors = behaviorData || [];
        }
        
        // Fetch interactions with this builder
        const { data: interactions } = await supabase
          .from('lead_interactions')
          .select('*')
          .eq('lead_id', leadId)
          .eq('builder_id', user.id)
          .order('timestamp', { ascending: false });
        
        // Calculate activity metrics
        const totalViews = behaviors?.filter(b => b.behavior_type === 'property_view').length || 0;
        const lastActivity = behaviors?.[0]?.timestamp || lead.created_at;
        const daysSinceLastActivity = lastActivity
          ? Math.floor((Date.now() - new Date(lastActivity).getTime()) / (1000 * 60 * 60 * 24))
          : 999;
        
        // Get viewed properties with counts
        const viewedPropertiesMap = new Map<string, { count: number; last_viewed: string }>();
        behaviors?.forEach(b => {
          if (b.behavior_type === 'property_view' && b.property_id) {
            const existing = viewedPropertiesMap.get(b.property_id) || { count: 0, last_viewed: b.timestamp };
            viewedPropertiesMap.set(b.property_id, {
              count: existing.count + 1,
              last_viewed: b.timestamp > existing.last_viewed ? b.timestamp : existing.last_viewed,
            });
          }
        });
        
        // Fetch property details for viewed properties
        const propertyIds = Array.from(viewedPropertiesMap.keys());
        let viewedProperties: any[] = [];
        if (propertyIds.length > 0) {
          const { data: properties } = await supabase
            .from('properties')
            .select('id, title')
            .in('id', propertyIds);
          
          viewedProperties = properties?.map(prop => ({
            property_id: prop.id,
            property_title: prop.title,
            view_count: viewedPropertiesMap.get(prop.id)?.count || 0,
            last_viewed: viewedPropertiesMap.get(prop.id)?.last_viewed || '',
          })).sort((a, b) => b.view_count - a.view_count) || [];
        }
        
        // Last interaction
        const lastInteraction = interactions?.[0] ? {
          type: interactions[0].interaction_type,
          timestamp: interactions[0].timestamp,
          status: interactions[0].status,
        } : null;
        
        // Has pending interactions
        const hasPendingInteractions = interactions?.some(i => i.status === 'pending') || false;
        
        // Calculate score breakdown (simplified - using lead score)
        const baseScore = lead.score || 5;
        const scoreBreakdown = {
          budget_alignment: baseScore * 0.2,
          engagement: baseScore * 0.2,
          property_fit: baseScore * 0.2,
          time_investment: baseScore * 0.15,
          contact_intent: baseScore * 0.15,
          recency: baseScore * 0.1,
        };
        
        // Determine category from score
        let category = 'Low Quality';
        if (baseScore >= 9) category = 'Hot Lead';
        else if (baseScore >= 7) category = 'Warm Lead';
        else if (baseScore >= 5) category = 'Developing Lead';
        else if (baseScore >= 3) category = 'Cold Lead';
        
        // Get preferences (if user_preferences table exists)
        let preferences: any = null;
        if (userId) {
          const { data: prefData } = await supabase
            .from('user_preferences')
            .select('*')
            .eq('user_id', userId)
            .maybeSingle();
          preferences = prefData;
        }
        
        // Build enriched lead object
        return {
          id: leadId,
          email: lead.email || '',
          full_name: lead.name || 'Unknown',
          phone: lead.phone || null,
          created_at: lead.created_at,
          
          score: baseScore,
          category,
          score_breakdown: scoreBreakdown,
          
          budget_min: preferences?.budget_min || null,
          budget_max: preferences?.budget_max || null,
          preferred_location: preferences?.preferred_location || null,
          preferred_property_type: preferences?.preferred_property_type || null,
          
          total_views: totalViews,
          total_interactions: interactions?.length || 0,
          last_activity: lastActivity,
          days_since_last_activity: daysSinceLastActivity,
          
          viewed_properties: viewedProperties,
          
          last_interaction: lastInteraction,
          has_pending_interactions: hasPendingInteractions,
        };
      })
    );
    
    // =============================================
    // APPLY CLIENT-SIDE FILTERS
    // (Filters that couldn't be applied in SQL)
    // =============================================
    
    let filteredLeads = enrichedLeads;
    
    // Category filter
    if (query.category) {
      filteredLeads = filteredLeads.filter(lead => lead.category === query.category);
    }
    
    // Budget filter
    if (query.budget_min) {
      filteredLeads = filteredLeads.filter(lead => 
        lead.budget_max && lead.budget_max >= query.budget_min!
      );
    }
    if (query.budget_max) {
      filteredLeads = filteredLeads.filter(lead => 
        lead.budget_min && lead.budget_min <= query.budget_max!
      );
    }
    
    // Location filter
    if (query.location) {
      filteredLeads = filteredLeads.filter(lead =>
        lead.preferred_location?.toLowerCase().includes(query.location!.toLowerCase())
      );
    }
    
    // Property type filter
    if (query.property_type) {
      filteredLeads = filteredLeads.filter(lead =>
        lead.preferred_property_type?.toLowerCase() === query.property_type!.toLowerCase()
      );
    }
    
    // Search filter (name, email, phone)
    if (query.search) {
      const searchLower = query.search.toLowerCase();
      filteredLeads = filteredLeads.filter(lead =>
        lead.full_name.toLowerCase().includes(searchLower) ||
        lead.email.toLowerCase().includes(searchLower) ||
        lead.phone?.toLowerCase().includes(searchLower)
      );
    }
    
    // Has interactions filter
    if (query.has_interactions === true) {
      filteredLeads = filteredLeads.filter(lead => lead.total_interactions > 0);
    }
    
    // No response filter (leads builder hasn't interacted with)
    if (query.no_response === true) {
      filteredLeads = filteredLeads.filter(lead => lead.total_interactions === 0);
    }
    
    // Last active filters
    if (query.last_active_after) {
      const afterDate = new Date(query.last_active_after);
      filteredLeads = filteredLeads.filter(lead =>
        lead.last_activity && new Date(lead.last_activity) >= afterDate
      );
    }
    if (query.last_active_before) {
      const beforeDate = new Date(query.last_active_before);
      filteredLeads = filteredLeads.filter(lead =>
        lead.last_activity && new Date(lead.last_activity) <= beforeDate
      );
    }
    
    // =============================================
    // SORTING
    // =============================================
    
    const sortColumn = query.sort_by || 'score';
    filteredLeads.sort((a, b) => {
      let aVal: any, bVal: any;
      
      switch (sortColumn) {
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
      
      if (query.sort_order === 'asc') {
        return aVal > bVal ? 1 : aVal < bVal ? -1 : 0;
      } else {
        return aVal < bVal ? 1 : aVal > bVal ? -1 : 0;
      }
    });
    
    // =============================================
    // PAGINATION
    // =============================================
    
    const total = filteredLeads.length;
    const totalPages = Math.ceil(total / query.limit!);
    const offset = (query.page! - 1) * query.limit!;
    const paginatedLeads = filteredLeads.slice(offset, offset + query.limit!);
    
    // =============================================
    // CALCULATE STATISTICS
    // =============================================
    
    const stats = {
      total_leads: total,
      hot_leads: filteredLeads.filter(l => l.category === 'Hot Lead').length,
      warm_leads: filteredLeads.filter(l => l.category === 'Warm Lead').length,
      developing_leads: filteredLeads.filter(l => l.category === 'Developing Lead').length,
      cold_leads: filteredLeads.filter(l => l.category === 'Cold Lead').length,
      average_score: total > 0 
        ? filteredLeads.reduce((sum, l) => sum + l.score, 0) / total 
        : 0,
      pending_interactions: filteredLeads.filter(l => l.has_pending_interactions).length,
      no_response_leads: filteredLeads.filter(l => l.total_interactions === 0).length,
    };
    
    // =============================================
    // RETURN RESPONSE
    // =============================================
    
    const hasData = paginatedLeads.length > 0;

    return NextResponse.json({
      success: true,
      data: {
        leads: paginatedLeads,
        pagination: {
          page: query.page,
          limit: query.limit,
          total,
          total_pages: totalPages,
          has_next: query.page! < totalPages,
          has_prev: query.page! > 1,
        },
        stats,
        filters_applied: query,
      },
      isEmpty: !hasData,
    });
  },
  {
    requireAuth: true,
    requireRole: ['builder', 'admin'],
    requirePermission: Permissions.LEAD_VIEW,
    rateLimit: 'api',
    auditAction: AuditActions.VIEW,
    auditResourceType: AuditResourceTypes.LEAD
  }
);

// =============================================
// POST - Create New Lead
// =============================================

export const POST = secureApiRoute(
  async (request: NextRequest, user) => {
    const supabase = createRouteHandlerClient({ cookies });

    try {
      const body = await request.json();
      const { property_id, builder_id, name, email, phone, message, source, budget } = body;

      // Validation
      if (!property_id || !builder_id || !name) {
        return NextResponse.json({
          success: false,
          error: 'Validation Error',
          errorType: 'VALIDATION_ERROR',
          message: 'Missing required fields: property_id, builder_id, name',
        }, { status: 400 });
      }

      if (!email && !phone) {
        return NextResponse.json({
          success: false,
          error: 'Validation Error',
          errorType: 'VALIDATION_ERROR',
          message: 'At least one of email or phone must be provided',
        }, { status: 400 });
      }

      // Calculate initial score
      let initialScore = 5;
      if (email && phone) initialScore += 1;
      if (message && message.length > 50) initialScore += 1;
      if (budget && budget > 0) initialScore += 1;

      // Create lead
      const { data, error } = await supabase
        .from('leads')
        .insert([{
          property_id,
          builder_id,
          name,
          email: email || null,
          phone: phone || null,
          message: message || null,
          source: source || null,
          budget: budget || null,
          score: Math.min(initialScore, 10),
          status: 'new',
        }])
        .select()
        .single();

      if (error) {
        console.error('[API/Leads/POST] Database error:', error);
        const classifiedError = classifySupabaseError(error, data);
        return NextResponse.json({
          success: false,
          error: classifiedError.message,
          errorType: classifiedError.type,
          message: classifiedError.userMessage,
          retryable: classifiedError.retryable,
        }, { status: classifiedError.statusCode || 500 });
      }

      return NextResponse.json({
        success: true,
        data,
        message: 'Lead created successfully',
      }, { status: 201 });

    } catch (error: any) {
      console.error('[API/Leads/POST] Error:', error);
      return NextResponse.json({
        success: false,
        error: 'Internal Server Error',
        errorType: 'UNKNOWN_ERROR',
        message: error.message || 'Failed to create lead',
        retryable: true,
      }, { status: 500 });
    }
  },
  {
    requireAuth: true,
    requireRole: ['builder', 'admin'],
    requirePermission: Permissions.LEAD_CREATE,
    rateLimit: 'api',
    auditAction: AuditActions.CREATE,
    auditResourceType: AuditResourceTypes.LEAD,
  }
);

// =============================================
// PUT/PATCH - Update Lead
// =============================================

export const PUT = secureApiRoute(
  async (request: NextRequest, user) => {
    const supabase = createRouteHandlerClient({ cookies });

    try {
      const body = await request.json();
      const { id, ...updates } = body;

      if (!id) {
        return NextResponse.json({
          success: false,
          error: 'Validation Error',
          errorType: 'VALIDATION_ERROR',
          message: 'Lead ID is required',
        }, { status: 400 });
      }

      // Check if lead exists and user has access
      const { data: existing, error: fetchError } = await supabase
        .from('leads')
        .select('builder_id')
        .eq('id', id)
        .single();

      if (fetchError || !existing) {
        return NextResponse.json({
          success: false,
          error: 'Not Found',
          errorType: 'NOT_FOUND',
          message: 'Lead not found',
        }, { status: 404 });
      }

      // Check authorization (unless admin)
      if (user.role !== 'admin' && existing.builder_id !== user.id) {
        return NextResponse.json({
          success: false,
          error: 'Forbidden',
          errorType: 'AUTH_ERROR',
          message: 'Not authorized to update this lead',
        }, { status: 403 });
      }

      // Update lead
      const { data, error } = await supabase
        .from('leads')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) {
        console.error('[API/Leads/PUT] Database error:', error);
        const classifiedError = classifySupabaseError(error, data);
        return NextResponse.json({
          success: false,
          error: classifiedError.message,
          errorType: classifiedError.type,
          message: classifiedError.userMessage,
          retryable: classifiedError.retryable,
        }, { status: classifiedError.statusCode || 500 });
      }

      return NextResponse.json({
        success: true,
        data,
        message: 'Lead updated successfully',
      });

    } catch (error: any) {
      console.error('[API/Leads/PUT] Error:', error);
      return NextResponse.json({
        success: false,
        error: 'Internal Server Error',
        errorType: 'UNKNOWN_ERROR',
        message: error.message || 'Failed to update lead',
        retryable: true,
      }, { status: 500 });
    }
  },
  {
    requireAuth: true,
    requireRole: ['builder', 'admin'],
    requirePermission: Permissions.LEAD_UPDATE,
    rateLimit: 'api',
    auditAction: AuditActions.UPDATE,
    auditResourceType: AuditResourceTypes.LEAD,
  }
);

export const PATCH = PUT; // PATCH uses same logic as PUT

// =============================================
// DELETE - Delete Lead
// =============================================

export const DELETE = secureApiRoute(
  async (request: NextRequest, user) => {
    const supabase = createRouteHandlerClient({ cookies });

    try {
      const { searchParams } = request.nextUrl;
      const id = searchParams.get('id');

      if (!id) {
        return NextResponse.json({
          success: false,
          error: 'Validation Error',
          errorType: 'VALIDATION_ERROR',
          message: 'Lead ID is required',
        }, { status: 400 });
      }

      // Check if lead exists and user has access
      const { data: existing, error: fetchError } = await supabase
        .from('leads')
        .select('builder_id')
        .eq('id', id)
        .single();

      if (fetchError || !existing) {
        return NextResponse.json({
          success: false,
          error: 'Not Found',
          errorType: 'NOT_FOUND',
          message: 'Lead not found',
        }, { status: 404 });
      }

      // Check authorization (unless admin)
      if (user.role !== 'admin' && existing.builder_id !== user.id) {
        return NextResponse.json({
          success: false,
          error: 'Forbidden',
          errorType: 'AUTH_ERROR',
          message: 'Not authorized to delete this lead',
        }, { status: 403 });
      }

      // Delete lead
      const { error } = await supabase
        .from('leads')
        .delete()
        .eq('id', id);

      if (error) {
        console.error('[API/Leads/DELETE] Database error:', error);
        const classifiedError = classifySupabaseError(error, null);
        return NextResponse.json({
          success: false,
          error: classifiedError.message,
          errorType: classifiedError.type,
          message: classifiedError.userMessage,
          retryable: classifiedError.retryable,
        }, { status: classifiedError.statusCode || 500 });
      }

      return NextResponse.json({
        success: true,
        message: 'Lead deleted successfully',
      });

    } catch (error: any) {
      console.error('[API/Leads/DELETE] Error:', error);
      return NextResponse.json({
        success: false,
        error: 'Internal Server Error',
        errorType: 'UNKNOWN_ERROR',
        message: error.message || 'Failed to delete lead',
        retryable: true,
      }, { status: 500 });
    }
  },
  {
    requireAuth: true,
    requireRole: ['builder', 'admin'],
    requirePermission: Permissions.LEAD_DELETE,
    rateLimit: 'api',
    auditAction: AuditActions.DELETE,
    auditResourceType: AuditResourceTypes.LEAD,
  }
);
// Force rebuild at Wed, Jan 21, 2026  7:25:12 AM
