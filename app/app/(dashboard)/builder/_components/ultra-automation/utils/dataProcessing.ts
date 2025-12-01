/**
 * Ultra Automation Data Processing Utilities
 * Advanced algorithms for filtering, sorting, and analyzing Ultra Automation data
 */

export interface ViewingData {
  id: string;
  scheduled_at: string;
  status: 'scheduled' | 'completed' | 'cancelled';
  lead?: any;
  property?: any;
  reminders?: any[];
}

export interface NegotiationData {
  id: string;
  current_price: number;
  asking_price: number;
  status: 'active' | 'completed' | 'cancelled';
  journey?: any;
  insights?: any[];
}

export interface ContractData {
  id: string;
  status: 'draft' | 'sent' | 'signed' | 'expired';
  created_at: string;
  signed_at?: string;
  journey?: any;
}

export interface DealLifecycleData {
  id: string;
  current_stage: string;
  is_stalling: boolean;
  days_in_stage: number;
  journey?: any;
}

/**
 * Smart filtering algorithm for viewings
 * Prioritizes by urgency, lead quality, and time proximity
 */
export function filterAndSortViewings(
  viewings: ViewingData[],
  filters: {
    status?: 'scheduled' | 'completed' | 'cancelled';
    upcoming?: boolean;
    dateRange?: { start: string; end: string };
  } = {}
): ViewingData[] {
  let filtered = [...viewings];

  // Status filter
  if (filters.status) {
    filtered = filtered.filter((v) => v.status === filters.status);
  }

  // Upcoming filter (next 7 days)
  if (filters.upcoming) {
    const now = new Date();
    const nextWeek = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
    filtered = filtered.filter((v) => {
      const scheduledDate = new Date(v.scheduled_at);
      return scheduledDate >= now && scheduledDate <= nextWeek;
    });
  }

  // Date range filter
  if (filters.dateRange) {
    filtered = filtered.filter((v) => {
      const scheduledDate = new Date(v.scheduled_at);
      return (
        scheduledDate >= new Date(filters.dateRange!.start) &&
        scheduledDate <= new Date(filters.dateRange!.end)
      );
    });
  }

  // Smart sorting: priority algorithm
  return filtered.sort((a, b) => {
    const dateA = new Date(a.scheduled_at).getTime();
    const dateB = new Date(b.scheduled_at).getTime();

    // Calculate urgency score (0-100)
    const now = Date.now();
    const hoursUntilA = (dateA - now) / (1000 * 60 * 60);
    const hoursUntilB = (dateB - now) / (1000 * 60 * 60);

    // Urgency score: closer to now = higher priority
    const urgencyA = hoursUntilA > 0 ? Math.max(0, 100 - hoursUntilA / 24 * 10) : 0;
    const urgencyB = hoursUntilB > 0 ? Math.max(0, 100 - hoursUntilB / 24 * 10) : 0;

    // Lead quality score (if available)
    const qualityA = a.lead?.intent_score || a.lead?.quality_score || 50;
    const qualityB = b.lead?.intent_score || b.lead?.quality_score || 50;

    // Combined priority score
    const priorityA = urgencyA * 0.6 + qualityA * 0.4;
    const priorityB = urgencyB * 0.6 + qualityB * 0.4;

    return priorityB - priorityA;
  });
}

/**
 * Advanced negotiation analysis algorithm
 * Calculates optimal pricing strategies and success probability
 */
