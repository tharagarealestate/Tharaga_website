# Embedding Generation - Preparation Guide

## Current Status

I've checked your database and found that the `feature_documentation` table currently has **0 entries**. This means the embedding generation script cannot run yet because there's no documentation content to process.

## What Needs to Be Done First

Before you can run the embedding generation script, you need to populate the `feature_documentation` table with actual feature documentation entries. The embedding script works by reading documentation entries from this table, combining the feature name, descriptions, benefits, and use cases into a text string, sending that text to OpenAI's embedding API to generate a 1536-dimensional vector representation, and then storing that vector back in the database. This vector embedding enables semantic search functionality where users can ask questions in natural language and find relevant documentation based on meaning rather than just keyword matching.

## Required Steps

### Step 1: Add Feature Documentation Data

You need to insert feature documentation entries into the `feature_documentation` table. Based on your project structure, there are 18 features that should be documented:

**Marketing Automation (6 features)**:
- behavioral_lead_scoring
- monkey_lion_dog_classification  
- nine_workflow_automation
- automated_whatsapp_workflows
- email_marketing_sequences
- paid_ads_automation

**Lead Management (4 features)**:
- smart_lead_assignment
- lead_source_tracking
- lead_segmentation
- followup_reminders

**Property Management (3 features)**:
- property_upload_autosave
- virtual_staging
- property_performance

**Analytics (3 features)**:
- realtime_builder_dashboard
- campaign_roi_reports
- buyer_journey_visualization

**Billing (2 features)**:
- subscription_management
- cost_savings_calculator

Each entry requires these fields:
- `feature_key` (unique identifier, e.g., "behavioral_lead_scoring")
- `feature_name` (display name)
- `category` (one of: marketing_automation, lead_management, property_management, analytics, billing)
- `short_description` (1-2 sentences)
- `full_description` (detailed explanation)
- `benefits` (array of benefit strings)
- `use_cases` (array of use case scenarios)
- Optional: `tier_required`, `is_ai_powered`, `is_new_feature`, `feature_icon`, `icon_color`, `video_url`, `how_to_steps` (JSONB), `related_features` (array)

### Step 2: Verify Environment Variables

The embedding script requires three environment variables to be set:

1. **NEXT_PUBLIC_SUPABASE_URL** - Your Supabase project URL (already configured if your app is working)
2. **SUPABASE_SERVICE_ROLE_KEY** - Your Supabase service role key (needed for service-level database access)
3. **OPENAI_API_KEY** - Your OpenAI API key (required to generate embeddings using OpenAI's text-embedding-3-small model)

These should be in your `.env.production` file or your local `.env` file. The script uses the `dotenv/config` package to load these variables automatically.

### Step 3: Run the Embedding Script

Once you have documentation entries in the table and your environment variables are configured, you can run the script using:

```bash
node scripts/generate-documentation-embeddings.mjs
```

The script will automatically find all documentation entries where `needs_embedding` is true or where the `embedding` column is null, generate embeddings for each one using OpenAI's API, and update the database with the vector embeddings. It processes entries in batches with a small delay between requests to avoid rate limiting, and it will show you progress as it processes each feature.

## Important Notes

The embedding generation process requires an active internet connection to call OpenAI's API, and it will incur API costs based on OpenAI's pricing for the text-embedding-3-small model (which is relatively inexpensive, typically around $0.02 per 1M tokens). The script is designed to be idempotent - you can run it multiple times safely, and it will only process entries that need embeddings. If you add new documentation entries later, you can simply run the script again and it will generate embeddings for the new entries without regenerating existing ones.

## Summary

In summary, you cannot run the embedding script right now because the `feature_documentation` table is empty. You need to first insert your feature documentation data into this table, ensure your environment variables (especially OPENAI_API_KEY) are properly configured, and then you can run the embedding generation script. The script itself is ready and will work automatically once these prerequisites are met.





















