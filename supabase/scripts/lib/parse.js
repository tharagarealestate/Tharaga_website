// scripts/lib/parse.js
export function parseQuery(q) {
  const text = (q || '').toLowerCase();

  // type synonyms
  const typeMap = {
    flat: 'Apartment',
    apartment: 'Apartment',
    villa: 'Villa',
    plot: 'Plot',
    commercial: 'Commercial'
  };

  const cityRegex = /\b(chennai|coimbatore|madurai|trichy|trivandrum|bangalore|bengaluru|hyderabad|mumbai|pune|delhi|kolkata)\b/;
  const bhkRegex = /(\d+)\s*bhk/;
  const underRegex = /\b(under|below|<=)\s*([\d.,]+)\s*(crore|cr|lakh|lac|lakhs|k)?/;
  const betweenRegex = /\bbetween\s*([\d.,]+)\s*(cr|crore|lakh|lac|lakhs|k)?\s*and\s*([\d.,]+)\s*(cr|crore|lakh|lac|lakhs|k)?/;
  const wantsMetro = /\bmetro|near metro|walk\s*to\s*metro|station\b/.test(text);

  const cityMatch = text.match(cityRegex);
  const bhkMatch = text.match(bhkRegex);

  const _city = cityMatch ? capitalize(cityMatch[0]) : null;

  // property type
  let _ptype = null;
  for (const [k, v] of Object.entries(typeMap)) {
    if (text.includes(k)) { _ptype = v; break; }
  }

  // budget
  let _budget_min = null, _budget_max = null;

  const toINR = (numStr, unit) => {
    const n = parseFloat(numStr.replace(/,/g, ''));
    if (!isFinite(n)) return null;
    const u = (unit || '').toLowerCase();
    if (u.startsWith('cr')) return Math.round(n * 1e7);        // 1 cr = 10,000,000
    if (u.startsWith('crore')) return Math.round(n * 1e7);
    if (u.startsWith('lakh') || u.startsWith('lac')) return Math.round(n * 1e5); // 1 lakh = 100,000
    if (u === 'k') return Math.round(n * 1e3);
    return Math.round(n); // plain number treated as INR
  };

  const mBetween = text.match(betweenRegex);
  if (mBetween) {
    _budget_min = toINR(mBetween[1], mBetween[2]);
    _budget_max = toINR(mBetween[3], mBetween[4]);
  } else {
    const mUnder = text.match(underRegex);
    if (mUnder) {
      _budget_max = toINR(mUnder[2], mUnder[3]);
    }
  }

  const _bedrooms_min = bhkMatch ? parseInt(bhkMatch[1], 10) : null;

  return {
    _city,
    _ptype,
    _budget_min,
    _budget_max,
    _bedrooms_min,
    _bathrooms_min: null,
    _verified_only: false,
    _wants_metro: wantsMetro
  };
}

function capitalize(s){ return s ? s[0].toUpperCase() + s.slice(1) : s; }