export function analyzeNegotiations(negotiations: NegotiationData[]): {
  activeCount: number;
  avgPriceGap: number;
  successProbability: number;
  recommendations: Array<{
    negotiationId: string;
    recommendedAction: string;
    priority: 'high' | 'medium' | 'low';
    reasoning: string;
  }>;
} {
  const active = negotiations.filter((n) => n.status === 'active');
  const activeCount = active.length;

  // Calculate average price gap
  const priceGaps = active.map((n) => {
    const gap = Math.abs(n.asking_price - n.current_price);
    const percentage = (gap / n.asking_price) * 100;
    return { gap, percentage };
  });

  const avgPriceGap =
    priceGaps.length > 0
      ? priceGaps.reduce((sum, p) => sum + p.percentage, 0) / priceGaps.length
      : 0;

  // Calculate success probability based on price gap and journey stage
  const successProbability = active.reduce((sum, n) => {
    const gapPercent = Math.abs((n.asking_price - n.current_price) / n.asking_price) * 100;
    // Smaller gap = higher success probability
    const gapScore = Math.max(0, 100 - gapPercent * 2);
    
    // Journey stage score (later stages = higher success)
    const stageScore = n.journey?.current_stage === 'negotiation' ? 80 : 50;
    
    // Combined probability
    const prob = (gapScore * 0.7 + stageScore * 0.3) / 100;
    return sum + prob;
  }, 0) / Math.max(1, activeCount) * 100;

  // Generate recommendations
  const recommendations = active.map((n) => {
    const gapPercent = Math.abs((n.asking_price - n.current_price) / n.asking_price) * 100;
    const gap = Math.abs(n.asking_price - n.current_price);

    let recommendedAction = '';
    let priority: 'high' | 'medium' | 'low' = 'medium';
    let reasoning = '';

    if (gapPercent < 5) {
      recommendedAction = 'Accept offer - Gap is minimal';
      priority = 'high';
      reasoning = `Price gap is only ${gapPercent.toFixed(1)}%. This is an excellent deal.`;
    } else if (gapPercent < 15) {
      recommendedAction = 'Counter with small adjustment';
      priority = 'high';
      reasoning = `Price gap is ${gapPercent.toFixed(1)}%. Consider a small counter-offer.`;
    } else if (gapPercent < 30) {
      recommendedAction = 'Negotiate further - Moderate gap';
      priority = 'medium';
      reasoning = `Price gap is ${gapPercent.toFixed(1)}%. Room for negotiation exists.`;
    } else {
      recommendedAction = 'Review pricing strategy';
      priority = 'low';
      reasoning = `Large price gap (${gapPercent.toFixed(1)}%). May need to adjust expectations.`;
    }

    return {
      negotiationId: n.id,
      recommendedAction,
      priority,
      reasoning,
    };
  });

  return {
    activeCount,
    avgPriceGap,
    successProbability,
    recommendations,
  };
}

/**
 * Contract status analysis with urgency scoring
 */
export function analyzeContracts(contracts: ContractData[]): {
  byStatus: Record<string, number>;
  urgent: ContractData[];
  expiringSoon: ContractData[];
  signedThisMonth: number;
} {
  const byStatus: Record<string, number> = {};
  const urgent: ContractData[] = [];
  const expiringSoon: ContractData[] = [];
  let signedThisMonth = 0;

  const now = new Date();
  const thisMonthStart = new Date(now.getFullYear(), now.getMonth(), 1);

  contracts.forEach((contract) => {
    // Count by status
    byStatus[contract.status] = (byStatus[contract.status] || 0) + 1;

    // Urgent: Sent but not signed for > 7 days
    if (contract.status === 'sent') {
      const sentDate = new Date(contract.created_at);
      const daysSinceSent = (now.getTime() - sentDate.getTime()) / (1000 * 60 * 60 * 24);
      if (daysSinceSent > 7) {
        urgent.push(contract);
      }
    }

    // Expiring soon: Draft for > 14 days
    if (contract.status === 'draft') {
      const draftDate = new Date(contract.created_at);
      const daysSinceDraft = (now.getTime() - draftDate.getTime()) / (1000 * 60 * 60 * 24);
      if (daysSinceDraft > 14) {
        expiringSoon.push(contract);
      }
    }

    // Count signed this month
    if (contract.status === 'signed' && contract.signed_at) {
      const signedDate = new Date(contract.signed_at);
      if (signedDate >= thisMonthStart) {
        signedThisMonth++;
      }
    }
  });

  return {
    byStatus,
    urgent,
    expiringSoon,
    signedThisMonth,
  };
}

/**
 * Deal lifecycle stalling detection algorithm
 * Identifies deals that need attention
 */
