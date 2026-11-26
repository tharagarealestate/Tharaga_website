/**
 * Ultra Automation - Property Viewings API
 * GET /api/ultra-automation/viewings?builder_id=xxx
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
    const status = searchParams.get('status'); // 'scheduled', 'completed', 'cancelled'

    let query = supabase
      .from('property_viewings')
      .select(`
        *,
        lead:generated_leads(*),
        property:properties(*)
      `)
      .eq('builder_id', builderId)
      .order('scheduled_at', { ascending: true });

    if (status) {
      query = query.eq('status', status);
    }

    const { data: viewings, error } = await query;

    if (error) {
      console.error('[Ultra Automation] Viewings API Error:', error);
      const classifiedError = classifySupabaseError(error, viewings);
      
      return NextResponse.json({
        success: false,
        error: classifiedError.message,
        errorType: classifiedError.type,
        message: classifiedError.userMessage,
        retryable: classifiedError.retryable,
        technicalDetails: classifiedError.technicalDetails,
      }, { status: classifiedError.statusCode || 500 });
    }

    const hasData = viewings && viewings.length > 0;

    // Fetch reminders for each viewing
    const viewingIds = (viewings || []).map((v: any) => v.id);
    let reminders: any[] = [];
    
    if (viewingIds.length > 0) {
      const { data: remindersData, error: remindersError } = await supabase
        .from('viewing_reminders')
        .select('*')
        .in('viewing_id', viewingIds)
        .order('reminder_at', { ascending: true });
      
      if (remindersError) {
        console.warn('[Ultra Automation] Reminders fetch warning:', remindersError);
      } else {
        reminders = remindersData || [];
      }
    }

    return NextResponse.json({
      success: true,
      data: {
        viewings: viewings || [],
        reminders,
      },
      isEmpty: !hasData,
    });

  } catch (error: any) {
    console.error('[Ultra Automation] Viewings API Error:', error);
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

