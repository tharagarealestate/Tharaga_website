import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const invoiceId = params.id;
    
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized. Please log in.' },
        { status: 401 }
      );
    }
    
    // Get builder profile
    const { data: builder } = await supabase
      .from('builders')
      .select('id')
      .eq('user_id', user.id)
      .single();
    
    if (!builder) {
      return NextResponse.json(
        { error: 'Builder profile not found' },
        { status: 404 }
      );
    }
    
    // Get invoice
    const { data: invoice } = await supabase
      .from('billing_invoices')
      .select('*')
      .eq('id', invoiceId)
      .eq('builder_id', builder.id)
      .single();
    
    if (!invoice) {
      return NextResponse.json(
        { error: 'Invoice not found' },
        { status: 404 }
      );
    }
    
    // If PDF exists, return it
    if (invoice.pdf_url) {
      const pdfResponse = await fetch(invoice.pdf_url);
      if (pdfResponse.ok) {
        const pdfBuffer = await pdfResponse.arrayBuffer();
        return new NextResponse(pdfBuffer, {
          headers: {
            'Content-Type': 'application/pdf',
            'Content-Disposition': `attachment; filename="invoice-${invoice.invoice_number}.pdf"`
          }
        });
      }
    }
    
    // PDF not generated yet - return error
    return NextResponse.json(
      { error: 'Invoice PDF not available yet' },
      { status: 404 }
    );
    
  } catch (error: any) {
    console.error('Invoice download error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to download invoice' },
      { status: 500 }
    );
  }
}



