/**
 * Ultra Automation - Deal Lifecycle API
 * GET /api/ultra-automation/deal-lifecycle?builder_id=xxx
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { classifySupabaseError, type ClassifiedError } from '@/lib/error-handler';

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

    // Check if user is admin (admins bypass builder profile requirement)
    // Check both user_roles table and profiles table for admin role
    const [userRolesResult, profileResult] = await Promise.all([
      supabase.from('user_roles').select('role').eq('user_id', user.id),
      supabase.from('profiles').select('role').eq('id', user.id).maybeSingle()
    ]);

    const isAdmin = 
      userRolesResult.data?.some((r: any) => r.role === 'admin') || 
      profileResult.data?.role === 'admin' || 
      false;

    // Verify user has builder profile (unless admin)
    const { data: builderProfile, error: profileError } = await supabase
      .from('builder_profiles')
      .select('id, company_name')
      .eq('user_id', user.id)
      .maybeSingle();

    // Non-admin users must have builder profile
    if (!isAdmin) {
      if (profileError || !builderProfile) {
        return NextResponse.json({ 
          success: false,
          error: 'Forbidden',
          errorType: 'AUTH_ERROR',
          message: 'Builder profile required. Please complete your builder profile to access this feature.'
        }, { status: 403 });
      }

      // Check if company_name is filled (required for non-admin builders)
      if (!builderProfile.company_name || builderProfile.company_name.trim() === '') {
        return NextResponse.json({ 
          success: false,
          error: 'Forbidden',
          errorType: 'AUTH_ERROR',
          message: 'Please complete your builder profile (company name required).'
        }, { status: 403 });
      }
    }

    const searchParams = request.nextUrl.searchParams;
    // For admins without builder profile, use user.id; otherwise use builderProfile.id
    const builderId = searchParams.get('builder_id') || (builderProfile?.id || (isAdmin ? user.id : null));
    const stage = searchParams.get('stage'); // Specific lifecycle stage

    let query = supabase
      .from('deal_lifecycle')
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

    if (stage) {
      query = query.eq('current_stage', stage);
    }

    const { data: lifecycles, error } = await query;

    // Classify error if present
    if (error) {
      console.error('[Ultra Automation] Deal Lifecycle API Error:', error);
      const classifiedError = classifySupabaseError(error, lifecycles);
      
      return NextResponse.json({
        success: false,
        error: classifiedError.message,
        errorType: classifiedError.type,
        message: classifiedError.userMessage,
        retryable: classifiedError.retryable,
        technicalDetails: classifiedError.technicalDetails,
      }, { status: classifiedError.statusCode || 500 });
    }

    // Check if data is empty (not an error, just no data)
    const hasData = lifecycles && lifecycles.length > 0;

    // Fetch payment milestones
    const lifecycleIds = (lifecycles || []).map((l: any) => l.id);
    let milestones: any[] = [];
    
    if (lifecycleIds.length > 0) {
      const { data: milestonesData, error: milestonesError } = await supabase
        .from('payment_milestones')
        .select('*')
        .in('lifecycle_id', lifecycleIds)
        .order('due_date', { ascending: true });
      
      if (milestonesError) {
        console.warn('[Ultra Automation] Milestones fetch warning:', milestonesError);
        // Don't fail the whole request if milestones fail
      } else {
        milestones = milestonesData || [];
      }
    }

    return NextResponse.json({
      success: true,
      data: {
        lifecycles: lifecycles || [],
        milestones,
      },
      isEmpty: !hasData,
    });

  } catch (error: any) {
    console.error('[Ultra Automation] Deal Lifecycle API Error:', error);
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

