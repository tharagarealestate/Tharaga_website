import 'dotenv/config';
import { createClient } from '@supabase/supabase-js';
import { pipeline } from '@xenova/transformers';

// Use the SAME model as ingestion
const MODEL_ID = 'Xenova/e5-small-v2';

// Supabase client (Service Role for local dev)
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE
);

// E5 tip: prefix "query:" for search queries
const mkQuery = (q) => `query: ${q}`;

// Convert float array -> pgvector text "[...]" with fixed decimals
function toVectorText(arr) {
  if (!Array.isArray(arr) || arr.length === 0) {
    throw new Error('Invalid vector: empty');
  }
  return `[${arr.map((x) => Number(x).toFixed(6)).join(',')}]`;
}

// Minimal argv parser: --q "text" --city Chennai --ptype Apartment --k 10 ...
function parseArgs(argv) {
  const out = {};
  for (let i = 2; i < argv.length; i++) {
    const token = argv[i];
    if (!token.startsWith('--')) continue;
    const key = token.slice(2);
    const val = argv[i + 1] && !argv[i + 1].startsWith('--') ? argv[++i] : true;
    out[key] = val;
  }
  return out;
}

async function main() {
  const args = parseArgs(process.argv);

  if (!args.q) {
    console.log(`
Usage:
  npm run search -- --q "3 BHK apartment in Anna Nagar with balcony" [--city Chennai] [--ptype Apartment] [--k 10]
  Optional filters:
    --budget_min 3000000   --budget_max 8000000
    --bedrooms_min 2       --bathrooms_min 2
    --verified_only true/false
`);
    process.exit(1);
  }

  // 1) Load model once (downloads on first run, then cached)
  const extractor = await pipeline('feature-extraction', MODEL_ID, { quantized: true });

  // 2) Build normalized query embedding
  const reps = await extractor([mkQuery(String(args.q))], { pooling: 'mean', normalize: true });
  const vec = reps.tolist()[0];
  if (vec.length !== 384) {
    throw new Error(`Vector dimension ${vec.length} != 384. Ensure MODEL_ID=${MODEL_ID}`);
  }
  const q_vec_text = toVectorText(vec);

  // 3) Prepare filters (ensure numbers are numbers or null)
  const _city = args.city ?? null;
  const _ptype = args.ptype ?? null;
  const _budget_min = args.budget_min ? Number(args.budget_min) : null;
  const _budget_max = args.budget_max ? Number(args.budget_max) : null;
  const _bedrooms_min = args.bedrooms_min ? parseInt(args.bedrooms_min) : null;
  const _bathrooms_min = args.bathrooms_min ? parseInt(args.bathrooms_min) : null;
  const _verified_only = (String(args.verified_only ?? 'false').toLowerCase() === 'true');
  const _k = args.k ? parseInt(args.k) : 10;

  // 4) Call RPC
  const { data, error } = await supabase.rpc('match_candidates', {
    q_vec_text,
    _city,
    _ptype,
    _budget_min,
    _budget_max,
    _bedrooms_min,
    _bathrooms_min,
    _verified_only,
    _k
  });

  if (error) {
    console.error('RPC error:', error);
    console.log('\nIf it says function not found, re-run the SQL that creates match_candidates (see step 1).');
    process.exit(1);
  }

  if (!data || data.length === 0) {
    console.log('No matches. Tips:\n- Loosen filters\n- Increase --k\n- Check that properties.embedding is not null');
    return;
  }

  console.log(`\nTop ${data.length} matches for: "${args.q}"\n`);
  for (const r of data) {
    const loc = [r.city, r.locality].filter(Boolean).join(', ');
    const price = r.price_inr != null ? `₹${r.price_inr}` : '₹N/A';
    const bb = [r.bedrooms && `${r.bedrooms} BR`, r.bathrooms && `${r.bathrooms} BA`].filter(Boolean).join(', ');
    console.log(`• ${r.title} — ${r.property_type || 'N/A'} — ${loc} — ${price} — ${bb} — sim=${r.sem_sim.toFixed(3)}`);
  }
  console.log('');
}

main().catch((e) => {
  console.error('Search failed:', e);
  process.exit(1);
});
