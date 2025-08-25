// scripts/lib/score.js
export function normalizeScore(x, min=0, max=1) {
  const v = Number.isFinite(x) ? x : 0;
  return Math.max(min, Math.min(max, v));
}

// price score: full points if <= budget, decays linearly after
export function priceScore(price, budgetMax) {
  if (!Number.isFinite(price) || !Number.isFinite(budgetMax) || budgetMax <= 0) return 1; // no constraint
  if (price <= budgetMax) return 1;
  const over = (price - budgetMax) / budgetMax; // 0.1 means 10% over
  return Math.max(0, 1 - over); // linear decay
}

// metro distance score: 1 at 0 km, 0 at >= 2 km
export function metroScore(km) {
  if (!Number.isFinite(km)) return 0;
  const s = 1 - (km / 2);
  return Math.max(0, Math.min(1, s));
}

export function combinedScore({ sem_sim, price_inr, budget_max, km_to_metro, weights }) {
  const sim = normalizeScore(sem_sim, 0, 1);
  const p = priceScore(price_inr, budget_max);
  const m = metroScore(km_to_metro);

  const w = Object.assign({ semantic: 0.6, price: 0.25, metro: 0.15 }, weights || {});
  const score = (w.semantic * sim) + (w.price * p) + (w.metro * m);
  return Number.isFinite(score) ? score : 0;
}

export function dedupe(rows) {
  const seen = new Set();
  const out = [];
  for (const r of rows) {
    const key = [
      (r.title || '').trim().toLowerCase().replace(/\s+/g,' '),
      r.city || '',
      r.locality || '',
      r.price_inr || 0
    ].join('|');
    if (seen.has(key)) continue;
    seen.add(key);
    out.push(r);
  }
  return out;
}
