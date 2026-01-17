/**
 * Ultra Automation - Negotiations API
 * GET /api/ultra-automation/negotiations?builder_id=xxx
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { classifySupabaseError } from '@/lib/error-handler';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ 
        success: false,
        error: 'Unauthorized',
        errorType: 'AUTH_ERROR',
        message: 'Please log in to continue.'
      }, { status: 401 });
    }

    // Verify user has builder profile
    const { data: builderProfile, error: profileError } = await supabase
      .from('builder_profiles')
      .select('id, company_name')
      .eq('user_id', user.id)
      .maybeSingle();

    if (profileError || !builderProfile) {
      return NextResponse.json({ 
        success: false,
        error: 'Forbidden',
        errorType: 'AUTH_ERROR',
        message: 'Builder profile required. Please complete your builder profile to access this feature.'
      }, { status: 403 });
    }

    // Check if company_name is filled (required)
    if (!builderProfile.company_name || builderProfile.company_name.trim() === '') {
      return NextResponse.json({ 
        success: false,
        error: 'Forbidden',
        errorType: 'AUTH_ERROR',
        message: 'Please complete your builder profile (company name required).'
      }, { status: 403 });
    }

    const searchParams = request.nextUrl.searchParams;
    const builderId = searchParams.get('builder_id') || builderProfile.id;
    const status = searchParams.get('status'); // 'active', 'completed', 'cancelled'

    let query = supabase
      .from('negotiations')
      .select(`
        *,
        journey:buyer_journey(
          *,
          lead:generated_leads(*),
          property:properties(*)
        )
      `)
      .eq('builder_id', builderId)
      .order('created_at', { ascending: false });

    if (status) {
      query = query.eq('status', status);
    }

    const { data: negotiations, error } = await query;

    if (error) {
      console.error('[Ultra Automation] Negotiations API Error:', error);
      const classifiedError = classifySupabaseError(error, negotiations);
      
      return NextResponse.json({
        success: false,
        error: classifiedError.message,
        errorType: classifiedError.type,
        message: classifiedError.userMessage,
        retryable: classifiedError.retryable,
        technicalDetails: classifiedError.technicalDetails,
      }, { status: classifiedError.statusCode || 500 });
    }

    const hasData = negotiations && negotiations.length > 0;

    // Fetch price strategy insights
    const negotiationIds = (negotiations || []).map((n: any) => n.id);
    let insights: any[] = [];
    
    if (negotiationIds.length > 0) {
      const { data: insightsData, error: insightsError } = await supabase
        .from('price_strategy_insights')
        .select('*')
        .in('negotiation_id', negotiationIds)
        .order('created_at', { ascending: false });
      
      if (insightsError) {
        console.warn('[Ultra Automation] Insights fetch warning:', insightsError);
      } else {
        insights = insightsData || [];
      }
    }

    return NextResponse.json({
      success: true,
      data: {
        negotiations: negotiations || [],
        insights,
      },
      isEmpty: !hasData,
    });

  } catch (error: any) {
    console.error('[Ultra Automation] Negotiations API Error:', error);
    const classifiedError = classifySupabaseError(error);
    
    return NextResponse.json({
      success: false,
      error: classifiedError.message,
      errorType: classifiedError.type,
      message: classifiedError.userMessage,
      retryable: classifiedError.retryable,
      technicalDetails: classifiedError.technicalDetails,
    }, { status: classifiedError.statusCode || 500 });
  }
}

