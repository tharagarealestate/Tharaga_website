/**
 * WORKFLOW 3: ADVANCED IMAGE PROCESSING & VISUAL CONTENT ENGINE
 * Trigger: Webhook from Intelligence Engine
 * Purpose: Process property images, generate virtual staging, create video walkthroughs
 */

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { optimizeImageForPlatforms, uploadToSupabaseStorage } from '@/lib/automation/marketing/imageProcessor'

export const maxDuration = 300 // 5 minutes for image processing

export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient()
    const body = await req.json()
    const { property_id } = body

    if (!property_id) {
      return NextResponse.json({ error: 'Missing property_id' }, { status: 400 })
    }

    // Step 1: Fetch Property Images
    const { data: property, error: propertyError } = await supabase
      .from('properties')
      .select('id, builder_id, images')
      .eq('id', property_id)
      .single()

    if (propertyError || !property) {
      return NextResponse.json(
        { error: 'Property not found', details: propertyError?.message },
        { status: 404 }
      )
    }

    const images = property.images || []
    if (images.length === 0) {
      return NextResponse.json(
        { error: 'No images found for property' },
        { status: 400 }
      )
    }

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

    // Step 2: Process and optimize images
    const processedImages = []
    for (let i = 0; i < Math.min(images.length, 10); i++) {
      const imageUrl = images[i]
      try {
        const optimizedSet = await optimizeImageForPlatforms(imageUrl)

        // Upload all variants to Supabase Storage
        const uploadedUrls: any[] = []
        for (const [variantName, variant] of Object.entries(optimizedSet.variants)) {
          const filePath = `properties/${property_id}/images/${i}_${variantName}.${variant.format === 'webp' ? 'webp' : 'jpg'}`
          
          try {
            const publicUrl = await uploadToSupabaseStorage(
              variant.buffer,
              'property-images',
              filePath,
              supabaseUrl,
              supabaseKey
            )

            uploadedUrls.push({
              variant: variantName,
              url: publicUrl,
              image_index: i,
              width: variant.width,
              height: variant.height,
              format: variant.format,
            })

            // Store in database
            await supabase.from('property_media_assets').insert({
              property_id,
              builder_id: property.builder_id,
              asset_type: `image_${variantName}`,
              asset_url: publicUrl,
              storage_bucket: 'property-images',
              storage_path: filePath,
              width: variant.width,
              height: variant.height,
              format: variant.format,
              mime_type: variant.format === 'webp' ? 'image/webp' : 'image/jpeg',
              processing_status: 'completed',
              is_active: true,
              metadata: {
                original_url: imageUrl,
                image_index: i,
                variant: variantName,
              },
            })
          } catch (uploadError) {
            console.error(`[Image Processing] Error uploading ${variantName}:`, uploadError)
          }
        }

        processedImages.push({
          original: imageUrl,
          variants: uploadedUrls,
        })
      } catch (error) {
        console.error(`[Image Processing] Error processing image ${i}:`, error)
      }
    }

    // Step 3: Update property status
    const totalAssets = processedImages.reduce((sum, img) => sum + img.variants.length, 0)
    await supabase
      .from('properties')
      .update({
        media_assets_processed: true,
        media_assets_count: totalAssets,
      })
      .eq('id', property_id)

    return NextResponse.json({
      success: true,
      property_id,
      images_processed: processedImages.length,
      total_assets: totalAssets,
      status: 'image_processing_complete',
    })
  } catch (error) {
    console.error('[Image Processing] Error:', error)
    return NextResponse.json(
      { error: 'Internal server error', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}




