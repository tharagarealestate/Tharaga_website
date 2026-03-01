/**
 * LAYER 10: BUILDER INTELLIGENCE DASHBOARD
 * Conversion analytics and insights
 */

import { getSupabase } from '@/lib/supabase';

export interface ConversionAnalytics {
  totalLeads: number;
  leadsContacted: number;
  viewingsScheduled: number;
  viewingsCompleted: number;
  negotiationsStarted: number;
  contractsSigned: number;
  dealsClosed: number;
  contactRate: number;
  viewingRate: number;
  negotiationRate: number;
  contractRate: number;
  closeRate: number;
  overallConversionRate: number;
  averageDaysToClose: number;
  averageDealValue: number;
}

/**
 * Calculate conversion analytics for builder
 */
export async function calculateConversionAnalytics(
  builderId: string,
  periodStart: Date,
  periodEnd: Date
): Promise<ConversionAnalytics> {
  const supabase = getSupabase();

  // Get all journeys in period
  const { data: journeys } = await supabase
    .from('buyer_journey')
    .select('*')
    .eq('builder_id', builderId)
    .gte('created_at', periodStart.toISOString())
    .lte('created_at', periodEnd.toISOString());

  const totalLeads = journeys?.length || 0;

  // Count by stage
  const leadsContacted = journeys?.filter(j => j.current_stage !== 'discovery').length || 0;
  const viewingsScheduled = journeys?.filter(j => 
    ['viewing_scheduled', 'viewing_completed', 'negotiation', 'contract', 'closed'].includes(j.current_stage)
  ).length || 0;

  // Get viewings
  const { count: viewingsCompleted } = await supabase
    .from('property_viewings')
    .select('*', { count: 'exact', head: true })
    .eq('builder_id', builderId)
    .eq('status', 'completed')
    .gte('created_at', periodStart.toISOString())
    .lte('created_at', periodEnd.toISOString());

  // Get negotiations
  const { count: negotiationsStarted } = await supabase
    .from('negotiations')
    .select('*', { count: 'exact', head: true })
    .eq('builder_id', builderId)
    .gte('started_at', periodStart.toISOString())
    .lte('started_at', periodEnd.toISOString());

  // Get contracts
  const { count: contractsSigned } = await supabase
    .from('contracts')
    .select('*', { count: 'exact', head: true })
    .eq('builder_id', builderId)
    .eq('status', 'signed_buyer')
    .gte('created_at', periodStart.toISOString())
    .lte('created_at', periodEnd.toISOString());

  // Get closed deals
  const { count: dealsClosed } = await supabase
    .from('deal_lifecycle')
    .select('*', { count: 'exact', head: true })
    .eq('builder_id', builderId)
    .eq('current_stage', 'closed')
    .gte('closed_at', periodStart.toISOString())
    .lte('closed_at', periodEnd.toISOString());

  // Calculate rates
  const contactRate = totalLeads > 0 ? (leadsContacted / totalLeads) * 100 : 0;
  const viewingRate = leadsContacted > 0 ? ((viewingsCompleted || 0) / leadsContacted) * 100 : 0;
  const negotiationRate = (viewingsCompleted || 0) > 0 
    ? ((negotiationsStarted || 0) / (viewingsCompleted || 1)) * 100 
    : 0;
  const contractRate = (negotiationsStarted || 0) > 0
    ? ((contractsSigned || 0) / (negotiationsStarted || 1)) * 100
    : 0;
  const closeRate = (contractsSigned || 0) > 0
    ? ((dealsClosed || 0) / (contractsSigned || 1)) * 100
    : 0;
  const overallConversionRate = totalLeads > 0
    ? ((dealsClosed || 0) / totalLeads) * 100
    : 0;

  // Calculate average days to close
  const { data: closedDeals } = await supabase
    .from('deal_lifecycle')
    .select('total_days_to_close')
    .eq('builder_id', builderId)
    .eq('current_stage', 'closed')
    .not('total_days_to_close', 'is', null)
    .gte('closed_at', periodStart.toISOString())
    .lte('closed_at', periodEnd.toISOString());

  const averageDaysToClose = closedDeals && closedDeals.length > 0
    ? closedDeals.reduce((sum, deal) => sum + (deal.total_days_to_close || 0), 0) / closedDeals.length
    : 0;

  // Calculate average deal value
  const { data: closedContracts } = await supabase
    .from('contracts')
    .select('contract_price')
    .eq('builder_id', builderId)
    .eq('status', 'executed')
    .gte('created_at', periodStart.toISOString())
    .lte('created_at', periodEnd.toISOString());

  const averageDealValue = closedContracts && closedContracts.length > 0
    ? closedContracts.reduce((sum, contract) => sum + (contract.contract_price || 0), 0) / closedContracts.length
    : 0;

  return {
    totalLeads,
    leadsContacted,
    viewingsScheduled,
    viewingsCompleted: viewingsCompleted || 0,
    negotiationsStarted: negotiationsStarted || 0,
    contractsSigned: contractsSigned || 0,
    dealsClosed: dealsClosed || 0,
    contactRate: Math.round(contactRate * 100) / 100,
    viewingRate: Math.round(viewingRate * 100) / 100,
    negotiationRate: Math.round(negotiationRate * 100) / 100,
    contractRate: Math.round(contractRate * 100) / 100,
    closeRate: Math.round(closeRate * 100) / 100,
    overallConversionRate: Math.round(overallConversionRate * 100) / 100,
    averageDaysToClose: Math.round(averageDaysToClose),
    averageDealValue: Math.round(averageDealValue)
  };
}

