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

    const searchParams = request.nextUrl.searchParams;
    const builderId = searchParams.get('builder_id') || user.id;
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

