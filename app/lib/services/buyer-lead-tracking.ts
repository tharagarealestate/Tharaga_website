import { createClient } from '@supabase/supabase-js';

interface LeadTracking {
  id: string;
  leadId: number;
  displayStatus: string;
  timeline: Array<{
    event: string;
    timestamp: string;
    details?: string;
  }>;
  firstResponseAt?: string;
  lastActivityAt?: string;
  responseCount: number;
  isFavorite: boolean;
  buyerNotes?: string;
  property: {
    id: string;
    title: string;
    image?: string;
    price?: number;
    location: string;
  };
  builder: {
    id: string;
    companyName: string;
    logo?: string;
    isVerified: boolean;
  };
  siteVisit?: {
    id: string;
    status: string;
    scheduledDate: string;
    scheduledTime: string;
  };
}

interface LeadActivity {
  id: string;
  type: string;
  title: string;
  description?: string;
  timestamp: string;
  actorType: string;
}

export class BuyerLeadTrackingService {
  private supabase: ReturnType<typeof createClient>;

  constructor() {
    this.supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );
  }

  /**
   * Get all leads for a buyer with tracking info
   */
  async getBuyerLeads(
    buyerId: string,
    options: {
      status?: string;
      limit?: number;
      offset?: number;
    } = {}
  ): Promise<{ leads: LeadTracking[]; total: number }> {
    const { status, limit = 20, offset = 0 } = options;

    let query = this.supabase
      .from('buyer_lead_tracking')
      .select(
        `
        *,
        lead:leads!inner(
          id,
          status,
          created_at,
          property:properties(
            id,
            title,
            images,
            price_inr,
            city,
            locality
          ),
          builder:builder_profiles(
            id,
            company_name,
            logo_url,
            verification_status
          )
        ),
        site_visit:site_visits(
          id,
          status,
          requested_date,
          requested_time_slot,
          confirmed_datetime
        )
      `,
        { count: 'exact' }
      )
      .eq('buyer_id', buyerId)
      .order('last_activity_at', { ascending: false, nullsFirst: false });

    if (status) {
      query = query.eq('display_status', status);
    }

    query = query.range(offset, offset + limit - 1);

    const { data, count, error } = await query;

    if (error) {
      throw new Error('Failed to fetch leads');
    }

    return {
      leads: (data || []).map(this.mapLeadTracking),
      total: count || 0,
    };
  }

  /**
   * Get single lead details for buyer
   */
  async getLeadDetails(
    leadId: number,
    buyerId: string
  ): Promise<LeadTracking | null> {
    const { data, error } = await this.supabase
      .from('buyer_lead_tracking')
      .select(
        `
        *,
        lead:leads!inner(
          *,
          property:properties(
            *,
            builder:builder_profiles(*)
          )
        ),
        site_visit:site_visits(*)
      `
      )
      .eq('lead_id', leadId)
      .eq('buyer_id', buyerId)
      .single();

    if (error || !data) return null;

    return this.mapLeadTracking(data);
  }

  /**
   * Get lead activity timeline
   */
  async getLeadActivities(
    leadId: number,
    buyerId: string
  ): Promise<LeadActivity[]> {
    // Verify buyer owns this lead
    const { data: tracking } = await this.supabase
      .from('buyer_lead_tracking')
      .select('id')
      .eq('lead_id', leadId)
      .eq('buyer_id', buyerId)
      .single();

    if (!tracking) {
      throw new Error('Lead not found');
    }

    const { data: activities } = await this.supabase
      .from('lead_activity_log')
      .select('*')
      .eq('lead_id', leadId)
      .eq('visible_to_buyer', true)
      .order('created_at', { ascending: false });

    return (activities || []).map((a: any) => ({
      id: a.id,
      type: a.activity_type,
      title: a.title,
      description: a.description,
      timestamp: a.created_at,
      actorType: a.actor_type,
    }));
  }

  /**
   * Toggle favorite status
   */
  async toggleFavorite(leadId: number, buyerId: string): Promise<boolean> {
    const { data: current } = await this.supabase
      .from('buyer_lead_tracking')
      .select('is_favorite')
      .eq('lead_id', leadId)
      .eq('buyer_id', buyerId)
      .single();

    const newValue = !current?.is_favorite;

    await this.supabase
      .from('buyer_lead_tracking')
      .update({
        is_favorite: newValue,
        updated_at: new Date().toISOString(),
      })
      .eq('lead_id', leadId)
      .eq('buyer_id', buyerId);

    return newValue;
  }

  /**
   * Update buyer notes
   */
  async updateNotes(
    leadId: number,
    buyerId: string,
    notes: string
  ): Promise<void> {
    await this.supabase
      .from('buyer_lead_tracking')
      .update({
        buyer_notes: notes,
        updated_at: new Date().toISOString(),
      })
      .eq('lead_id', leadId)
      .eq('buyer_id', buyerId);
  }

  /**
   * Get lead statistics for buyer dashboard
   */
  async getBuyerLeadStats(buyerId: string): Promise<{
    total: number;
    byStatus: Record<string, number>;
    responseRate: number;
    avgResponseTime: number | null;
  }> {
    const { data, error } = await this.supabase
      .from('buyer_lead_tracking')
      .select('display_status, first_response_at, created_at')
      .eq('buyer_id', buyerId);

    if (error || !data || data.length === 0) {
      return {
        total: 0,
        byStatus: {},
        responseRate: 0,
        avgResponseTime: null,
      };
    }

    const byStatus: Record<string, number> = {};
    let respondedCount = 0;
    let totalResponseTime = 0;
    let responseTimeCount = 0;

    for (const lead of data as any[]) {
      byStatus[lead.display_status] = (byStatus[lead.display_status] || 0) + 1;

      if (lead.first_response_at) {
        respondedCount++;
        const responseTime =
          new Date(lead.first_response_at).getTime() -
          new Date(lead.created_at).getTime();
        totalResponseTime += responseTime;
        responseTimeCount++;
      }
    }

    return {
      total: data.length,
      byStatus,
      responseRate: (respondedCount / data.length) * 100,
      avgResponseTime:
        responseTimeCount > 0
          ? totalResponseTime / responseTimeCount / (1000 * 60 * 60)
          : null,
    };
  }

  /**
   * Update lead status from builder actions
   */
  async updateFromBuilderAction(
    leadId: number,
    action:
      | 'responded'
      | 'called'
      | 'site_visit_scheduled'
      | 'site_visit_completed'
      | 'proposal_sent',
    details?: string
  ): Promise<void> {
    const statusMap: Record<string, string> = {
      responded: 'contacted',
      called: 'contacted',
      site_visit_scheduled: 'site_visit',
      site_visit_completed: 'negotiating',
      proposal_sent: 'negotiating',
    };

    const eventMap: Record<string, string> = {
      responded: 'Builder Responded',
      called: 'Builder Called',
      site_visit_scheduled: 'Site Visit Scheduled',
      site_visit_completed: 'Site Visit Completed',
      proposal_sent: 'Proposal Received',
    };

    const { data: tracking } = await this.supabase
      .from('buyer_lead_tracking')
      .select('*')
      .eq('lead_id', leadId)
      .single();

    if (!tracking) return;

    const newTimeline = [
      ...(tracking.timeline || []),
      {
        event: eventMap[action],
        timestamp: new Date().toISOString(),
        details,
      },
    ];

    const updateData: any = {
      timeline: newTimeline,
      last_activity_at: new Date().toISOString(),
      response_count: (tracking.response_count || 0) + 1,
      updated_at: new Date().toISOString(),
    };

    const statusOrder = [
      'submitted',
      'viewed',
      'contacted',
      'site_visit',
      'negotiating',
    ];
    const currentIndex = statusOrder.indexOf(tracking.display_status);
    const newIndex = statusOrder.indexOf(statusMap[action]);

    if (newIndex > currentIndex) {
      updateData.display_status = statusMap[action];
    }

    if (!tracking.first_response_at && action === 'responded') {
      updateData.first_response_at = new Date().toISOString();
    }

    await this.supabase
      .from('buyer_lead_tracking')
      .update(updateData)
      .eq('lead_id', leadId);

    await this.supabase.from('lead_activity_log').insert({
      lead_id: leadId,
      activity_type: action,
      title: eventMap[action],
      description: details,
      actor_type: 'builder',
      visible_to_buyer: true,
    });
  }

  /**
   * Map database record to interface
   */
  private mapLeadTracking(data: any): LeadTracking {
    return {
      id: data.id,
      leadId: Number(data.lead_id),
      displayStatus: data.display_status,
      timeline: data.timeline || [],
      firstResponseAt: data.first_response_at,
      lastActivityAt: data.last_activity_at,
      responseCount: data.response_count || 0,
      isFavorite: data.is_favorite || false,
      buyerNotes: data.buyer_notes,
      property: {
        id: data.lead?.property?.id,
        title: data.lead?.property?.title,
        image: (data.lead?.property?.images || [])[0],
        price: data.lead?.property?.price_inr,
        location: [
          data.lead?.property?.locality,
          data.lead?.property?.city,
        ]
          .filter(Boolean)
          .join(', '),
      },
      builder: {
        id: data.lead?.builder?.id,
        companyName: data.lead?.builder?.company_name,
        logo: data.lead?.builder?.logo_url,
        isVerified: data.lead?.builder?.verification_status === 'verified',
      },
      siteVisit:
        Array.isArray(data.site_visit) && data.site_visit[0]
          ? {
              id: data.site_visit[0].id,
              status: data.site_visit[0].status,
              scheduledDate: data.site_visit[0].requested_date,
              scheduledTime: data.site_visit[0].requested_time_slot,
            }
          : undefined,
    };
  }
}

export const buyerLeadTrackingService = new BuyerLeadTrackingService();




