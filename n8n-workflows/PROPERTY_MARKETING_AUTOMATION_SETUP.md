# Property Marketing Automation System - N8N Setup Guide

Complete implementation guide for setting up the advanced real-time marketing automation system for property listings.

## Overview

This system provides comprehensive marketing automation that triggers when a new property is inserted with `status = 'active'`:

1. **Instant Property Intelligence Engine**: AI-powered market analysis and strategy generation
2. **AI Content Generation Factory**: 50+ content variants across all channels
3. **Advanced Image Processing**: Optimized images for all platforms, virtual staging
4. **Instant Landing Page Generator**: SEO-optimized landing pages with custom domains
5. **Multi-Channel Social Media Automation**: Auto-publish to Instagram, Facebook, LinkedIn, Twitter

## Prerequisites

1. **n8n Instance**: Self-hosted or n8n Cloud account
2. **API Access**: All endpoints require authentication
3. **Environment Variables**: Configured in n8n credentials
4. **Database**: Supabase migrations applied (`060_property_marketing_automation.sql`)
5. **API Keys**: Anthropic (Claude), Stability AI (optional), Social Media APIs

## Environment Variables

Configure these in n8n credentials:

```bash
# Tharaga API
THARAGA_API_URL=https://tharaga.co.in
THARAGA_API_KEY=your-api-key-here
INTERNAL_API_KEY=your-internal-api-key

# Supabase
SUPABASE_URL=https://xxxxxxxxxxxxx.supabase.co
SUPABASE_SERVICE_ROLE_KEY=xxxxxxxxxxxxx

# Anthropic (for AI content)
ANTHROPIC_API_KEY=sk-ant-xxxxxxxxxxxxx

# Stability AI (for virtual staging - optional)
STABILITY_API_KEY=sk-xxxxxxxxxxxxx

# Social Media APIs
META_ACCESS_TOKEN=xxxxxxxxxxxxx
LINKEDIN_ACCESS_TOKEN=xxxxxxxxxxxxx
TWITTER_BEARER_TOKEN=xxxxxxxxxxxxx

# Vercel (for landing page deployment)
VERCEL_TOKEN=xxxxxxxxxxxxx
VERCEL_PROJECT_ID=xxxxxxxxxxxxx
CLOUDFLARE_API_KEY=xxxxxxxxxxxxx
CLOUDFLARE_ZONE_ID=xxxxxxxxxxxxx
```

## Database Setup

The migration `060_property_marketing_automation.sql` creates:

- `property_marketing_strategies`: AI-generated marketing strategies
- `property_content_library`: 50+ content variants per property
- `property_media_assets`: Processed visual assets
- `property_landing_pages`: Landing page deployment details
- `social_monitoring_tasks`: Social media engagement monitoring

The migration also:
- Adds marketing automation columns to `properties` table
- Creates database trigger for real-time property insert events
- Creates helper function `get_property_marketing_context()`

## API Endpoints

### 1. Intelligence Engine
**Endpoint**: `POST /api/automation/marketing/intelligence-engine`

**Trigger**: Supabase INSERT on `properties` table with `status = 'active'`

**What it does**:
- Fetches complete property context (competitors, market trends)
- Generates AI marketing strategy using Claude
- Stores strategy in database
- Triggers parallel workflows (content, images, landing page, social)

### 2. Content Generation
**Endpoint**: `POST /api/automation/marketing/content-generation`

**Trigger**: Webhook from Intelligence Engine

**What it does**:
- Generates 50+ content variants (descriptions, headlines, ad copy, social posts, emails, SEO)
- Creates localized variants (Hindi, Tamil, Kannada, Telugu)
- Generates A/B test variants
- Stores all content in database

### 3. Image Processing
**Endpoint**: `POST /api/automation/marketing/image-processing`

**Trigger**: Webhook from Intelligence Engine

**What it does**:
- Optimizes images for all platforms (Instagram, Facebook, Google Ads, web)
- Generates virtual staging (if enabled)
- Uploads optimized variants to Supabase Storage
- Stores media asset metadata

### 4. Landing Page Generator
**Endpoint**: `POST /api/automation/marketing/landing-page`

**Trigger**: Webhook from Intelligence Engine (with 30s delay)

**What it does**:
- Generates SEO-optimized HTML landing page
- Deploys to Vercel/Netlify
- Configures custom domain and SSL
- Stores deployment details

### 5. Social Media Automation
**Endpoint**: `POST /api/automation/marketing/social-media`

**Trigger**: Webhook from Content Generation (with 60s delay)

**What it does**:
- Schedules posts for Instagram, Facebook, LinkedIn, Twitter
- Optimizes posting times using AI
- Creates monitoring tasks for engagement tracking
- Stores post metadata

## N8N Workflow Configuration

### Workflow 1: Property Insert Trigger

**Trigger**: Supabase Database Trigger
- Event: `INSERT`
- Table: `properties`
- Filter: `status = 'active' AND marketing_automation_enabled = true`

