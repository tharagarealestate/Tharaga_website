// =============================================
// TEAM MEMBERS API
// GET /api/team-members
// =============================================
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { cookies } from 'next/headers';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const cookieStore = cookies();
    const supabase = await createClient();
    
    // Authenticate
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    // Verify builder role
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single();
    
    if (profile?.role !== 'builder') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }
    
    // Fetch team members (users with role 'team_member' or 'builder' in the same organization)
    // For now, we'll return all builders and team members
    // In a production system, you'd filter by organization/company
    const { data: members, error: membersError } = await supabase
      .from('profiles')
      .select('id, full_name, email, role')
      .in('role', ['builder', 'team_member'])
      .order('full_name', { ascending: true });
    
    if (membersError) {
      return NextResponse.json(
        { error: 'Failed to fetch team members', details: membersError.message },
        { status: 500 }
      );
    }
    
    return NextResponse.json({
      success: true,
      members: members || [],
    });
    
  } catch (error) {
    console.error('[API/TeamMembers] Error:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: String(error) },
      { status: 500 }
    );
  }
}

