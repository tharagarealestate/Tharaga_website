/**
 * Image Processing Helper Functions
 * Processes property images, generates virtual staging, creates optimized variants
 */

import sharp from 'sharp'

export interface ImageVariant {
  variant: string
  buffer: Buffer
  width: number
  height: number
  format: string
  quality: number
}

export interface ProcessedImageSet {
  original: string
  variants: Record<string, ImageVariant>
}

/**
 * Optimize images for different platforms
 */
export async function optimizeImageForPlatforms(
  imageUrl: string,
  originalBuffer?: Buffer
): Promise<ProcessedImageSet> {
  // Download image if buffer not provided
  let imageBuffer = originalBuffer
  if (!imageBuffer) {
    const response = await fetch(imageUrl)
    if (!response.ok) {
      throw new Error(`Failed to download image: ${response.statusText}`)
    }
    imageBuffer = Buffer.from(await response.arrayBuffer())
  }

  const imageSharp = sharp(imageBuffer)
  const metadata = await imageSharp.metadata()

  const variants: Record<string, ImageVariant> = {
    // Full resolution (web)
    full: {
      variant: 'full',
      buffer: await imageSharp
        .resize(2048, 1536, { fit: 'inside', withoutEnlargement: true })
        .jpeg({ quality: 90, progressive: true })
        .toBuffer(),
      width: 2048,
      height: 1536,
      format: 'jpeg',
      quality: 90,
    },
    // Instagram (1080x1080 square)
    instagram_feed: {
      variant: 'instagram_feed',
      buffer: await imageSharp
        .clone()
        .resize(1080, 1080, { fit: 'cover', position: 'centre' })
        .jpeg({ quality: 85 })
        .toBuffer(),
      width: 1080,
      height: 1080,
      format: 'jpeg',
      quality: 85,
    },
    // Instagram story (1080x1920)
    instagram_story: {
      variant: 'instagram_story',
      buffer: await imageSharp
        .clone()
        .resize(1080, 1920, { fit: 'cover', position: 'centre' })
        .jpeg({ quality: 85 })
        .toBuffer(),
      width: 1080,
      height: 1920,
      format: 'jpeg',
      quality: 85,
    },
    // Facebook (1200x630)
    facebook_og: {
      variant: 'facebook_og',
      buffer: await imageSharp
        .clone()
        .resize(1200, 630, { fit: 'cover', position: 'centre' })
        .jpeg({ quality: 85 })
        .toBuffer(),
      width: 1200,
      height: 630,
      format: 'jpeg',
      quality: 85,
    },
    // Google Ads (1200x628)
    google_display: {
      variant: 'google_display',
      buffer: await imageSharp
        .clone()
        .resize(1200, 628, { fit: 'cover', position: 'centre' })
        .jpeg({ quality: 85 })
        .toBuffer(),
      width: 1200,
      height: 628,
      format: 'jpeg',
      quality: 85,
    },
    // Thumbnail (400x300)
    thumbnail: {
      variant: 'thumbnail',
      buffer: await imageSharp
        .clone()
        .resize(400, 300, { fit: 'cover', position: 'centre' })
        .jpeg({ quality: 80 })
        .toBuffer(),
      width: 400,
      height: 300,
      format: 'jpeg',
      quality: 80,
    },
    // WebP version for modern browsers
    webp: {
      variant: 'webp',
      buffer: await imageSharp
        .clone()
        .resize(2048, 1536, { fit: 'inside', withoutEnlargement: true })
        .webp({ quality: 85 })
        .toBuffer(),
      width: 2048,
      height: 1536,
      format: 'webp',
      quality: 85,
    },
  }

  return {
    original: imageUrl,
    variants,
  }
}

/**
 * Generate virtual staging using Stable Diffusion API
 */
export async function generateVirtualStaging(
  imageUrl: string,
  apiKey: string
): Promise<string> {
  // Note: This is a placeholder. In production, you would:
  // 1. Upload image to Stability AI
  // 2. Use image-to-image endpoint
  // 3. Return the staged image URL

  const response = await fetch('https://api.stability.ai/v1/generation/stable-diffusion-xl-1024-v1-0/image-to-image', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      init_image: imageUrl,
      text_prompts: [
        { text: 'modern luxury interior design, high-end furniture, professional staging, warm lighting, photorealistic, 8k quality', weight: 1 },
        { text: 'blurry, low quality, distorted, unrealistic', weight: -1 },
      ],
      cfg_scale: 7,
      samples: 1,
      steps: 50,
      image_strength: 0.35,
    }),
  })

  if (!response.ok) {
    throw new Error(`Stability AI API error: ${response.statusText}`)
  }

  const data = await response.json()
  // Return base64 image or URL depending on API response
  return data.artifacts?.[0]?.base64 || imageUrl
}

/**
 * Upload image to Supabase Storage
 */
export async function uploadToSupabaseStorage(
  buffer: Buffer,
  bucket: string,
  path: string,
  supabaseUrl: string,
  supabaseKey: string
): Promise<string> {
  const response = await fetch(`${supabaseUrl}/storage/v1/object/${bucket}/${path}`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${supabaseKey}`,
      'Content-Type': 'image/jpeg',
    },
    body: buffer,
  })

  if (!response.ok) {
    throw new Error(`Supabase Storage upload error: ${response.statusText}`)
  }

  return `${supabaseUrl}/storage/v1/object/public/${bucket}/${path}`
}