/**
 * Generate builder insights
 */
export async function generateBuilderInsights(builderId: string): Promise<void> {
  const supabase = getSupabase();

  const now = new Date();
  const lastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
  const thisMonth = new Date(now.getFullYear(), now.getMonth(), 1);

  // Get analytics
  const analytics = await calculateConversionAnalytics(builderId, lastMonth, now);

  // Insight 1: Conversion rate
  if (analytics.overallConversionRate < 10) {
    await supabase
      .from('builder_insights')
      .insert([{
        builder_id: builderId,
        insight_type: 'conversion_rate',
        insight_title: 'Low Conversion Rate Detected',
        insight_description: `Your conversion rate is ${analytics.overallConversionRate.toFixed(1)}%. Industry average is 10-15%.`,
        insight_data: { currentRate: analytics.overallConversionRate },
        insight_recommendation: 'Focus on following up with leads within 24 hours. Use suggested communication templates.',
        potential_impact: 'high',
        estimated_improvement: 5.0
      }]);
  }

  // Insight 2: Optimal price point
  const { data: successfulDeals } = await supabase
    .from('contracts')
    .select('contract_price, property_details')
    .eq('builder_id', builderId)
    .eq('status', 'executed')
    .gte('created_at', lastMonth.toISOString())
    .lte('created_at', now.toISOString());

  if (successfulDeals && successfulDeals.length > 0) {
    const prices = successfulDeals.map(d => d.contract_price || 0).filter(p => p > 0);
    if (prices.length > 0) {
      const avgPrice = prices.reduce((sum, p) => sum + p, 0) / prices.length;
      const minPrice = Math.min(...prices);
      const maxPrice = Math.max(...prices);
      
      await supabase
        .from('builder_insights')
        .insert([{
          builder_id: builderId,
          insight_type: 'optimal_price',
          insight_title: 'Optimal Price Range Identified',
          insight_description: `Your successful deals average ₹${avgPrice.toLocaleString('en-IN')}. Price range: ₹${minPrice.toLocaleString('en-IN')} - ₹${maxPrice.toLocaleString('en-IN')}`,
          insight_data: { 
            averagePrice: avgPrice,
            minPrice,
            maxPrice,
            dealCount: prices.length
          },
          insight_recommendation: 'Price properties within this range for higher conversion rates.',
          potential_impact: 'medium',
          estimated_improvement: 3.0
        }]);
    }
  }

  // Insight 3: Best timing
  const { data: journeyInteractions } = await supabase
    .from('buyer_journey')
    .select('created_at, last_engagement_at, has_responded, emails_opened, emails_clicked')
    .eq('builder_id', builderId)
    .gte('created_at', lastMonth.toISOString())
    .lte('created_at', now.toISOString())
    .not('last_engagement_at', 'is', null);

  if (journeyInteractions && journeyInteractions.length > 0) {
    // Analyze engagement by hour of day
    const engagementByHour: Record<number, number> = {};
    
    journeyInteractions.forEach(journey => {
      if (journey.last_engagement_at) {
        const hour = new Date(journey.last_engagement_at).getHours();
        engagementByHour[hour] = (engagementByHour[hour] || 0) + 1;
      }
    });
    
    const bestHour = Object.entries(engagementByHour)
      .sort(([, a], [, b]) => b - a)[0]?.[0];
    
    if (bestHour) {
      await supabase
        .from('builder_insights')
        .insert([{
          builder_id: builderId,
          insight_type: 'optimal_timing',
          insight_title: 'Best Time to Contact Leads',
          insight_description: `Leads are most responsive at ${bestHour}:00 hours. Schedule your follow-ups during this time.`,
          insight_data: { 
            bestHour: parseInt(bestHour),
            engagementByHour
          },
          insight_recommendation: 'Send emails and make calls during peak engagement hours for better response rates.',
          potential_impact: 'medium',
          estimated_improvement: 2.5
        }]);
    }
  }

  // Insight 4: Stage conversion bottlenecks
  const stageBottlenecks: string[] = [];
  
  if (analytics.contactRate < 50) {
    stageBottlenecks.push('lead_contact');
  }
  if (analytics.viewingRate < 30) {
    stageBottlenecks.push('viewing_scheduling');
  }
  if (analytics.negotiationRate < 40) {
    stageBottlenecks.push('negotiation');
  }
  if (analytics.contractRate < 60) {
    stageBottlenecks.push('contract_signing');
  }
  
  if (stageBottlenecks.length > 0) {
    await supabase
      .from('builder_insights')
      .insert([{
        builder_id: builderId,
        insight_type: 'conversion_bottleneck',
        insight_title: 'Conversion Bottlenecks Detected',
        insight_description: `Your conversion is dropping at: ${stageBottlenecks.join(', ')}. Focus on improving these stages.`,
        insight_data: { 
          bottlenecks: stageBottlenecks,
          contactRate: analytics.contactRate,
          viewingRate: analytics.viewingRate,
          negotiationRate: analytics.negotiationRate,
          contractRate: analytics.contractRate
        },
        insight_recommendation: 'Use communication suggestions and automation to improve conversion at these stages.',
        potential_impact: 'high',
        estimated_improvement: 5.0
      }]);
  }
}

