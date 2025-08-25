// functions/search/index.ts
import { createClient } from '@supabase/supabase-js';
import { pipeline } from '@xenova/transformers';

const MODEL_ID = 'Xenova/e5-small-v2'; // 384-dim, tiny, fast
const EXPECTED_DIM = 384;

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE || process.env.SUPABASE_ANON_KEY!
);

let extractorPromise: Promise<any> | null = null;
function getExtractor(){
  if (!extractorPromise) {
    extractorPromise = pipeline('feature-extraction', MODEL_ID, { quantized: true });
  }
  return extractorPromise;
}
const toVecText = (arr: number[]) => `[${arr.map(x => Number(x).toFixed(6)).join(',')}]`;

export const handler = async (event) => {
  try {
    const body = JSON.parse(event.body || '{}');
    const q: string = body.query || '';
    if (!q) return { statusCode: 400, body: JSON.stringify({ error: 'query required' }) };

    const extractor = await getExtractor();
    const reps = await extractor([`query: ${q}`], { pooling: 'mean', normalize: true });
    const vec: number[] = typeof reps.tolist === 'function' ? reps.tolist()[0] : Array.from(reps[0]);
    if (!vec || vec.length !== EXPECTED_DIM) throw new Error(`bad dim ${vec?.length}`);

    const q_vec_text = toVecText(vec);

    const { data, error } = await supabase.rpc('match_candidates_hybrid_text_explicit', {
      q_vec_text,
      _city: body.city ?? null,
      _ptype: body.ptype ?? null,
      _budget_min: body.budgetMin ?? null,
      _budget_max: body.budgetMax ?? null,
      _bedrooms_min: body.bedroomsMin ?? null,
      _bathrooms_min: body.bathroomsMin ?? null,
      _verified_only: !!body.verifiedOnly,
      _want_metro: !!body.wantMetro,
      _k: body.k ?? 50,
    });

    if (error) return { statusCode: 500, body: JSON.stringify({ error: error.message }) };
    return { statusCode: 200, body: JSON.stringify({ results: data }) };
  } catch (e: any) {
    return { statusCode: 500, body: JSON.stringify({ error: e.message || 'search failed' }) };
  }
};
