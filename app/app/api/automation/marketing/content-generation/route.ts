/**
 * WORKFLOW 2: AI CONTENT GENERATION FACTORY
 * Trigger: Webhook from Intelligence Engine
 * Purpose: Generate 50+ content variants across all marketing channels
 */

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { generateMasterContentSet, generateLocalizedVariants, generateABTestVariants } from '@/lib/automation/marketing/aiContentGenerator'

export const maxDuration = 300 // 5 minutes for AI processing

export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient()
    const body = await req.json()
    const { property_id, strategy } = body

    if (!property_id) {
      return NextResponse.json({ error: 'Missing property_id' }, { status: 400 })
    }

    // Step 1: Fetch Property Data
    const { data: property, error: propertyError } = await supabase
      .from('properties')
      .select('*')
      .eq('id', property_id)
      .single()

    if (propertyError || !property) {
      return NextResponse.json(
        { error: 'Property not found', details: propertyError?.message },
        { status: 404 }
      )
    }

    // Step 2: Generate Master Content Set
    const masterContent = await generateMasterContentSet(property, strategy || {})

    // Step 3: Generate Localized Variants
    const languages = ['hi', 'ta', 'kn', 'te']
    const localizedContent = await generateLocalizedVariants(masterContent, property, languages)

    // Step 4: Generate A/B Test Variants
    const testVariants = generateABTestVariants(masterContent)

    // Step 5: Store All Content in Database
    const contentInserts = [
      // Master English content
      {
        property_id,
        builder_id: property.builder_id,
        content_type: 'master_set',
        language: 'en',
        variant_name: 'original',
        content_data: masterContent,
        generated_by: 'claude_ai',
        is_active: true,
      },
      // Localized variants
      ...languages.map((lang) => ({
        property_id,
        builder_id: property.builder_id,
        content_type: 'localized',
        language: lang,
        variant_name: `regional_${lang}`,
        content_data: localizedContent[lang],
        generated_by: 'claude_ai',
        is_active: true,
      })),
      // A/B test variants
      ...Object.entries(testVariants).map(([key, value]) => ({
        property_id,
        builder_id: property.builder_id,
        content_type: 'ab_test',
        language: 'en',
        variant_name: key,
        content_data: value,
        generated_by: 'claude_ai',
        is_active: true,
      })),
    ]

    const { error: insertError } = await supabase
      .from('property_content_library')
      .insert(contentInserts)

    if (insertError) {
      console.error('[Content Generation] Error storing content:', insertError)
      return NextResponse.json(
        { error: 'Failed to store content', details: insertError.message },
        { status: 500 }
      )
    }

    // Update property status
    await supabase
      .from('properties')
      .update({
        marketing_content_generated: true,
        marketing_content_generated_at: new Date().toISOString(),
        content_variant_count: contentInserts.length,
      })
      .eq('id', property_id)

    return NextResponse.json({
      success: true,
      property_id,
      content_variants: contentInserts.length,
      status: 'content_generation_complete',
    })
  } catch (error) {
    console.error('[Content Generation] Error:', error)
    return NextResponse.json(
      { error: 'Internal server error', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}





































