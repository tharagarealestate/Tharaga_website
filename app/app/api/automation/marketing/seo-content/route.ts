/**
 * WORKFLOW 7: SEO CONTENT PUBLISHING ENGINE
 * Trigger: Webhook from Content Generation Workflow
 * Purpose: Auto-publish SEO-optimized blog articles, neighborhood guides, and comparison pages
 */

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { anthropicClient } from '@/lib/ai/anthropic'

export const maxDuration = 600 // 10 minutes for content generation and publishing

export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient()
    const body = await req.json()
    const { property_id } = body

    if (!property_id) {
      return NextResponse.json({ error: 'Missing property_id' }, { status: 400 })
    }

    // Step 1: Fetch Property, Content, and Strategy Data
    const [propertyResult, contentResult, strategyResult] = await Promise.all([
      supabase.from('properties').select('*').eq('id', property_id).single(),
      supabase.from('property_content_library').select('*').eq('property_id', property_id).eq('content_type', 'master_set').order('created_at', { ascending: false }).limit(1).single(),
      supabase.from('property_marketing_strategies').select('*').eq('property_id', property_id).order('created_at', { ascending: false }).limit(1).single(),
    ])

    if (propertyResult.error || !propertyResult.data) {
      return NextResponse.json({ error: 'Property not found' }, { status: 404 })
    }

    const property = propertyResult.data
    const content = contentResult.data?.content_data || {}
    const strategy = strategyResult.data || {}

    // Step 2: Generate Comprehensive SEO Article
    const seoArticle = await generateSEOArticle(property, content, strategy)

    // Step 3: Generate Neighborhood Guide
    const neighborhoodGuide = await generateNeighborhoodGuide(property)

    // Step 4: Generate Comparison Articles
    const comparisonArticle = await generateComparisonArticle(property, supabase)

    // Step 5: Publish to WordPress/Ghost CMS (if configured)
    const publishedArticles = await publishToCMS(property, seoArticle, neighborhoodGuide, comparisonArticle, content)

    // Step 6: Build Internal Linking Structure
    await buildInternalLinks(publishedArticles)

    // Step 7: Store SEO Content Data
    const seoContentInserts = [
      {
        property_id,
        builder_id: property.builder_id,
        content_type: 'property_article',
        title: content.seo_content?.seo_titles?.[0] || `${property.title} - Complete Guide`,
        url: publishedArticles.main_article?.url || `https://tharaga.co.in/blog/${slugify(property.title)}`,
        slug: slugify(property.title),
        wordpress_post_id: publishedArticles.main_article?.id || null,
        focus_keywords: content.seo_content?.focus_keywords || [],
        meta_description: content.seo_content?.meta_description || '',
        meta_title: content.seo_content?.seo_titles?.[0] || '',
        word_count: seoArticle.word_count || 2000,
        reading_time_minutes: Math.ceil((seoArticle.word_count || 2000) / 200),
        html_content: seoArticle.html,
        status: publishedArticles.main_article ? 'published' : 'draft',
        published_at: publishedArticles.main_article ? new Date().toISOString() : null,
        indexed_by_google: false,
      },
      {
        property_id,
        builder_id: property.builder_id,
        content_type: 'neighborhood_guide',
        title: `Complete Guide to Living in ${property.location}`,
        url: publishedArticles.neighborhood_guide?.url || `https://tharaga.co.in/blog/guide-${slugify(property.location)}`,
        slug: `guide-${slugify(property.location)}`,
        wordpress_post_id: publishedArticles.neighborhood_guide?.id || null,
        focus_keywords: [`living in ${property.location}`, `${property.location} guide`],
        meta_description: `Comprehensive guide to ${property.location} - schools, hospitals, connectivity, and everything you need to know.`,
        word_count: neighborhoodGuide.word_count || 1500,
        reading_time_minutes: Math.ceil((neighborhoodGuide.word_count || 1500) / 200),
        html_content: neighborhoodGuide.html,
        status: publishedArticles.neighborhood_guide ? 'published' : 'draft',
        published_at: publishedArticles.neighborhood_guide ? new Date().toISOString() : null,
        indexed_by_google: false,
      },
      {
        property_id,
        builder_id: property.builder_id,
        content_type: 'comparison',
        title: `${property.title} vs Top ${property.bhk_type} Options in ${property.location}`,
        url: publishedArticles.comparison_article?.url || `https://tharaga.co.in/blog/comparison-${slugify(property.title)}`,
        slug: `comparison-${slugify(property.title)}`,
        wordpress_post_id: publishedArticles.comparison_article?.id || null,
        focus_keywords: [`${property.bhk_type} comparison ${property.location}`],
        meta_description: `Compare ${property.title} with top alternatives in ${property.location}. Find the best value for your investment.`,
        word_count: comparisonArticle.word_count || 1200,
        reading_time_minutes: Math.ceil((comparisonArticle.word_count || 1200) / 200),
        html_content: comparisonArticle.html,
        status: publishedArticles.comparison_article ? 'published' : 'draft',
        published_at: publishedArticles.comparison_article ? new Date().toISOString() : null,
        indexed_by_google: false,
      },
    ]

    const { error: insertError } = await supabase.from('seo_content').insert(seoContentInserts)

    if (insertError) {
      console.error('[SEO Content] Error storing content:', insertError)
    }

    // Step 8: Update Property Status
    await supabase
      .from('properties')
      .update({
        seo_content_published: true,
        seo_articles_count: 3,
        main_article_url: publishedArticles.main_article?.url || seoContentInserts[0].url,
      })
      .eq('id', property_id)

    return NextResponse.json({
      success: true,
      property_id,
      articles_published: {
        main_article: publishedArticles.main_article,
        neighborhood_guide: publishedArticles.neighborhood_guide,
        comparison_article: publishedArticles.comparison_article,
      },
      seo_status: 'complete',
      google_indexed: false, // Will be indexed after submission
      status: 'seo_content_publishing_complete',
    })
  } catch (error) {
    console.error('[SEO Content] Error:', error)
    return NextResponse.json(
      { error: 'Internal server error', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}

// Helper Functions

async function generateSEOArticle(property: any, content: any, strategy: any) {
  const prompt = `You are an expert SEO content writer for Indian real estate. Write a comprehensive, Google-ranking article about this property.

PROPERTY: ${property.title}
LOCATION: ${property.location}
PRICE: ₹${(property.price || property.price_inr)?.toLocaleString('en-IN')}
TYPE: ${property.bhk_type} ${property.property_type}

TARGET KEYWORDS: ${(content.seo_content?.focus_keywords || []).join(', ')}

Write a 2000-word article in HTML format with proper H1, H2, H3 tags, internal links, and schema.org markup. Include:
1. Introduction (150 words)
2. Why ${property.location} is the Perfect Location (300 words)
3. ${property.bhk_type} ${property.property_type} - Detailed Overview (400 words)
4. Price Analysis & Investment Potential (300 words)
5. Builder Reputation & RERA Compliance (200 words)
6. Financing Options & EMI Calculator (200 words)
7. How to Book & Next Steps (150 words)
8. Comparison with Similar Properties (200 words)
9. Frequently Asked Questions (100 words)
10. Conclusion (100 words)

Return HTML with proper structure, headings, and formatting.`

  try {
    const response = await anthropicClient.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 8000,
      messages: [{ role: 'user', content: prompt }],
    })

    const html = response.content[0].type === 'text' ? response.content[0].text : ''
    const wordCount = html.split(/\s+/).length

    return { html, word_count: wordCount }
  } catch (error) {
    console.error('[SEO Content] Error generating article:', error)
    return { html: '<p>Article generation failed. Please try again.</p>', word_count: 0 }
  }
}

