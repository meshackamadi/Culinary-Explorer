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
const API_KEY      = import.meta.env.VITE_CALORIE_NINJAS_KEY || '';

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
  const items = rawItems.map((item) => ({
    name:       item.name,
    calories:   Math.round(item.calories),
    protein_g:  +item.protein_g.toFixed(1),
    carbs_g:    +item.carbohydrates_total_g.toFixed(1),
    fat_g:      +item.fat_total_g.toFixed(1),
    fiber_g:    +item.fiber_g.toFixed(1),
    sodium_mg:  +item.sodium_mg.toFixed(0),
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

  // 2. Missing key — surface helpful error
  if (!API_KEY) {
    throw Object.assign(
      new Error(
        'CalorieNinjas API key is missing. Add VITE_CALORIE_NINJAS_KEY to your .env file.',
      ),
      { code: 'NO_KEY' },
    );
  }

  // 3. Fetch
  let response;
  try {
    response = await fetch(`${API_BASE}?query=${encodeURIComponent(query)}`, {
      headers: { 'X-Api-Key': API_KEY },
    });
  } catch (e) {
    throw Object.assign(new Error('Network error — please check your connection.'), {
      code: 'NETWORK',
    });
  }

  // 4. Rate limit
  if (response.status === 429) {
    throw Object.assign(
      new Error('Too many requests — please wait a moment and try again.'),
      { code: 'RATE_LIMIT' },
    );
  }

  if (!response.ok) {
    throw Object.assign(
      new Error(`Nutrition API error (${response.status})`),
      { code: 'API_ERROR' },
    );
  }

  const json = await response.json();
  if (!json.items || json.items.length === 0) {
    throw Object.assign(
      new Error('No nutrition data returned for these ingredients.'),
      { code: 'NO_DATA' },
    );
  }

  const result = normalize(json.items);
  writeCache(query, result);
  return result;
}
