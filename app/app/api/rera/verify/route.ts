import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';

// AI-powered RERA verification using OCR + database cross-reference
export async function POST(request: Request) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { rera_number, state, document_url } = await request.json();

    if (!rera_number || !state) {
      return NextResponse.json({ 
        error: 'RERA number and state are required',
        valid: false 
      }, { status: 400 });
    }

    // Step 1: Validate RERA number format (state-specific)
    if (!validateRERAFormat(rera_number, state)) {
      return NextResponse.json({ 
        error: 'Invalid RERA number format',
        valid: false,
        message: `RERA number format for ${state} is invalid. Expected format: ${getRERAFormat(state)}`
      }, { status: 400 });
    }

    // Step 2: Cross-reference with public RERA database (web scraping)
    const publicVerification = await verifyWithRERAPortal(rera_number, state);

    // Step 3: OCR document verification (if document provided)
    let documentVerification = null;
    if (document_url) {
      documentVerification = await verifyRERADocument(document_url, rera_number);
    }

    // Step 4: Calculate confidence score
    const confidence = calculateConfidence(publicVerification, documentVerification);

    // Step 5: Save verification record
    const { data, error } = await supabase
      .from('rera_verifications')
      .upsert({
        builder_id: user.id,
        rera_number,
        state,
        verification_status: confidence > 0.8 ? 'verified' : 'pending',
        verification_document_url: document_url,
        auto_verify_confidence: confidence,
        last_checked_at: new Date().toISOString(),
        verification_notes: publicVerification.notes,
        project_name: publicVerification.project_name || null
      }, { 
        onConflict: 'rera_number',
        ignoreDuplicates: false
      })
      .select()
      .single();

    if (error) {
      console.error('Database error:', error);
      throw error;
    }

    return NextResponse.json({
      verification: data,
      confidence,
      public_record: publicVerification,
      document_match: documentVerification,
      status: confidence > 0.8 ? 'verified' : 'pending',
      message: confidence > 0.8 
        ? 'RERA number verified successfully' 
        : 'RERA number requires manual verification'
    });

  } catch (error) {
    console.error('RERA verification error:', error);
    return NextResponse.json({ 
      error: 'Verification failed',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

// Helper functions
function validateRERAFormat(reraNumber: string, state: string): boolean {
  const formats: Record<string, RegExp> = {
    'Tamil Nadu': /^TN\/\d{2}\/\d{4}\/\d{6}$/,
    'Karnataka': /^KA\/\d{2}\/\d{4}\/\d{6}$/,
    'Maharashtra': /^MH\/\d{2}\/\d{4}\/\d{6}$/,
    'Telangana': /^TS\/\d{2}\/\d{4}\/\d{6}$/,
    'Andhra Pradesh': /^AP\/\d{2}\/\d{4}\/\d{6}$/,
    'Gujarat': /^GJ\/\d{2}\/\d{4}\/\d{6}$/,
    'Delhi': /^DL\/\d{2}\/\d{4}\/\d{6}$/,
    'Punjab': /^PB\/\d{2}\/\d{4}\/\d{6}$/,
    'Haryana': /^HR\/\d{2}\/\d{4}\/\d{6}$/,
    'Rajasthan': /^RJ\/\d{2}\/\d{4}\/\d{6}$/,
    'Uttar Pradesh': /^UP\/\d{2}\/\d{4}\/\d{6}$/,
    'West Bengal': /^WB\/\d{2}\/\d{4}\/\d{6}$/,
    'Kerala': /^KL\/\d{2}\/\d{4}\/\d{6}$/,
  };
  
  const format = formats[state];
  return format ? format.test(reraNumber) : false;
}

function getRERAFormat(state: string): string {
  const formats: Record<string, string> = {
    'Tamil Nadu': 'TN/XX/YYYY/XXXXXX',
    'Karnataka': 'KA/XX/YYYY/XXXXXX',
    'Maharashtra': 'MH/XX/YYYY/XXXXXX',
    'Telangana': 'TS/XX/YYYY/XXXXXX',
  };
  return formats[state] || 'STATE/XX/YYYY/XXXXXX';
}

async function verifyWithRERAPortal(reraNumber: string, state: string) {
  // This would scrape the official RERA portal for verification
  // For now, returning mock data with realistic structure
  // In production, implement actual web scraping or API integration
  
  try {
    // TODO: Implement actual RERA portal scraping
    // Example: Fetch from state-specific RERA portal
    // const response = await fetch(`https://${state.toLowerCase().replace(' ', '')}rera.gov.in/verify/${reraNumber}`);
    
    return {
      found: true,
      status: 'Active',
      project_name: 'Sample Project',
      builder_name: 'Sample Builder',
      registration_date: '2023-01-01',
      expiry_date: '2028-01-01',
      notes: 'Verified through public RERA portal (mock data - implement actual verification)'
    };
  } catch (error) {
    console.error('RERA portal verification error:', error);
    return {
      found: false,
      status: 'Unknown',
      notes: 'Unable to verify through public portal'
    };
  }
}

async function verifyRERADocument(documentUrl: string, expectedRERA: string) {
  // This would use OCR (Tesseract.js or Google Vision API) to extract text
  // and verify RERA number presence
  // For now, returning mock data
  
  try {
    // TODO: Implement actual OCR verification
    // Example: Use Google Cloud Vision API or Tesseract.js
    // const ocrResult = await performOCR(documentUrl);
    // const reraFound = ocrResult.text.includes(expectedRERA);
    
    return {
      rera_found: true,
      rera_matches: true,
      confidence: 0.95,
      notes: 'Document OCR verification (mock data - implement actual OCR)'
    };
  } catch (error) {
    console.error('Document verification error:', error);
    return {
      rera_found: false,
      rera_matches: false,
      confidence: 0,
      notes: 'Unable to verify document'
    };
  }
}

function calculateConfidence(publicVerif: any, docVerif: any | null): number {
  let score = 0;
  
  if (publicVerif?.found) score += 0.7;
  if (publicVerif?.status === 'Active') score += 0.1;
  if (docVerif?.rera_matches) score += 0.2;
  
  return Math.min(score, 1.0);
}
