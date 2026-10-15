/**
 * @module nutritionApi
 * Wrapper for the CalorieNinjas /v1/nutrition endpoint.
 * Results are cached in localStorage with a 24-hour TTL.
 *
 * Set your API key in .env:
 *   VITE_CALORIE_NINJAS_KEY=your_key_here
 *
 * Free key from https://calorieninjas.com/api
 */

const CACHE_PREFIX = 'ce-nut-';
const CACHE_TTL_MS = 24 * 60 * 60 * 1000; // 24 hours
const API_BASE     = 'https://api.calorieninjas.com/v1/nutrition';
// import.meta.env is injected by Vite, but may be absent when Pages serves
// source modules directly. The nutrition estimator works without a key.
const API_KEY      = import.meta.env?.VITE_CALORIE_NINJAS_KEY || '';

/* ── Cache helpers ───────────────────────────── */

function cacheKey(query) {
  // Keep the key short & stable
  return CACHE_PREFIX + btoa(unescape(encodeURIComponent(query))).slice(0, 40);
}

function readCache(query) {
  try {
    const raw = localStorage.getItem(cacheKey(query));
    if (!raw) return null;
    const { ts, data } = JSON.parse(raw);
    if (Date.now() - ts > CACHE_TTL_MS) {
      localStorage.removeItem(cacheKey(query));
      return null;
    }
    return data;
  } catch {
    return null;
  }
}

function writeCache(query, data) {
  try {
    localStorage.setItem(cacheKey(query), JSON.stringify({ ts: Date.now(), data }));
  } catch {
    // localStorage full — silently ignore
  }
}

/* ── Normalizer ──────────────────────────────── */

function normalize(rawItems) {
  const number = (value) => Number.isFinite(Number(value)) ? Number(value) : 0;
  const items = rawItems.map((item) => ({
    name:       item.name || 'Ingredient',
    calories:   Math.round(number(item.calories)),
    protein_g:  +number(item.protein_g).toFixed(1),
    carbs_g:    +number(item.carbohydrates_total_g).toFixed(1),
    fat_g:      +number(item.fat_total_g).toFixed(1),
    fiber_g:    +number(item.fiber_g).toFixed(1),
    sodium_mg:  +number(item.sodium_mg).toFixed(0),
  }));

  const totals = items.reduce(
    (acc, it) => ({
      calories:  acc.calories  + it.calories,
      protein_g: +(acc.protein_g + it.protein_g).toFixed(1),
      carbs_g:   +(acc.carbs_g   + it.carbs_g).toFixed(1),
      fat_g:     +(acc.fat_g     + it.fat_g).toFixed(1),
      fiber_g:   +(acc.fiber_g   + it.fiber_g).toFixed(1),
      sodium_mg: +(acc.sodium_mg + it.sodium_mg).toFixed(0),
    }),
    { calories: 0, protein_g: 0, carbs_g: 0, fat_g: 0, fiber_g: 0, sodium_mg: 0 },
  );

  return { items, totals };
}

const ESTIMATES = [
  { terms: ['chicken', 'turkey'], calories: 165, protein_g: 31, carbs_g: 0, fat_g: 3.6, fiber_g: 0, sodium_mg: 74 },
  { terms: ['beef', 'lamb', 'pork'], calories: 250, protein_g: 26, carbs_g: 0, fat_g: 17, fiber_g: 0, sodium_mg: 72 },
  { terms: ['fish', 'salmon', 'tuna', 'cod', 'shrimp', 'prawn'], calories: 170, protein_g: 25, carbs_g: 0, fat_g: 7, fiber_g: 0, sodium_mg: 70 },
  { terms: ['rice', 'pasta', 'noodle', 'flour', 'bread', 'oat'], calories: 350, protein_g: 10, carbs_g: 72, fat_g: 2, fiber_g: 4, sodium_mg: 10 },
  { terms: ['bean', 'lentil', 'chickpea', 'pea'], calories: 125, protein_g: 8, carbs_g: 22, fat_g: 1, fiber_g: 7, sodium_mg: 5 },
  { terms: ['oil', 'butter'], calories: 884, protein_g: 0, carbs_g: 0, fat_g: 100, fiber_g: 0, sodium_mg: 2 },
  { terms: ['cheese', 'cream', 'yogurt', 'milk'], calories: 120, protein_g: 6, carbs_g: 5, fat_g: 8, fiber_g: 0, sodium_mg: 90 },
  { terms: ['potato', 'carrot', 'onion', 'tomato', 'spinach', 'pepper', 'broccoli', 'garlic'], calories: 45, protein_g: 2, carbs_g: 9, fat_g: 0.3, fiber_g: 2.5, sodium_mg: 35 },
];