**Node 1**: Supabase Trigger
- Listens for new property inserts

**Node 2**: HTTP Request
- Calls `/api/automation/marketing/intelligence-engine`
- Passes property record as payload

**Node 3**: Conditional
- Checks if intelligence engine succeeded

**Node 4**: Merge/Continue
- Proceeds to next workflows

### Workflow 2: Content Generation

**Trigger**: Webhook from Intelligence Engine

**Node 1**: Webhook Receiver
- Receives property_id and strategy

**Node 2**: HTTP Request
- Calls `/api/automation/marketing/content-generation`

**Node 3**: Wait Node (if needed)
- Optional delay before next step

### Workflow 3: Image Processing

**Trigger**: Webhook from Intelligence Engine

**Node 1**: Webhook Receiver
- Receives property_id

**Node 2**: HTTP Request
- Calls `/api/automation/marketing/image-processing`

### Workflow 4: Landing Page Generation

**Trigger**: Webhook from Intelligence Engine (30s delay)

**Node 1**: Wait Node
- 30 second delay

**Node 2**: Webhook Receiver
- Receives property_id

**Node 3**: HTTP Request
- Calls `/api/automation/marketing/landing-page`

### Workflow 5: Social Media Automation

**Trigger**: Webhook from Content Generation (60s delay)

**Node 1**: Wait Node
- 60 second delay

**Node 2**: Webhook Receiver
- Receives property_id

**Node 3**: HTTP Request
- Calls `/api/automation/marketing/social-media`

## Testing

### Test Property Insert

1. Insert a test property in Supabase:
```sql
INSERT INTO properties (
  id, builder_id, title, description, status, 
  marketing_automation_enabled, price_inr, location, 
  property_type, bhk_type, carpet_area
) VALUES (
  gen_random_uuid(),
  'your-builder-id',
  'Test Property',
  'Test Description',
  'active',
  true,
  5000000,
  'Bangalore',
  'apartment',
  '2 BHK',
  1200
);
```

2. Check webhook logs:
```sql
SELECT * FROM webhook_logs 
WHERE event_type = 'property.insert' 
ORDER BY created_at DESC 
LIMIT 10;
```

3. Verify marketing strategy was created:
```sql
SELECT * FROM property_marketing_strategies 
WHERE property_id = 'your-property-id';
```

4. Verify content was generated:
```sql
SELECT content_type, language, variant_name 
FROM property_content_library 
WHERE property_id = 'your-property-id';
```

5. Verify images were processed:
```sql
SELECT asset_type, asset_url 
FROM property_media_assets 
WHERE property_id = 'your-property-id';
```

## Monitoring

### Check Workflow Status

Query property marketing status:
```sql
SELECT 
  id,
  title,
  marketing_strategy_generated,
  marketing_content_generated,
  media_assets_processed,
  landing_page_live,
  content_variant_count,
  media_assets_count
FROM properties
WHERE status = 'active'
ORDER BY created_at DESC;
```

### Check Social Media Posts

```sql
SELECT 
  platform,
  status,
  scheduled_for,
  posted_at,
  likes_count,
  comments_count
FROM social_media_posts
WHERE property_id = 'your-property-id'
ORDER BY created_at DESC;
```

## Troubleshooting

### Intelligence Engine Not Triggering

1. Check database trigger exists:
```sql
SELECT * FROM pg_trigger WHERE tgname = 'property_marketing_automation_trigger';
```

2. Check webhook_logs table:
```sql
SELECT * FROM webhook_logs 
WHERE event_type = 'property.insert' 
AND status = 'pending';
```

3. Verify property has correct status:
```sql
SELECT id, status, marketing_automation_enabled 
FROM properties 
WHERE id = 'your-property-id';
```

### Content Generation Failing

1. Check Anthropic API key is set
2. Verify API endpoint is accessible
3. Check content_library table for errors:
```sql
SELECT * FROM property_content_library 
WHERE property_id = 'your-property-id' 
ORDER BY created_at DESC;
```

### Image Processing Issues

1. Verify Supabase Storage bucket exists: `property-images`
2. Check service role key has storage permissions
3. Verify image URLs are accessible
4. Check media_assets table:
```sql
SELECT * FROM property_media_assets 
WHERE property_id = 'your-property-id' 
AND processing_status = 'failed';
```

## Next Steps

1. **Configure Social Media APIs**: Set up Meta, LinkedIn, and Twitter API access
2. **Set up Vercel Deployment**: Configure Vercel project and custom domain setup
3. **Enable Virtual Staging**: Configure Stability AI for virtual staging (optional)
4. **Set up Monitoring**: Configure alerts for failed workflows
5. **Optimize Performance**: Adjust delays and parallel processing based on load

## Support

For issues or questions:
- Check Supabase logs for database errors
- Check n8n execution logs for workflow errors
- Review API endpoint logs for HTTP errors
- Verify all environment variables are set correctly












