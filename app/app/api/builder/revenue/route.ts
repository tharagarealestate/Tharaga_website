import { NextRequest, NextResponse } from 'next/server'
import { getBuilderUser, ADMIN_EMAIL } from '../_lib/auth'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

/**
 * Real-time Revenue API
 * Calculates revenue from multiple sources:
 * - Commission transactions (from closed deals)
 * - Payment history (subscription payments, etc.)
 * - Property sales
 * - Affiliate commissions
 *
 * Fix (2026-03-05): switched from getSupabase().auth.getUser() (no-op server-side)
 * to getBuilderUser(req) which reads Bearer token from Authorization header — same
 * pattern as properties, stats/realtime, and subscription routes.
 */
export async function GET(request: NextRequest) {
  try {
    // ── Auth: Accept Bearer token (localStorage sessions) OR cookie ──────
    const authed = await getBuilderUser(request)
    if (!authed) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
    }
    const { user, isAdmin, serviceClient: supabase } = authed

    // Get builder profile
    const { data: builderProfile } = await supabase
      .from('builder_profiles')
      .select('id, builder_name')
      .eq('user_id', user.id)
      .single()

    if (!builderProfile) {
      return NextResponse.json({ success: false, error: 'Builder profile not found' }, { status: 404 })
    }

    // ── Subscription gate: admins always bypass; others need Pro/Enterprise ──
    if (!isAdmin) {
      const { data: subscription } = await supabase
        .from('builder_subscriptions')
        .select('status, tier')
        .eq('builder_id', builderProfile.id)
        .in('status', ['active', 'trialing'])
        .single()

      const hasAccess = subscription &&
        (subscription.tier === 'professional' ||
         subscription.tier === 'enterprise' ||
         subscription.status === 'trialing')

      if (!hasAccess) {
        return NextResponse.json(
          {
            success: false,
            error: 'Revenue feature requires Professional or Enterprise plan',
            requiresUpgrade: true,
          },
          { status: 403 }
        )
      }
    }

    const builderId = builderProfile.id

    // Get date ranges
    const now = new Date()
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)
    const startOfYear = new Date(now.getFullYear(), 0, 1)
    const startOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1)
    const endOfLastMonth = new Date(now.getFullYear(), now.getMonth(), 0)

    // ============================================
    // 1. COMMISSION TRANSACTIONS (Closed Deals)
    // ============================================
    const commQuery = supabase
      .from('commission_transactions')
      .select('commission_amount, deal_value, status, created_at, lead_id, property_id')
      .in('status', ['completed', 'pending'])
    if (!isAdmin) commQuery.eq('user_id', user.id)
    const { data: commissions, error: commError } = await commQuery

    // Handle case where table might not exist or no permissions
    if (commError) {
      console.error('[Revenue API] Commission error:', commError)
      // Continue with empty commissions array - don't fail the entire request
    }

    // Calculate commission revenue
    const totalCommissions = commissions?.filter(c => c.status === 'completed')
      .reduce((sum, c) => sum + Number(c.commission_amount || 0), 0) || 0
    
    const pendingCommissions = commissions?.filter(c => c.status === 'pending')
      .reduce((sum, c) => sum + Number(c.commission_amount || 0), 0) || 0

    const monthlyCommissions = commissions?.filter(c => 
      c.status === 'completed' && 
      new Date(c.created_at) >= startOfMonth
    ).reduce((sum, c) => sum + Number(c.commission_amount || 0), 0) || 0

    const lastMonthCommissions = commissions?.filter(c => 
      c.status === 'completed' && 
      new Date(c.created_at) >= startOfLastMonth &&
      new Date(c.created_at) <= endOfLastMonth
    ).reduce((sum, c) => sum + Number(c.commission_amount || 0), 0) || 0

    // ============================================
    // 2. PAYMENT HISTORY (Subscription Revenue)
    // ============================================
    const payQuery = supabase
      .from('payment_history')
      .select('amount, status, payment_type, created_at, paid_at')
      .in('status', ['succeeded', 'pending'])
    if (!isAdmin) payQuery.eq('user_id', user.id)
    const { data: payments, error: payError } = await payQuery

    if (payError) {
      console.error('[Revenue API] Payment error:', payError)
    }

    // Calculate subscription revenue (money builder pays to platform - not revenue for builder)
    // Actually, for builder revenue, we want money they RECEIVE, not pay
    // So we'll focus on commissions and property sales

    // ============================================
    // 3. PROPERTY SALES (Direct Revenue)
    // ============================================
    // Get properties with sales/closed status
    const { data: properties, error: propError } = await supabase
      .from('properties')
      .select('id, price, status, sold_at, builder_id')
      .eq('builder_id', builderId)

    if (propError) {
      console.error('[Revenue API] Property error:', propError)
    }

    // Calculate property sales revenue
    const soldProperties = properties?.filter(p => 
      p.status === 'sold' || p.status === 'closed' || p.sold_at
    ) || []

    const totalPropertySales = soldProperties.reduce((sum, p) => 
      sum + Number(p.price || 0), 0
    )

    const monthlyPropertySales = soldProperties.filter(p => {
      const soldDate = p.sold_at ? new Date(p.sold_at) : new Date()
      return soldDate >= startOfMonth
    }).reduce((sum, p) => sum + Number(p.price || 0), 0)

    // ============================================
    // 4. AFFILIATE COMMISSIONS (If applicable)
    // ============================================
    // This would come from affiliate commission transactions
    // For now, we'll set to 0 as it requires additional setup
    const affiliateCommissions = 0

    // ============================================
    // 5. CALCULATE TOTAL REVENUE
    // ============================================
    // Builder revenue = Commissions received (not property sales value, but commission on sales)
    // Total revenue = All completed commissions + pending commissions
    const totalRevenue = totalCommissions + pendingCommissions + affiliateCommissions
    const monthlyRevenue = monthlyCommissions + affiliateCommissions
    const yearlyRevenue = commissions?.filter(c => 
      c.status === 'completed' && 
      new Date(c.created_at) >= startOfYear
    ).reduce((sum, c) => sum + Number(c.commission_amount || 0), 0) || 0

    // Calculate growth
    const monthlyGrowth = lastMonthCommissions > 0 
      ? ((monthlyCommissions - lastMonthCommissions) / lastMonthCommissions) * 100
      : monthlyCommissions > 0 ? 100 : 0

    // ============================================
    // 6. PIPELINE VALUE (Potential Revenue)
    // ============================================
    // Get hot/warm leads and calculate potential commission
    const leadsQuery = supabase
      .from('leads')
      .select('id, category, property_interest, builder_id')
      .in('category', ['hot', 'warm'])
    if (!isAdmin) leadsQuery.eq('builder_id', builderId)
    const { data: leads } = await leadsQuery

    const avgPropertyPrice = properties && properties.length > 0
      ? properties.reduce((sum, p) => sum + Number(p.price || 0), 0) / properties.length
      : 0

    // Assume 2% commission rate
    const commissionRate = 0.02
    const pipelineValue = (leads?.length || 0) * avgPropertyPrice * commissionRate

    // ============================================
    // 7. RECENT TRANSACTIONS
    // ============================================
    const recentCommissions = commissions
      ?.filter(c => c.status === 'completed')
      .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
      .slice(0, 10)
      .map(c => ({
        id: c.lead_id || c.property_id || 'unknown',
        type: 'commission',
        amount: Number(c.commission_amount || 0),
        dealValue: Number(c.deal_value || 0),
        date: c.created_at,
        status: c.status
      })) || []

    const res = NextResponse.json({
      success: true,
      data: {
        // Current Revenue
        totalRevenue,
        monthlyRevenue,
        yearlyRevenue,
        pendingRevenue: pendingCommissions,
        
        // Growth Metrics
        monthlyGrowth: parseFloat(monthlyGrowth.toFixed(2)),
        lastMonthRevenue: lastMonthCommissions,
        
        // Breakdown
        breakdown: {
          commissions: totalCommissions,
          pendingCommissions,
          affiliateCommissions,
          propertySales: totalPropertySales,
          monthlyPropertySales
        },
        
        // Pipeline
        pipelineValue: parseFloat(pipelineValue.toFixed(2)),
        pipelineLeads: leads?.length || 0,
        avgPropertyPrice: parseFloat(avgPropertyPrice.toFixed(2)),
        commissionRate: commissionRate * 100, // As percentage
        
        // Recent Activity
        recentTransactions: recentCommissions,
        
        // Statistics
        stats: {
          totalDeals: commissions?.filter(c => c.status === 'completed').length || 0,
          pendingDeals: commissions?.filter(c => c.status === 'pending').length || 0,
          avgDealSize: commissions && commissions.length > 0
            ? commissions.filter(c => c.status === 'completed')
                .reduce((sum, c) => sum + Number(c.deal_value || 0), 0) / 
              commissions.filter(c => c.status === 'completed').length
            : 0,
          avgCommission: totalCommissions > 0 && commissions
            ? totalCommissions / (commissions.filter(c => c.status === 'completed').length || 1)
            : 0
        },
        
        // Time-based data for charts
        timeline: {
          thisMonth: monthlyRevenue,
          lastMonth: lastMonthCommissions,
          thisYear: yearlyRevenue
        }
      }
    });
    res.headers.set('Cache-Control', 'private, s-maxage=60, stale-while-revalidate=120');
    return res;
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : 'Failed to fetch revenue data'
    console.error('[Revenue API] Error:', msg)
    return NextResponse.json({ success: false, error: msg }, { status: 500 })
  }
}