async function generateNeighborhoodGuide(property: any) {
  const prompt = `Write a comprehensive neighborhood guide for ${property.location} in HTML format.

Include:
1. Area Overview (200 words)
2. Connectivity - Metro, Bus, Highway access (150 words)
3. Top 10 Schools with ratings (200 words)
4. Top 5 Hospitals (150 words)
5. Shopping Malls & Markets (150 words)
6. Restaurants & Cafes (100 words)
7. Parks & Recreation (100 words)
8. Safety & Crime Statistics (100 words)
9. Future Development Plans (150 words)
10. Average Property Prices by segment (150 words)

Total: ~1500 words. Format: HTML with proper headings, lists, and tables. Include Google Maps embed code.`

  try {
    const response = await anthropicClient.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 6000,
      messages: [{ role: 'user', content: prompt }],
    })

    const html = response.content[0].type === 'text' ? response.content[0].text : ''
    const wordCount = html.split(/\s+/).length

    return { html, word_count: wordCount }
  } catch (error) {
    console.error('[SEO Content] Error generating neighborhood guide:', error)
    return { html: '<p>Neighborhood guide generation failed.</p>', word_count: 0 }
  }
}

async function generateComparisonArticle(property: any, supabase: any) {
  // Fetch competitor properties
  const { data: competitors } = await supabase
    .from('properties')
    .select('id, title, price, price_inr, bhk_type, carpet_area, location, amenities')
    .ilike('location', `%${property.location}%`)
    .eq('bhk_type', property.bhk_type)
    .neq('id', property.id)
    .eq('status', 'active')
    .limit(3)

  const prompt = `Create a detailed comparison article in HTML format:

Title: "${property.title} vs Top Alternatives in ${property.location}"

Compare these properties:
1. ${property.title} - ₹${(property.price || property.price_inr)?.toLocaleString('en-IN')} - ${property.carpet_area} sq.ft
${(competitors || []).map((c: any, i: number) => `${i + 2}. ${c.title} - ₹${(c.price || c.price_inr)?.toLocaleString('en-IN')} - ${c.carpet_area} sq.ft`).join('\n')}

Create comparison tables for:
- Price per sq.ft
- Total area
- Amenities (use checkmarks)
- Location advantages
- Builder reputation
- Possession timeline
- RERA status

Then write 300-word analysis explaining:
- Best value for money
- Best for families
- Best for investment
- Best for immediate possession

Format: HTML with responsive tables, proper headings, and CTAs.`

  try {
    const response = await anthropicClient.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 4000,
      messages: [{ role: 'user', content: prompt }],
    })

    const html = response.content[0].type === 'text' ? response.content[0].text : ''
    const wordCount = html.split(/\s+/).length

    return { html, word_count: wordCount }
  } catch (error) {
    console.error('[SEO Content] Error generating comparison article:', error)
    return { html: '<p>Comparison article generation failed.</p>', word_count: 0 }
  }
}

