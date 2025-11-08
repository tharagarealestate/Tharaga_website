// =============================================
// LEADS EXPORT API - CSV & EXCEL
// GET /api/leads/export?format=csv&fields=name,email,score
// POST /api/leads/export (with custom filters)
// =============================================
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { cookies } from 'next/headers';
import ExcelJS from 'exceljs';

// ExcelJS requires Node.js runtime, not edge
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

// =============================================
// TYPES
// =============================================
interface ExportField {
  key: string;
  label: string;
  transform?: (value: any, lead: any) => string;
}

// =============================================
// AVAILABLE EXPORT FIELDS
// =============================================
const AVAILABLE_FIELDS: ExportField[] = [
  { key: 'email', label: 'Email' },
  { key: 'full_name', label: 'Full Name' },
  { key: 'phone', label: 'Phone Number' },
  { key: 'score', label: 'Lead Score' },
  { key: 'category', label: 'Category' },
  { key: 'budget_min', label: 'Min Budget', transform: (v) => v ? `₹${v.toLocaleString('en-IN')}` : 'N/A' },
  { key: 'budget_max', label: 'Max Budget', transform: (v) => v ? `₹${v.toLocaleString('en-IN')}` : 'N/A' },
  { key: 'preferred_location', label: 'Preferred Location' },
  { key: 'preferred_property_type', label: 'Property Type' },
  { key: 'total_views', label: 'Total Property Views' },
  { key: 'total_interactions', label: 'Total Interactions' },
  { key: 'last_activity', label: 'Last Activity', transform: (v) => v ? new Date(v).toLocaleDateString() : 'N/A' },
  { key: 'days_since_last_activity', label: 'Days Since Last Activity' },
  { key: 'created_at', label: 'Created Date', transform: (v) => v ? new Date(v).toLocaleDateString() : 'N/A' },
  { key: 'budget_alignment_score', label: 'Budget Alignment Score' },
  { key: 'engagement_score', label: 'Engagement Score' },
  { key: 'property_fit_score', label: 'Property Fit Score' },
  { key: 'contact_intent_score', label: 'Contact Intent Score' },
  { key: 'recency_score', label: 'Recency Score' },
];

