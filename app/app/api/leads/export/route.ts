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
      .single();
    
    if (profile?.role !== 'builder') {
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
    // FETCH LEAD SCORES WITH FILTERS
    // =============================================
    
    let query = supabase
      .from('lead_scores')
      .select('*');
    
    if (categoryFilter) {
      query = query.eq('category', categoryFilter);
    }
    
    if (scoreMin) {
      query = query.gte('score', parseFloat(scoreMin));
    }
    
    if (scoreMax) {
      query = query.lte('score', parseFloat(scoreMax));
    }
    
    const { data: leadScores, error: fetchError } = await query;
    
    if (fetchError) {
      console.error('[API/Export] Fetch error:', fetchError);
      return NextResponse.json(
        { error: 'Failed to fetch leads' },
        { status: 500 }
      );
    }
    
    if (!leadScores || leadScores.length === 0) {
      return NextResponse.json(
        { error: 'No leads found to export' },
        { status: 404 }
      );
    }
    
    // =============================================
    // ENRICH LEAD DATA
    // =============================================
    
    const enrichedLeads = await Promise.all(
      leadScores.map(async (leadScore: any) => {
        try {
          const userId = leadScore.user_id;
          
          // Fetch user profile (use maybeSingle to handle missing data)
          const { data: profile } = await supabase
            .from('profiles')
            .select('email, full_name, phone')
            .eq('id', userId)
            .maybeSingle();
          
          // Fetch preferences (use maybeSingle to handle missing data)
          const { data: preferences } = await supabase
            .from('user_preferences')
            .select('budget_min, budget_max, preferred_location, preferred_property_type')
            .eq('user_id', userId)
            .maybeSingle();
          
          // Fetch behavior stats
          const { data: behaviors } = await supabase
            .from('user_behavior')
            .select('behavior_type, timestamp')
            .eq('user_id', userId)
            .order('timestamp', { ascending: false });
          
          // Fetch interactions
          const { data: interactions } = await supabase
            .from('lead_interactions')
            .select('*')
            .eq('lead_id', String(userId))
            .eq('builder_id', user.id);
          
          const totalViews = behaviors?.filter(b => b.behavior_type === 'property_view').length || 0;
          const lastActivity = behaviors?.[0]?.timestamp || null;
          const daysSinceLastActivity = lastActivity
            ? Math.floor((Date.now() - new Date(lastActivity).getTime()) / (1000 * 60 * 60 * 24))
            : 999;
          
          return {
            id: userId,
            email: profile?.email || '',
            full_name: profile?.full_name || 'Unknown',
            phone: profile?.phone || null,
            created_at: leadScore.created_at,
            
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
          return {
            id: leadScore.user_id,
            email: '',
            full_name: 'Unknown',
            phone: null,
            created_at: leadScore.created_at,
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
      .single();
    
    if (profile?.role !== 'builder') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }
    
    // Parse request body
    const body = await request.json();
    const {
      format = 'csv',
      fields = [],
      filters = {},
    } = body;
    
    // Build query with all filters
    let query = supabase
      .from('lead_scores')
      .select('*');
    
    // Apply filters
    if (filters.category) query = query.eq('category', filters.category);
    if (filters.score_min) query = query.gte('score', filters.score_min);
    if (filters.score_max) query = query.lte('score', filters.score_max);
    if (filters.created_after) query = query.gte('created_at', filters.created_after);
    if (filters.created_before) query = query.lte('created_at', filters.created_before);
    
    // Execute query
    const { data: leadScores, error: fetchError } = await query;
    
    if (fetchError) {
      return NextResponse.json({ error: 'Failed to fetch leads' }, { status: 500 });
    }
    
    if (!leadScores || leadScores.length === 0) {
      return NextResponse.json({ error: 'No leads found to export' }, { status: 404 });
    }
    
    // Enrich data (same as GET handler)
    const enrichedLeads = await Promise.all(
      leadScores.map(async (leadScore: any) => {
        const userId = leadScore.user_id;
        
        const { data: profile } = await supabase
          .from('profiles')
          .select('email, full_name, phone')
          .eq('id', userId)
          .single();
        
        const { data: preferences } = await supabase
          .from('user_preferences')
          .select('budget_min, budget_max, preferred_location, preferred_property_type')
          .eq('user_id', userId)
          .single();
        
        const { data: behaviors } = await supabase
          .from('user_behavior')
          .select('behavior_type, timestamp')
          .eq('user_id', userId)
          .order('timestamp', { ascending: false });
        
        const { data: interactions } = await supabase
          .from('lead_interactions')
          .select('*')
          .eq('lead_id', String(leadScore.user_id))
          .eq('builder_id', user.id);
        
        const totalViews = behaviors?.filter(b => b.behavior_type === 'property_view').length || 0;
        const lastActivity = behaviors?.[0]?.timestamp || null;
        const daysSinceLastActivity = lastActivity
          ? Math.floor((Date.now() - new Date(lastActivity).getTime()) / (1000 * 60 * 60 * 24))
          : 999;
        
        return {
          id: userId,
          email: profile?.email || '',
          full_name: profile?.full_name || 'Unknown',
          phone: profile?.phone || null,
          created_at: leadScore.created_at,
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
          budget_alignment_score: Number(leadScore.budget_alignment_score) || 0,
          engagement_score: Number(leadScore.engagement_score) || 0,
          property_fit_score: Number(leadScore.property_fit_score) || 0,
          contact_intent_score: Number(leadScore.contact_intent_score) || 0,
          recency_score: Number(leadScore.recency_score) || 0,
        };
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
    
    if (format === 'excel') {
      fileContent = await convertToExcel(enrichedLeads, exportFields);
      contentType = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';
      filename = `leads-custom-export-${Date.now()}.xlsx`;
    } else {
      fileContent = convertToCSV(enrichedLeads, exportFields);
      contentType = 'text/csv; charset=utf-8';
      filename = `leads-custom-export-${Date.now()}.csv`;
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