function estimateNutrition(query) {
  const items = query.split(',').map((part) => part.trim()).filter(Boolean).map((part) => {
    const name = part.replace(/^\s*[\d./]+\s*(?:g|kg|ml|l|oz|lb|lbs|cups?|tbsp|tsp|cloves?|pieces?)?\s*/i, '').trim() || part;
    const estimate = ESTIMATES.find(({ terms }) => terms.some((term) => name.toLowerCase().includes(term)))
      || { calories: 110, protein_g: 4, carbs_g: 12, fat_g: 4, fiber_g: 2, sodium_mg: 45 };
    const amount = Number(part.match(/^\s*(\d+(?:\.\d+)?)/)?.[1]) || 1;
    const multiplier = /(?:kg|l)\b/i.test(part) ? amount * 10 : /(?:g|ml)\b/i.test(part) ? Math.max(amount / 100, 0.25) : Math.max(amount, 1);
    return {
      name,
      calories: Math.round(estimate.calories * multiplier),
      protein_g: +(estimate.protein_g * multiplier).toFixed(1),
      carbs_g: +(estimate.carbs_g * multiplier).toFixed(1),
      fat_g: +(estimate.fat_g * multiplier).toFixed(1),
      fiber_g: +(estimate.fiber_g * multiplier).toFixed(1),
      sodium_mg: Math.round(estimate.sodium_mg * multiplier),
    };
  });
  return { ...normalize(items), source: 'estimate' };
}

/* ── Public API ──────────────────────────────── */

/**
 * Fetch nutrition data for a formatted ingredient query string.
 *
 * @param {string} query  e.g. "200g chicken breast, 1 tbsp olive oil"
 * @returns {Promise<{ items: Array, totals: Object }>}
 * @throws {Error} with .code: 'NO_KEY' | 'RATE_LIMIT' | 'NETWORK' | 'NO_DATA'
 */
export async function fetchNutrition(query) {
  if (!query || !query.trim()) {
    throw Object.assign(new Error('Empty query'), { code: 'NO_DATA' });
  }

  // 1. Cache hit
  const cached = readCache(query);
  if (cached) return cached;

  // GitHub Pages cannot proxy a secret. Keep the app useful without one.
  if (!API_KEY) {
    const result = estimateNutrition(query);
    writeCache(query, result);
    return result;
  }

  // 3. Fetch
  let response;
  try {
    response = await fetch(`${API_BASE}?query=${encodeURIComponent(query)}`, {
      headers: { 'X-Api-Key': API_KEY },
    });
  } catch {
    const result = estimateNutrition(query);
    writeCache(query, result);
    return result;
  }

  // 4. Rate limit
  if (response.status === 429) {
    const result = estimateNutrition(query);
    writeCache(query, result);
    return result;
  }

  if (!response.ok) {
    const result = estimateNutrition(query);
    writeCache(query, result);
    return result;
  }

  let json;
  try {
    json = await response.json();
  } catch {
    const result = estimateNutrition(query);
    writeCache(query, result);
    return result;
  }
  if (!json.items || json.items.length === 0) {
    const result = estimateNutrition(query);
    writeCache(query, result);
    return result;
  }

  const result = normalize(json.items);
  writeCache(query, result);
  return result;
}