export function detectStallingDeals(
  lifecycles: DealLifecycleData[],
  thresholds: {
    warningDays?: number;
    criticalDays?: number;
  } = {}
): {
  stalled: DealLifecycleData[];
  atRisk: DealLifecycleData[];
  healthy: DealLifecycleData[];
  avgDaysPerStage: Record<string, number>;
} {
  const warningDays = thresholds.warningDays || 7;
  const criticalDays = thresholds.criticalDays || 14;

  const stalled: DealLifecycleData[] = [];
  const atRisk: DealLifecycleData[] = [];
  const healthy: DealLifecycleData[] = [];

  // Track average days per stage
  const stageDays: Record<string, number[]> = {};

  lifecycles.forEach((lifecycle) => {
    const stage = lifecycle.current_stage;
    
    if (!stageDays[stage]) {
      stageDays[stage] = [];
    }
    stageDays[stage].push(lifecycle.days_in_stage);

    // Categorize based on days in stage
    if (lifecycle.is_stalling || lifecycle.days_in_stage > criticalDays) {
      stalled.push(lifecycle);
    } else if (lifecycle.days_in_stage > warningDays) {
      atRisk.push(lifecycle);
    } else {
      healthy.push(lifecycle);
    }
  });

  // Calculate average days per stage
  const avgDaysPerStage: Record<string, number> = {};
  Object.entries(stageDays).forEach(([stage, days]) => {
    avgDaysPerStage[stage] = days.reduce((sum, d) => sum + d, 0) / days.length;
  });

  return {
    stalled,
    atRisk,
    healthy,
    avgDaysPerStage,
  };
}

/**
 * Calculate conversion funnel metrics from buyer journeys
 */
export function calculateConversionFunnel(journeys: any[]): {
  stages: Array<{
    stage: string;
    count: number;
    percentage: number;
    avgDays: number;
  }>;
  overallConversion: number;
  bottleneckStages: string[];
} {
  const stageCounts: Record<string, { count: number; totalDays: number; daysCount: number }> = {};

  journeys.forEach((journey) => {
    const stage = journey.current_stage || 'discovery';
    if (!stageCounts[stage]) {
      stageCounts[stage] = { count: 0, totalDays: 0, daysCount: 0 };
    }
    stageCounts[stage].count++;
    
    if (journey.days_in_stage) {
      stageCounts[stage].totalDays += journey.days_in_stage;
      stageCounts[stage].daysCount++;
    }
  });

  const stages = Object.entries(stageCounts).map(([stage, data]) => ({
    stage,
    count: data.count,
    percentage: (data.count / journeys.length) * 100,
    avgDays: data.daysCount > 0 ? data.totalDays / data.daysCount : 0,
  }));

  // Calculate overall conversion (reached negotiation or closed)
  const converted = journeys.filter(
    (j) => j.current_stage === 'negotiation' || j.current_stage === 'closed'
  ).length;
  const overallConversion = journeys.length > 0 ? (converted / journeys.length) * 100 : 0;

  // Identify bottleneck stages (stages where deals spend >2x average time)
  const overallAvgDays = stages.reduce((sum, s) => sum + s.avgDays, 0) / stages.length;
  const bottleneckStages = stages
    .filter((s) => s.avgDays > overallAvgDays * 2 && s.count > 0)
    .map((s) => s.stage);

  return {
    stages,
    overallConversion,
    bottleneckStages,
  };
}

/**
 * Smart date formatting with relative time
 */
export function formatSmartDate(dateString: string): {
  absolute: string;
  relative: string;
  isUrgent: boolean;
} {
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = date.getTime() - now.getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));

  let relative = '';
  let isUrgent = false;

  if (diffMs < 0) {
    // Past
    if (diffDays === -1) {
      relative = 'Yesterday';
    } else if (diffDays > -7) {
      relative = `${Math.abs(diffDays)} days ago`;
    } else {
      relative = date.toLocaleDateString();
    }
  } else {
    // Future
    if (diffHours < 24) {
      relative = `In ${diffHours} hours`;
      isUrgent = diffHours < 6;
    } else if (diffDays === 1) {
      relative = 'Tomorrow';
      isUrgent = true;
    } else if (diffDays < 7) {
      relative = `In ${diffDays} days`;
      isUrgent = diffDays <= 2;
    } else {
      relative = date.toLocaleDateString();
    }
  }

  return {
    absolute: date.toLocaleString(),
    relative,
    isUrgent,
  };
}

