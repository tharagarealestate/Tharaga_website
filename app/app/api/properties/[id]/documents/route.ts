import { NextRequest, NextResponse } from 'next/server'
import { getSupabase } from '@/lib/supabase'
import { createClient } from '@supabase/supabase-js'
import crypto from 'crypto'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

const LEGAL_DISCLAIMER = "Legal disclaimer: The information and verification artifacts provided on this page are automated snapshots of public records and uploaded documents as of the timestamp shown. These artifacts are intended for informational purposes only and do not constitute legal advice, title insurance, or a guarantee of property ownership or transferability. For formal legal confirmation and title transfer, consult a licensed property lawyer or the appropriate government registry."

// Allowed document types
const ALLOWED_DOC_TYPES = ['EC', 'OC', 'CC', 'APPROVAL_PLAN', 'NOC', 'SALE_DEED', 'KHATA', 'OTHER']
const MAX_FILE_SIZE = 10 * 1024 * 1024 // 10MB
const ALLOWED_MIME_TYPES = [
  'application/pdf',
  'image/jpeg',
  'image/png',
  'image/webp',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
]

// POST: Upload document
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
    
    // Get current user
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Verify user owns the property
    const { data: property, error: propError } = await supabase
      .from('properties')
      .select('builder_id')
      .eq('id', propertyId)
      .single()

    if (propError || !property) {
      return NextResponse.json({ error: 'Property not found' }, { status: 404 })
    }

    if (property.builder_id !== user.id) {
      return NextResponse.json({ error: 'Forbidden - You can only upload documents for your properties' }, { status: 403 })
    }

    // Parse form data
    const formData = await req.formData()
    const file = formData.get('file') as File | null
    const documentType = formData.get('document_type') as string
    const documentName = formData.get('document_name') as string

    if (!file) {
      return NextResponse.json({ error: 'File required' }, { status: 400 })
    }

    if (!documentType || !ALLOWED_DOC_TYPES.includes(documentType)) {
      return NextResponse.json({ error: 'Invalid document type' }, { status: 400 })
    }

    if (!documentName) {
      return NextResponse.json({ error: 'Document name required' }, { status: 400 })
    }

    // Validate file size and type
    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json({ error: `File size exceeds ${MAX_FILE_SIZE / 1024 / 1024}MB limit` }, { status: 400 })
    }

    if (!ALLOWED_MIME_TYPES.includes(file.type)) {
      return NextResponse.json({ error: 'Invalid file type' }, { status: 400 })
    }

    // Read file content and compute SHA256 hash
    const fileBuffer = await file.arrayBuffer()
    const fileBytes = new Uint8Array(fileBuffer)
    const hash = crypto.createHash('sha256').update(fileBytes).digest('hex')

    // Upload to Supabase Storage
    const fileExt = file.name.split('.').pop() || 'pdf'
    const fileName = `${propertyId}/${documentType}_${Date.now()}.${fileExt}`
    const filePath = `property-documents/${fileName}`

    // Create storage client with service role for uploads
    const supabaseStorage = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        }
      }
    )

    const { data: uploadData, error: uploadError } = await supabaseStorage.storage
      .from('property-documents')
      .upload(filePath, fileBytes, {
        contentType: file.type,
        upsert: false
      })

    if (uploadError) {
      console.error('Storage upload error:', uploadError)
      return NextResponse.json({ error: 'Failed to upload file' }, { status: 500 })
    }

    // Get public URL
    const { data: { publicUrl } } = supabaseStorage.storage
      .from('property-documents')
      .getPublicUrl(filePath)

    // Insert document record
    const { data: docData, error: docError } = await supabase
      .from('property_documents')
      .insert({
        property_id: propertyId,
        document_type: documentType,
        document_name: documentName,
        file_url: publicUrl,
        file_size_bytes: file.size,
        mime_type: file.type,
        sha256_hash: hash,
        uploaded_by: user.id,
        verification_status: 'pending'
      })
      .select()
      .single()

    if (docError) {
      console.error('Database insert error:', docError)
      // Try to clean up uploaded file
      await supabaseStorage.storage.from('property-documents').remove([filePath])
      return NextResponse.json({ error: 'Failed to save document record' }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      document: docData,
      message: 'Document uploaded successfully'
    })
  } catch (error: any) {
    console.error('Document upload error:', error)
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 })
  }
}

// GET: List documents for property
export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const propertyId = params.id
    if (!propertyId) {
      return NextResponse.json({ error: 'Property ID required' }, { status: 400 })
    }

    const supabase = getSupabase()
    const { data, error } = await supabase
      .from('property_documents')
      .select('*')
      .eq('property_id', propertyId)
      .order('uploaded_at', { ascending: false })

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ documents: data || [] })
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 })
  }
}







