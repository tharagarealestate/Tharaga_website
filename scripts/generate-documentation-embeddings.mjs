/**
 * Generate embeddings for feature documentation
 * Run this script after adding/updating documentation entries
 * 
 * Usage: node scripts/generate-documentation-embeddings.mjs
 */

import 'dotenv/config';
import { createClient } from '@supabase/supabase-js';
import OpenAI from 'openai';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const openaiApiKey = process.env.OPENAI_API_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing Supabase credentials');
  process.exit(1);
}

if (!openaiApiKey) {
  console.error('❌ Missing OPENAI_API_KEY');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);
const openai = new OpenAI({ apiKey: openaiApiKey });

/**
 * Generate embedding for text using OpenAI
 */
async function generateEmbedding(text) {
  try {
    const response = await openai.embeddings.create({
      model: 'text-embedding-3-small',
      input: text.trim(),
    });
    return response.data[0].embedding;
  } catch (error) {
    console.error('Error generating embedding:', error);
    throw error;
  }
}

/**
 * Generate text representation for documentation entry
 */
function generateDocumentationText(doc) {
  const parts = [
    doc.feature_name,
    doc.short_description,
    doc.full_description,
    ...(doc.benefits || []),
    ...(doc.use_cases || []),
    doc.category,
  ].filter(Boolean);

  return parts.join(' ');
}

/**
 * Main function
 */
async function main() {
  console.log('🚀 Starting embedding generation for feature documentation...\n');

  // Fetch documentation entries that need embedding
  const { data: docs, error: fetchError } = await supabase
    .from('feature_documentation')
    .select('*')
    .or('needs_embedding.eq.true,embedding.is.null')
    .limit(100);

  if (fetchError) {
    console.error('❌ Error fetching documentation:', fetchError);
    process.exit(1);
  }

  if (!docs || docs.length === 0) {
    console.log('✅ No documentation entries need embedding');
    return;
  }

  console.log(`📄 Found ${docs.length} documentation entries to process\n`);

  let successCount = 0;
  let errorCount = 0;

  for (const doc of docs) {
    try {
      console.log(`Processing: ${doc.feature_name} (${doc.feature_key})`);

      // Generate text representation
      const text = generateDocumentationText(doc);

      // Generate embedding
      const embedding = await generateEmbedding(text);

      // Update in database
      const { error: updateError } = await supabase
        .from('feature_documentation')
        .update({
          embedding: `[${embedding.join(',')}]`,
          needs_embedding: false,
        })
        .eq('id', doc.id);

      if (updateError) {
        throw updateError;
      }

      console.log(`  ✅ Generated embedding (${embedding.length} dimensions)`);
      successCount++;

      // Small delay to avoid rate limiting
      await new Promise(resolve => setTimeout(resolve, 100));
    } catch (error) {
      console.error(`  ❌ Error processing ${doc.feature_name}:`, error.message);
      errorCount++;
    }
  }

  console.log(`\n✅ Completed: ${successCount} successful, ${errorCount} errors`);
}

main().catch(console.error);