// =============================================
// HELPER: Convert to CSV
// =============================================
function convertToCSV(leads: any[], fields: ExportField[]): string {
  // Header row
  const headers = fields.map(f => `"${f.label}"`).join(',');
  
  // Data rows
  const rows = leads.map(lead => {
    return fields.map(field => {
      let value = lead[field.key];
      
      // Apply transformation if exists
      if (field.transform) {
        value = field.transform(value, lead);
      }
      
      // Handle null/undefined
      if (value === null || value === undefined) {
        value = '';
      }
      
      // Escape quotes and wrap in quotes
      value = String(value).replace(/"/g, '""');
      return `"${value}"`;
    }).join(',');
  });
  
  return [headers, ...rows].join('\n');
}

// =============================================
// HELPER: Convert to Excel (Proper .xlsx format)
// =============================================
async function convertToExcel(leads: any[], fields: ExportField[]): Promise<Buffer> {
  try {
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Leads');
    
    // Set column headers
    worksheet.columns = fields.map(field => ({
      header: field.label,
      key: field.key,
      width: 20,
    }));
    
    // Style header row
    const headerRow = worksheet.getRow(1);
    headerRow.font = { bold: true };
    headerRow.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FFE0E0E0' },
    };
    
    // Add data rows
    leads.forEach(lead => {
      const rowData: any = {};
      fields.forEach(field => {
        let value = lead[field.key];
        
        // Apply transformation if exists
        if (field.transform) {
          try {
            value = field.transform(value, lead);
          } catch (transformError) {
            console.warn(`[Export] Transform error for field ${field.key}:`, transformError);
            value = value || '';
          }
        }
        
        // Handle null/undefined
        if (value === null || value === undefined) {
          value = '';
        }
        
        rowData[field.key] = value;
      });
      
      worksheet.addRow(rowData);
    });
    
    // Auto-fit columns
    worksheet.columns.forEach(column => {
      if (column.width) {
        column.width = Math.max(column.width || 10, 15);
      }
    });
    
    // Generate buffer
    const buffer = await workbook.xlsx.writeBuffer();
    return Buffer.from(buffer);
  } catch (error) {
    console.error('[Export] Excel conversion error:', error);
    throw new Error(`Failed to create Excel file: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

// =============================================
// GET HANDLER
// =============================================
export async function GET(request: NextRequest) {
  try {
    const cookieStore = cookies();
    const supabase = createClient();
    
    // =============================================
    // AUTHENTICATION
    // =============================================
    
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    // Verify builder role
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .maybeSingle();
    
    if (!profile || profile.role !== 'builder') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }
    
    // =============================================
    // PARSE QUERY PARAMETERS
    // =============================================
    
    const searchParams = request.nextUrl.searchParams;
    const format = searchParams.get('format') || 'csv'; // csv or excel
    const fieldsParam = searchParams.get('fields');
    const categoryFilter = searchParams.get('category');
    const scoreMin = searchParams.get('score_min');
    const scoreMax = searchParams.get('score_max');
    
    // Determine which fields to export
    let exportFields: ExportField[];
    if (fieldsParam) {
      const requestedFields = fieldsParam.split(',').map(f => f.trim());
      exportFields = AVAILABLE_FIELDS.filter(f => requestedFields.includes(f.key));
    } else {
      // Default fields
      exportFields = AVAILABLE_FIELDS.filter(f => 
        ['email', 'full_name', 'phone', 'score', 'category', 'budget_min', 'budget_max', 'last_activity'].includes(f.key)
      );
    }
    
    // =============================================
    // FETCH LEADS FOR BUILDER (with builder_id filter)
    // =============================================
    
    // First, get all leads for this builder from the leads table
    let leadsQuery = supabase
      .from('leads')
      .select('id, email, created_at, builder_id')
      .eq('builder_id', user.id);
    
    // Apply date filters if needed
    // Note: We'll filter by score after joining with lead_scores
    
    const { data: builderLeads, error: leadsError } = await leadsQuery;
    
    if (leadsError) {
      console.error('[API/Export] Leads fetch error:', leadsError);
      return NextResponse.json(
        { error: 'Failed to fetch leads' },
        { status: 500 }
      );
    }
    
    if (!builderLeads || builderLeads.length === 0) {
      return NextResponse.json(
        { error: 'No leads found to export' },
        { status: 404 }
      );
    }
    
    // Get user_ids from profiles for these leads (using email)
    const leadEmails = builderLeads.map(l => l.email).filter(Boolean);
    
    if (leadEmails.length === 0) {
      return NextResponse.json(
        { error: 'No valid lead emails found' },
        { status: 404 }
      );
    }
    
    // Get user profiles for these emails
    const { data: userProfiles, error: profilesError } = await supabase
      .from('profiles')
      .select('id, email')
      .in('email', leadEmails);
    
    if (profilesError) {
      console.error('[API/Export] Profiles fetch error:', profilesError);
      // Continue with basic export even if profiles fail
    }
    
    // Create a map of email -> user_id
    const emailToUserId = new Map<string, string>();
    (userProfiles || []).forEach(profile => {
      if (profile.email) {
        emailToUserId.set(profile.email, profile.id);
      }
    });
    
    // Get user_ids
    const userIds = Array.from(emailToUserId.values());
    
    if (userIds.length === 0) {
      // If no user_ids found, return basic lead data without scores
      console.warn('[API/Export] No user_ids found, exporting basic lead data');
    }
    
    // Fetch lead_scores for these user_ids
    let scoresQuery = supabase
      .from('lead_scores')
      .select('*');
    
    if (userIds.length > 0) {
      scoresQuery = scoresQuery.in('user_id', userIds);
    } else {
      // If no user_ids, return empty result set (will be handled below)
      scoresQuery = scoresQuery.eq('user_id', '00000000-0000-0000-0000-000000000000'); // Dummy UUID that won't match
    }
    
    if (categoryFilter) {
      scoresQuery = scoresQuery.eq('category', categoryFilter);
    }
    
    if (scoreMin) {
      scoresQuery = scoresQuery.gte('score', parseFloat(scoreMin));
    }
    
    if (scoreMax) {
      scoresQuery = scoresQuery.lte('score', parseFloat(scoreMax));
    }
    
    const { data: leadScores, error: scoresError } = await scoresQuery;
    
    if (scoresError && userIds.length > 0) {
      console.error('[API/Export] Lead scores fetch error:', scoresError);
      // Continue with basic export even if scores fail
    }
    
    // Create a map of user_id -> lead_score
    const userIdToScore = new Map<string, any>();
    (leadScores || []).forEach(score => {
      userIdToScore.set(score.user_id, score);
    });
    
    // Create a map of email -> lead (from builderLeads)
    const emailToLead = new Map<string, any>();
    builderLeads.forEach(lead => {
      if (lead.email) {
        emailToLead.set(lead.email, lead);
      }
    });
    
    // Combine data: for each lead, get its score if available
    const combinedLeadScores = builderLeads.map(lead => {
      const userId = emailToUserId.get(lead.email || '');
      const score = userId ? userIdToScore.get(userId) : null;
      
      if (score) {
        return {
          ...score,
          lead_id: lead.id,
          lead_email: lead.email,
          lead_created_at: lead.created_at,
        };
      } else {
        // Return basic structure even without score
        return {
          user_id: userId || null,
          score: 0,
          category: 'Low Quality',
          budget_alignment_score: 0,
          engagement_score: 0,
          property_fit_score: 0,
          time_investment_score: 0,
          contact_intent_score: 0,
          recency_score: 0,
          created_at: lead.created_at,
          updated_at: lead.created_at,
          lead_id: lead.id,
          lead_email: lead.email,
          lead_created_at: lead.created_at,
        };
      }
    }).filter(score => {
      // Apply filters
      if (categoryFilter && score.category !== categoryFilter) return false;
      if (scoreMin && (score.score || 0) < parseFloat(scoreMin)) return false;
      if (scoreMax && (score.score || 0) > parseFloat(scoreMax)) return false;
      return true;
    });
    
    if (combinedLeadScores.length === 0) {
      return NextResponse.json(
        { error: 'No leads match the selected filters' },
        { status: 404 }
      );
    }
    
    // Safety limit: prevent exporting too many leads at once (could cause timeout)
    const MAX_EXPORT_LIMIT = 10000;
    if (combinedLeadScores.length > MAX_EXPORT_LIMIT) {
      return NextResponse.json(
        { error: `Too many leads to export (${combinedLeadScores.length}). Please apply filters to reduce the number of leads. Maximum: ${MAX_EXPORT_LIMIT}` },
        { status: 400 }
      );
    }
    
    // =============================================
    // ENRICH LEAD DATA
    // =============================================
    
    const enrichedLeads = await Promise.all(
      combinedLeadScores.map(async (leadScore: any) => {
        try {
          const userId = leadScore.user_id || (leadScore.lead_email ? emailToUserId.get(leadScore.lead_email || '') : null);
          
          // Fetch user profile (use maybeSingle to handle missing data)
          const { data: profile } = userId
            ? await supabase
                .from('profiles')
                .select('email, full_name, phone')
                .eq('id', userId)
                .maybeSingle()
            : { data: null };
          
          // Fetch preferences (use maybeSingle to handle missing data)
          const { data: preferences } = userId
            ? await supabase
                .from('user_preferences')
                .select('budget_min, budget_max, preferred_location, preferred_property_type')
                .eq('user_id', userId)
                .maybeSingle()
            : { data: null };
          
          // Fetch behavior stats
          const { data: behaviors } = userId
            ? await supabase
                .from('user_behavior')
                .select('behavior_type, timestamp')
                .eq('user_id', userId)
                .order('timestamp', { ascending: false })
            : { data: null };
          
          // Fetch interactions
          const { data: interactions } = await supabase
            .from('lead_interactions')
            .select('*')
            .eq('lead_id', String(leadScore.lead_id || ''))
            .eq('builder_id', user.id);
          
          const totalViews = behaviors?.filter(b => b.behavior_type === 'property_view').length || 0;
          const lastActivity = behaviors?.[0]?.timestamp || null;
          const daysSinceLastActivity = lastActivity
            ? Math.floor((Date.now() - new Date(lastActivity).getTime()) / (1000 * 60 * 60 * 24))
            : 999;
          
          // Get lead email from leadScore or from the lead record
          const leadEmail = leadScore.lead_email || profile?.email || '';
          
          // Get lead record to access original lead data
          const leadRecord = emailToLead.get(leadEmail);
          
          return {
            id: userId || leadRecord?.id || '',
            email: leadEmail,
            full_name: profile?.full_name || leadRecord?.name || 'Unknown',
            phone: profile?.phone || leadRecord?.phone || null,
            created_at: leadScore.lead_created_at || leadScore.created_at || leadRecord?.created_at,
            
            score: Number(leadScore.score) || 0,
            category: leadScore.category || 'Unknown',
            
            budget_min: preferences?.budget_min || null,
            budget_max: preferences?.budget_max || null,
            preferred_location: preferences?.preferred_location || null,
            preferred_property_type: preferences?.preferred_property_type || null,
            
            total_views: totalViews,
            total_interactions: interactions?.length || 0,
            last_activity: lastActivity,
            days_since_last_activity: daysSinceLastActivity,
            
            // Score breakdown
            budget_alignment_score: Number(leadScore.budget_alignment_score) || 0,
            engagement_score: Number(leadScore.engagement_score) || 0,
            property_fit_score: Number(leadScore.property_fit_score) || 0,
            contact_intent_score: Number(leadScore.contact_intent_score) || 0,
            recency_score: Number(leadScore.recency_score) || 0,
          };
        } catch (error) {
          console.error('[API/Export] Error enriching lead:', error);
          // Return basic data if enrichment fails
          const leadEmail = leadScore.lead_email || '';
          const leadRecord = emailToLead.get(leadEmail);
          
          return {
            id: leadScore.user_id || leadRecord?.id || '',
            email: leadEmail,
            full_name: leadRecord?.name || 'Unknown',
            phone: leadRecord?.phone || null,
            created_at: leadScore.lead_created_at || leadScore.created_at || leadRecord?.created_at,
            score: Number(leadScore.score) || 0,
            category: leadScore.category || 'Unknown',
            budget_min: null,
            budget_max: null,
            preferred_location: null,
            preferred_property_type: null,
            total_views: 0,
            total_interactions: 0,
            last_activity: null,
            days_since_last_activity: 999,
            budget_alignment_score: 0,
            engagement_score: 0,
            property_fit_score: 0,
            contact_intent_score: 0,
            recency_score: 0,
          };
        }
      })
    );
    
    // =============================================
    // GENERATE FILE CONTENT
    // =============================================
    
    let fileContent: string | Buffer;
    let contentType: string;
    let filename: string;
    
    try {
      if (format === 'excel') {
        // Generate proper Excel file
        try {
          fileContent = await convertToExcel(enrichedLeads, exportFields);
          contentType = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';
          filename = `leads-export-${Date.now()}.xlsx`;
        } catch (excelError) {
          console.error('[API/Export] Excel generation error:', excelError);
          // Fallback to CSV if Excel fails
          console.log('[API/Export] Falling back to CSV format');
          fileContent = convertToCSV(enrichedLeads, exportFields);
          contentType = 'text/csv; charset=utf-8';
          filename = `leads-export-${Date.now()}.csv`;
        }
      } else {
        // Generate CSV file
        fileContent = convertToCSV(enrichedLeads, exportFields);
        contentType = 'text/csv; charset=utf-8';
        filename = `leads-export-${Date.now()}.csv`;
      }
    } catch (genError) {
      console.error('[API/Export] File generation error:', genError);
      return NextResponse.json(
        { error: `Failed to generate export file: ${genError instanceof Error ? genError.message : 'Unknown error'}` },
        { status: 500 }
      );
    }
    
    // =============================================
    // RETURN FILE
    // =============================================
    
    // Convert Buffer to proper format for NextResponse
    let responseBody: BodyInit;
    if (format === 'excel' && Buffer.isBuffer(fileContent)) {
      // For Excel files (Buffer), convert to ArrayBuffer
      responseBody = new Uint8Array(fileContent);
    } else {
      // For CSV files (string), use as-is
      responseBody = fileContent as string;
    }
    
    return new NextResponse(responseBody, {
      status: 200,
      headers: {
        'Content-Type': contentType,
        'Content-Disposition': `attachment; filename="${filename}"`,
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0',
      },
    });
    
  } catch (error) {
    console.error('[API/Export] Error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    return NextResponse.json(
      { error: `Export failed: ${errorMessage}` },
      { status: 500 }
    );
  }
}

// =============================================
// POST HANDLER - Custom Export with Filters
// =============================================
export async function POST(request: NextRequest) {
  try {
    const cookieStore = cookies();
    const supabase = createClient();
    
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
      .maybeSingle();
    
    if (!profile || profile.role !== 'builder') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }
    
    // Parse request body
    const body = await request.json();
    const {
      format = 'csv',
      fields = [],
      filters = {},
    } = body;
    
    // =============================================
    // FETCH LEADS FOR BUILDER (with builder_id filter)
    // =============================================
    
    // First, get all leads for this builder from the leads table
    let leadsQuery = supabase
      .from('leads')
      .select('id, email, created_at, builder_id, name, phone')
      .eq('builder_id', user.id);
    
    // Apply date filters
    if (filters.created_after) {
      leadsQuery = leadsQuery.gte('created_at', filters.created_after);
    }
    if (filters.created_before) {
      leadsQuery = leadsQuery.lte('created_at', filters.created_before);
    }
    
    const { data: builderLeads, error: leadsError } = await leadsQuery;
    
    if (leadsError) {
      console.error('[API/Export/POST] Leads fetch error:', leadsError);
      return NextResponse.json({ error: 'Failed to fetch leads' }, { status: 500 });
    }
    
    if (!builderLeads || builderLeads.length === 0) {
      return NextResponse.json({ error: 'No leads found to export' }, { status: 404 });
    }
    
    // Get user_ids from profiles for these leads (using email)
    const leadEmails = builderLeads.map(l => l.email).filter(Boolean);
    
    if (leadEmails.length === 0) {
      return NextResponse.json({ error: 'No valid lead emails found' }, { status: 404 });
    }
    
    // Get user profiles for these emails
    const { data: userProfiles, error: profilesError } = await supabase
      .from('profiles')
      .select('id, email')
      .in('email', leadEmails);
    
    if (profilesError) {
      console.error('[API/Export/POST] Profiles fetch error:', profilesError);
    }
    
    // Create a map of email -> user_id
    const emailToUserId = new Map<string, string>();
    (userProfiles || []).forEach(profile => {
      if (profile.email) {
        emailToUserId.set(profile.email, profile.id);
      }
    });
    
    // Get user_ids
    const userIds = Array.from(emailToUserId.values());
    
    // Fetch lead_scores for these user_ids
    let scoresQuery = supabase
      .from('lead_scores')
      .select('*');
    
    if (userIds.length > 0) {
      scoresQuery = scoresQuery.in('user_id', userIds);
    } else {
      // If no user_ids, return empty result set (will be handled below)
      scoresQuery = scoresQuery.eq('user_id', '00000000-0000-0000-0000-000000000000'); // Dummy UUID that won't match
    }
    
    // Apply filters
    if (filters.category) scoresQuery = scoresQuery.eq('category', filters.category);
    if (filters.score_min) scoresQuery = scoresQuery.gte('score', filters.score_min);
    if (filters.score_max) scoresQuery = scoresQuery.lte('score', filters.score_max);
    
    const { data: leadScores, error: scoresError } = await scoresQuery;
    
    if (scoresError && userIds.length > 0) {
      console.error('[API/Export/POST] Lead scores fetch error:', scoresError);
    }
    
    // Create a map of user_id -> lead_score
    const userIdToScore = new Map<string, any>();
    (leadScores || []).forEach(score => {
      userIdToScore.set(score.user_id, score);
    });
    
    // Create a map of email -> lead (from builderLeads)
    const emailToLead = new Map<string, any>();
    builderLeads.forEach(lead => {
      if (lead.email) {
        emailToLead.set(lead.email, lead);
      }
    });
    
    // Combine data: for each lead, get its score if available
    const combinedLeadScores = builderLeads.map(lead => {
      const userId = emailToUserId.get(lead.email || '');
      const score = userId ? userIdToScore.get(userId) : null;
      
      if (score) {
        return {
          ...score,
          lead_id: lead.id,
          lead_email: lead.email,
          lead_created_at: lead.created_at,
        };
      } else {
        return {
          user_id: userId || null,
          score: 0,
          category: 'Low Quality',
          budget_alignment_score: 0,
          engagement_score: 0,
          property_fit_score: 0,
          time_investment_score: 0,
          contact_intent_score: 0,
          recency_score: 0,
          created_at: lead.created_at,
          updated_at: lead.created_at,
          lead_id: lead.id,
          lead_email: lead.email,
          lead_created_at: lead.created_at,
        };
      }
    }).filter(score => {
      // Apply filters
      if (filters.category && score.category !== filters.category) return false;
      if (filters.score_min && (score.score || 0) < filters.score_min) return false;
      if (filters.score_max && (score.score || 0) > filters.score_max) return false;
      return true;
    });
    
    if (combinedLeadScores.length === 0) {
      return NextResponse.json({ error: 'No leads match the selected filters' }, { status: 404 });
    }
    
    // Safety limit: prevent exporting too many leads at once (could cause timeout)
    const MAX_EXPORT_LIMIT = 10000;
    if (combinedLeadScores.length > MAX_EXPORT_LIMIT) {
      return NextResponse.json(
        { error: `Too many leads to export (${combinedLeadScores.length}). Please apply filters to reduce the number of leads. Maximum: ${MAX_EXPORT_LIMIT}` },
        { status: 400 }
      );
    }
    
    // Enrich data (same as GET handler)
    const enrichedLeads = await Promise.all(
      combinedLeadScores.map(async (leadScore: any) => {
        try {
          const userId = leadScore.user_id || (leadScore.lead_email ? emailToUserId.get(leadScore.lead_email || '') : null);
          
          // Fetch user profile (use maybeSingle to handle missing data)
          const { data: profile } = userId
            ? await supabase
                .from('profiles')
                .select('email, full_name, phone')
                .eq('id', userId)
                .maybeSingle()
            : { data: null };
          
          // Fetch preferences (use maybeSingle to handle missing data)
          const { data: preferences } = userId
            ? await supabase
                .from('user_preferences')
                .select('budget_min, budget_max, preferred_location, preferred_property_type')
                .eq('user_id', userId)
                .maybeSingle()
            : { data: null };
          
          // Fetch behavior stats
          const { data: behaviors } = userId
            ? await supabase
                .from('user_behavior')
                .select('behavior_type, timestamp')
                .eq('user_id', userId)
                .order('timestamp', { ascending: false })
            : { data: null };
          
          // Fetch interactions
          const { data: interactions } = await supabase
            .from('lead_interactions')
            .select('*')
            .eq('lead_id', String(leadScore.lead_id || ''))
            .eq('builder_id', user.id);
          
          const totalViews = behaviors?.filter(b => b.behavior_type === 'property_view').length || 0;
          const lastActivity = behaviors?.[0]?.timestamp || null;
          const daysSinceLastActivity = lastActivity
            ? Math.floor((Date.now() - new Date(lastActivity).getTime()) / (1000 * 60 * 60 * 24))
            : 999;
          
          // Get lead email from leadScore or from the lead record
          const leadEmail = leadScore.lead_email || profile?.email || '';
          
          // Get lead record to access original lead data
          const leadRecord = emailToLead.get(leadEmail);
          
          return {
            id: userId || leadRecord?.id || '',
            email: leadEmail,
            full_name: profile?.full_name || leadRecord?.name || 'Unknown',
            phone: profile?.phone || leadRecord?.phone || null,
            created_at: leadScore.lead_created_at || leadScore.created_at || leadRecord?.created_at,
            
            score: Number(leadScore.score) || 0,
            category: leadScore.category || 'Unknown',
            
            budget_min: preferences?.budget_min || null,
            budget_max: preferences?.budget_max || null,
            preferred_location: preferences?.preferred_location || null,
            preferred_property_type: preferences?.preferred_property_type || null,
            
            total_views: totalViews,
            total_interactions: interactions?.length || 0,
            last_activity: lastActivity,
            days_since_last_activity: daysSinceLastActivity,
            
            // Score breakdown
            budget_alignment_score: Number(leadScore.budget_alignment_score) || 0,
            engagement_score: Number(leadScore.engagement_score) || 0,
            property_fit_score: Number(leadScore.property_fit_score) || 0,
            contact_intent_score: Number(leadScore.contact_intent_score) || 0,
            recency_score: Number(leadScore.recency_score) || 0,
          };
        } catch (error) {
          console.error('[API/Export/POST] Error enriching lead:', error);
          // Return basic data if enrichment fails
          const leadEmail = leadScore.lead_email || '';
          const leadRecord = emailToLead.get(leadEmail);
          
          return {
            id: leadScore.user_id || leadRecord?.id || '',
            email: leadEmail,
            full_name: leadRecord?.name || 'Unknown',
            phone: leadRecord?.phone || null,
            created_at: leadScore.lead_created_at || leadScore.created_at || leadRecord?.created_at,
            score: Number(leadScore.score) || 0,
            category: leadScore.category || 'Unknown',
            budget_min: null,
            budget_max: null,
            preferred_location: null,
            preferred_property_type: null,
            total_views: 0,
            total_interactions: 0,
            last_activity: null,
            days_since_last_activity: 999,
            budget_alignment_score: 0,
            engagement_score: 0,
            property_fit_score: 0,
            contact_intent_score: 0,
            recency_score: 0,
          };
        }
      })
    );
    
    // Generate file
    const exportFields = fields.length > 0
      ? AVAILABLE_FIELDS.filter(f => fields.includes(f.key))
      : AVAILABLE_FIELDS.filter(f => 
          ['email', 'full_name', 'phone', 'score', 'category', 'budget_min', 'budget_max', 'last_activity'].includes(f.key)
        );
    
    let fileContent: string | Buffer;
    let contentType: string;
    let filename: string;
    
    try {
      if (format === 'excel') {
        // Generate proper Excel file
        try {
          fileContent = await convertToExcel(enrichedLeads, exportFields);
          contentType = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';
          filename = `leads-custom-export-${Date.now()}.xlsx`;
        } catch (excelError) {
          console.error('[API/Export] Excel generation error:', excelError);
          // Fallback to CSV if Excel fails
          console.log('[API/Export] Falling back to CSV format');
          fileContent = convertToCSV(enrichedLeads, exportFields);
          contentType = 'text/csv; charset=utf-8';
          filename = `leads-custom-export-${Date.now()}.csv`;
        }
      } else {
        // Generate CSV file
        fileContent = convertToCSV(enrichedLeads, exportFields);
        contentType = 'text/csv; charset=utf-8';
        filename = `leads-custom-export-${Date.now()}.csv`;
      }
    } catch (genError) {
      console.error('[API/Export] File generation error:', genError);
      return NextResponse.json(
        { error: `Failed to generate export file: ${genError instanceof Error ? genError.message : 'Unknown error'}` },
        { status: 500 }
      );
    }
    
    // Convert Buffer to proper format for NextResponse
    let responseBody: BodyInit;
    if (format === 'excel' && Buffer.isBuffer(fileContent)) {
      // For Excel files (Buffer), convert to ArrayBuffer
      responseBody = new Uint8Array(fileContent);
    } else {
      // For CSV files (string), use as-is
      responseBody = fileContent as string;
    }
    
    return new NextResponse(responseBody, {
      status: 200,
      headers: {
        'Content-Type': contentType,
        'Content-Disposition': `attachment; filename="${filename}"`,
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0',
      },
    });
    
  } catch (error) {
    console.error('[API/Export/Custom] Error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

