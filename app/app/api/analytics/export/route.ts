import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import ExcelJS from 'exceljs';

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    
    // Verify authentication and admin access
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { data: userRole } = await supabase
      .from('user_roles')
      .select('role')
      .eq('user_id', user.id)
      .eq('role', 'admin')
      .single();

    if (!userRole) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { format, dateRange } = await request.json();
    const { start, end } = dateRange;

    // Fetch metrics for the date range
    const { data: metrics } = await supabase
      .from('platform_metrics')
      .select('*')
      .gte('metric_date', start)
      .lte('metric_date', end)
      .order('metric_date', { ascending: true });

    const { data: revenueMetrics } = await supabase
      .from('revenue_metrics')
      .select('*')
      .gte('period_start', start)
      .lte('period_end', end)
      .order('period_start', { ascending: true });

    if (format === 'csv') {
      // Generate CSV
      const csvRows = [];
      csvRows.push('Date,Builders,Buyers,Properties,Leads,MRR');
      metrics?.forEach((m: any) => {
        csvRows.push(
          `${m.metric_date},${m.total_builders || 0},${m.total_buyers || 0},${m.total_properties || 0},${m.total_leads || 0},${m.mrr || 0}`
        );
      });

      return new NextResponse(csvRows.join('\n'), {
        headers: {
          'Content-Type': 'text/csv',
          'Content-Disposition': `attachment; filename="analytics-${start}-to-${end}.csv"`,
        },
      });
    }

    if (format === 'excel') {
      // Generate Excel
      const workbook = new ExcelJS.Workbook();
      const worksheet = workbook.addWorksheet('Analytics');

      // Add headers
      worksheet.columns = [
        { header: 'Date', key: 'date', width: 15 },
        { header: 'Total Builders', key: 'builders', width: 15 },
        { header: 'Total Buyers', key: 'buyers', width: 15 },
        { header: 'Total Properties', key: 'properties', width: 18 },
        { header: 'Total Leads', key: 'leads', width: 15 },
        { header: 'MRR (₹)', key: 'mrr', width: 15 },
      ];

      // Add data
      metrics?.forEach((m: any) => {
        worksheet.addRow({
          date: m.metric_date,
          builders: m.total_builders || 0,
          buyers: m.total_buyers || 0,
          properties: m.total_properties || 0,
          leads: m.total_leads || 0,
          mrr: (m.mrr || 0) / 100, // Convert from paise to rupees
        });
      });

      // Style header row
      worksheet.getRow(1).font = { bold: true };
      worksheet.getRow(1).fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FFD4AF37' },
      };

      const buffer = await workbook.xlsx.writeBuffer();

      return new NextResponse(buffer, {
        headers: {
          'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
          'Content-Disposition': `attachment; filename="analytics-${start}-to-${end}.xlsx"`,
        },
      });
    }

    if (format === 'pdf') {
      // For PDF, return CSV for now (PDF generation requires additional libraries)
      // In production, use libraries like pdfkit or puppeteer
      const csvRows = [];
      csvRows.push('Date,Builders,Buyers,Properties,Leads,MRR');
      metrics?.forEach((m: any) => {
        csvRows.push(
          `${m.metric_date},${m.total_builders || 0},${m.total_buyers || 0},${m.total_properties || 0},${m.total_leads || 0},${m.mrr || 0}`
        );
      });

      return new NextResponse(csvRows.join('\n'), {
        headers: {
          'Content-Type': 'text/csv',
          'Content-Disposition': `attachment; filename="analytics-${start}-to-${end}.csv"`,
        },
      });
    }

    return NextResponse.json({ error: 'Invalid format' }, { status: 400 });

  } catch (error: any) {
    console.error('Export error:', error);
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 });
  }
}

