import 'dotenv/config';
import { createClient } from '@supabase/supabase-js';
import { pipeline } from '@xenova/transformers';

const MODEL_ID = 'Xenova/e5-small-v2';
const EXPECTED_DIM = 384;

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE
);

if (!process.env.SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE) {
  console.error('Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE in env. Check .env keys.');
  process.exit(1);
}

const mkQuery = (q) => `query: ${q}`;

function toVectorText(arr) {
  if (!Array.isArray(arr) || arr.length === 0) throw new Error('Invalid vector: empty');
  return `[${arr.map((x) => Number(x).toFixed(6)).join(',')}]`;
}

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
    console.log('Usage: npm run search -- --q "..." [--city Chennai] [--ptype Apartment] [--k 10] ...');
    process.exit(1);
  }

  // load model (cached)
  const extractor = await pipeline('feature-extraction', MODEL_ID, { quantized: true });

  // create normalized embedding
  const reps = await extractor([mkQuery(String(args.q))], { pooling: 'mean', normalize: true });
  const vec = typeof reps.tolist === 'function' ? reps.tolist()[0] : Array.from(reps[0]);
  if (!vec || vec.length !== EXPECTED_DIM) {
    throw new Error(`Vector dimension ${vec ? vec.length : 'null'} != ${EXPECTED_DIM}. Ensure MODEL_ID=${MODEL_ID} and same model used at ingestion.`);
  }
  const q_vec_text = toVectorText(vec);

  // filters
  const _city = args.city ?? null;
  const _ptype = args.ptype ?? null;
  const _budget_min = args.budget_min ? Number(args.budget_min) : null;
  const _budget_max = args.budget_max ? Number(args.budget_max) : null;
  const _bedrooms_min = args.bedrooms_min ? parseInt(args.bedrooms_min) : null;
  const _bathrooms_min = args.bathrooms_min ? parseInt(args.bathrooms_min) : null;
  const _verified_only = (String(args.verified_only ?? 'false').toLowerCase() === 'true');
  const _k = args.k ? parseInt(args.k) : 10;

  // call RPC (names must match SQL function arg names)
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
    console.error('RPC error:', JSON.stringify(error, null, 2));
    console.log('\nIf function not found, re-run SQL that creates match_candidates.');
    process.exit(1);
  }

  if (!data || data.length === 0) {
    console.log('No matches. Tips: loosen filters, increase --k, ensure properties.embedding is not null.');
    return;
  }

  console.log(`\nTop ${data.length} matches for: "${args.q}"\n`);
  for (const r of data) {
    const loc = [r.city, r.locality].filter(Boolean).join(', ');
    const price = r.price_inr != null ? `₹${r.price_inr}` : '₹N/A';
    const bb = [r.bedrooms && `${r.bedrooms} BR`, r.bathrooms && `${r.bathrooms} BA`].filter(Boolean).join(', ');
    const sim = (typeof r.sem_sim === 'number') ? r.sem_sim.toFixed(3) : 'N/A';
    console.log(`• ${r.title || 'Untitled'} — ${r.property_type || 'N/A'} — ${loc} — ${price} — ${bb} — sim=${sim}`);
  }
  console.log('');
}

main().catch((e) => {
  console.error('Search failed:', e);
  process.exit(1);
});