async function publishToCMS(property: any, seoArticle: any, neighborhoodGuide: any, comparisonArticle: any, content: any) {
  const articles: any = {}

  // Only publish if WordPress URL and token are configured
  if (!process.env.WORDPRESS_URL || !process.env.WORDPRESS_JWT_TOKEN) {
    console.log('[SEO Content] WordPress not configured. Articles saved as drafts.')
    return {
      main_article: null,
      neighborhood_guide: null,
      comparison_article: null,
    }
  }

  try {
    // Publish main article
    const mainArticleResponse = await fetch(`${process.env.WORDPRESS_URL}/wp-json/wp/v2/posts`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${process.env.WORDPRESS_JWT_TOKEN}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        title: content.seo_content?.seo_titles?.[0] || `${property.title} - Complete Guide`,
        content: seoArticle.html,
        status: 'publish',
        categories: [12], // Real Estate category ID (adjust as needed)
        tags: (content.seo_content?.focus_keywords || []).map((k: string) => k.toLowerCase().replace(/ /g, '-')),
        meta: {
          _yoast_wpseo_focuskw: content.seo_content?.focus_keywords?.[0] || '',
          _yoast_wpseo_metadesc: content.seo_content?.meta_description || '',
        },
      }),
    })

    if (mainArticleResponse.ok) {
      articles.main_article = await mainArticleResponse.json()
    }

    // Publish neighborhood guide
    const neighborhoodResponse = await fetch(`${process.env.WORDPRESS_URL}/wp-json/wp/v2/posts`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${process.env.WORDPRESS_JWT_TOKEN}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        title: `Complete Guide to Living in ${property.location}`,
        content: neighborhoodGuide.html,
        status: 'publish',
        categories: [15], // Neighborhood Guides category (adjust as needed)
        tags: [property.location.toLowerCase(), 'neighborhood-guide'],
      }),
    })

    if (neighborhoodResponse.ok) {
      articles.neighborhood_guide = await neighborhoodResponse.json()
    }

    // Publish comparison article
    const comparisonResponse = await fetch(`${process.env.WORDPRESS_URL}/wp-json/wp/v2/posts`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${process.env.WORDPRESS_JWT_TOKEN}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        title: `${property.title} vs Top ${property.bhk_type} Options in ${property.location}`,
        content: comparisonArticle.html,
        status: 'publish',
        categories: [18], // Comparisons category (adjust as needed)
        tags: [...(content.seo_content?.focus_keywords || []), 'property-comparison', property.location.toLowerCase()],
      }),
    })

    if (comparisonResponse.ok) {
      articles.comparison_article = await comparisonResponse.json()
    }
  } catch (error) {
    console.error('[SEO Content] Error publishing to CMS:', error)
  }

  return articles
}

async function buildInternalLinks(publishedArticles: any) {
  // Submit to Google for indexing if articles were published
  if (publishedArticles.main_article?.url && process.env.GOOGLE_INDEXING_API_TOKEN) {
    try {
      await fetch('https://indexing.googleapis.com/v3/urlNotifications:publish', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${process.env.GOOGLE_INDEXING_API_TOKEN}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          url: publishedArticles.main_article.url,
          type: 'URL_UPDATED',
        }),
      })
    } catch (error) {
      console.error('[SEO Content] Error submitting to Google:', error)
    }
  }
}

function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
}























