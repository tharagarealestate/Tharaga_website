// scripts/embed-properties-local.mjs
import 'dotenv/config';
import { pipeline } from '@xenova/transformers';
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_ROLE = process.env.SUPABASE_SERVICE_ROLE;
const MODEL = process.env.EMBED_MODEL || 'Xenova/e5-small-v2'; // default model (384-dim)
const BATCH = Number(process.env.BATCH || 200);

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE) {
  console.error('Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE in .env');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE);

async function makeEmbedding(extractor, text) {
  try {
    const out = await extractor(String(text || '').slice(0, 2000), { pooling: 'mean', normalize: true });
    return Array.from(out?.data || []);
  } catch (e) {
    console.error('Embedding failed:', e?.message || e);
    return null;
  }
}

async function main() {
  console.log('Loading model (this downloads weights locally first run):', MODEL);
  const extractor = await pipeline('feature-extraction', MODEL, { quantized: true });
  console.log('Model loaded.');

  let offset = 0;
  while (true) {
    // select rows that either need embedding or have null embedding
    const { data: props, error } = await supabase
      .from('properties')
      .select('id,title,description,locality,city')
      .or('needs_embedding.eq.true,embedding.is.null')
      .order('id')
      .range(offset, offset + BATCH - 1);

    if (error) throw error;
    if (!props || props.length === 0) break;

    for (const p of props) {
      try {
        const text = [p.title, p.description, p.locality, p.city].filter(Boolean).join(' - ');
        const vec = await makeEmbedding(extractor, text);
        if (!vec || vec.length === 0) {
          console.warn('No vector for', p.id);
          continue;
        }
        const { error: upErr } = await supabase
          .from('properties')
          .update({
            embedding: vec,
            embedded_at: new Date().toISOString(),
            needs_embedding: false
          })
          .eq('id', p.id);
        if (upErr) {
          console.error('Update failed for', p.id, upErr);
        } else {
          console.log('Embedded ->', p.id);
        }
      } catch (err) {
        console.error('Property embed error', p.id, err?.message || err);
      }
    }

    offset += BATCH;
  }

  console.log('All done.');
  process.exit(0);
}

main().catch(err => { console.error(err); process.exit(1); });
