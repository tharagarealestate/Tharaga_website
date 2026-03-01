import { NextRequest, NextResponse } from 'next/server'
import { getSupabase } from '@/lib/supabase'
import { createClient } from '@supabase/supabase-js'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

// Note: PDF generation using reportlab is not available in Edge runtime
// This endpoint should be moved to Node.js runtime or use a different approach
// For now, we'll create a server action or use a backend service

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const propertyId = params.id
    if (!propertyId) {
      return NextResponse.json({ error: 'Property ID required' }, { status: 400 })
    }

    const supabase = getSupabase()
    
    // Get property data
    const { data: property, error: propError } = await supabase
      .from('properties')
      .select('*')
      .eq('id', propertyId)
      .single()

    if (propError || !property) {
      return NextResponse.json({ error: 'Property not found' }, { status: 404 })
    }

    // Get documents
    const { data: documents } = await supabase
      .from('property_documents')
      .select('*, uploaded_by, uploaded_at, document_name, document_type, sha256_hash')
      .eq('property_id', propertyId)
      .order('uploaded_at', { ascending: false })

    // Get RERA snapshot
    const { data: reraSnapshot } = await supabase
      .from('rera_snapshots')
      .select('*')
      .eq('property_id', propertyId)
      .order('collected_at', { ascending: false })
      .limit(1)
      .maybeSingle()

    // Get risk flags
    const { data: riskFlags } = await supabase
      .from('property_risk_flags')
      .select('*')
      .eq('property_id', propertyId)
      .eq('resolved', false)
      .order('severity', { ascending: false })

    // Generate PDF using backend service
    // Since Edge runtime doesn't support reportlab, we'll call backend API
    const backendUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'
    const response = await fetch(`${backendUrl}/api/properties/${propertyId}/generate-audit-pdf`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        property: property,
        documents: documents || [],
        rera_snapshot: reraSnapshot,
        risk_flags: riskFlags || []
      })
    })

    if (!response.ok) {
      const error = await response.json()
      return NextResponse.json({ error: error.detail || 'Failed to generate PDF' }, { status: 500 })
    }

    const pdfBuffer = await response.arrayBuffer()

    // Store PDF in Supabase Storage
    const fileName = `audit-${propertyId}-${Date.now()}.pdf`
    const filePath = `property-audits/${fileName}`

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_ROLE;

    if (!supabaseUrl || !supabaseKey) {
      throw new Error('Supabase URL and service role key are required');
    }

    const supabaseStorage = createClient(
      supabaseUrl,
      supabaseKey,
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        }
      }
    )

    const { data: uploadData, error: uploadError } = await supabaseStorage.storage
      .from('property-audits')
      .upload(filePath, Buffer.from(pdfBuffer), {
        contentType: 'application/pdf',
        upsert: false
      })

    if (uploadError) {
      console.error('PDF storage error:', uploadError)
    } else {
      // Get public URL
      const { data: { publicUrl } } = supabaseStorage.storage
        .from('property-audits')
        .getPublicUrl(filePath)

      // Compute hash
      const crypto = await import('crypto')
      const hash = crypto.createHash('sha256').update(Buffer.from(pdfBuffer)).digest('hex')

      // Save PDF record
      const supabase = getSupabase()
      await supabase
        .from('property_audit_pdfs')
        .insert({
          property_id: propertyId,
          pdf_url: publicUrl,
          pdf_hash: hash,
          document_count: (documents || []).length,
          rera_snapshot_included: !!reraSnapshot,
          risk_flags_count: (riskFlags || []).length
        })
    }

    // Return PDF as response
    return new NextResponse(pdfBuffer, {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="${fileName}"`,
      },
    })
  } catch (error: any) {
    console.error('PDF generation error:', error)
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 })
  }
}

