/**
 * @module nutrition
 * Renders the nutrition analysis panel on the recipe detail page.
 * Handles loading skeleton, per-ingredient breakdown, macros bar, and error state.
 */

import { fetchNutrition } from './nutritionApi.js';
import { formatIngredientsForApi } from './ingredientParser.js';

/**
 * Render the nutrition panel into a given container element.
 * @param {HTMLElement} container
 * @param {Array<{ingredient:string, measure:string}>} ingredients
 */
export async function renderNutritionPanel(container, ingredients) {
  if (!container) return;

  // Show skeleton
  container.innerHTML = skeletonHTML();

  if (!ingredients || ingredients.length === 0) {
    container.innerHTML = errorHTML('No ingredients to analyse.', false);
    return;
  }

  const query = formatIngredientsForApi(ingredients);

  const doFetch = async () => {
    container.innerHTML = skeletonHTML();
    try {
      const data = await fetchNutrition(query);
      container.innerHTML = panelHTML(data);
      attachBreakdownToggle(container);
    } catch (err) {
      container.innerHTML = errorHTML(friendlyMessage(err), err.code !== 'NO_KEY');

      // Wire retry button
      container.querySelector('#nut-retry-btn')?.addEventListener('click', doFetch);
    }
  };

  await doFetch();
}

/* ── HTML builders ───────────────────────────── */

function skeletonHTML() {
  return `
    <div class="panel-header">
      <span class="panel-title">🔬 Nutrition Analysis</span>
    </div>
    <div class="panel-body">
      <div class="macros-bar" style="margin-bottom:1.25rem">
        <div class="skeleton macro-seg" style="width:100%;height:8px;border-radius:99px"></div>
      </div>
      <div class="nutrition-totals">
        ${['Calories','Protein','Carbs','Fat','Fiber','Sodium'].map(() => `
          <div class="nut-total-item">
            <div class="skeleton skeleton-line" style="height:1.3rem;margin-bottom:.35rem"></div>
            <div class="skeleton skeleton-line xshort" style="height:.6rem"></div>
          </div>`).join('')}
      </div>
      <div class="nut-disclaimer skeleton skeleton-line short" style="height:.7rem;margin-top:.75rem"></div>
    </div>`;
}

function panelHTML({ items, totals }) {
  const total = totals.protein_g + totals.carbs_g + totals.fat_g || 1;
  const pPct  = ((totals.protein_g / total) * 100).toFixed(1);
  const cPct  = ((totals.carbs_g   / total) * 100).toFixed(1);
  const fPct  = ((totals.fat_g     / total) * 100).toFixed(1);

  return `
    <div class="panel-header">
      <span class="panel-title">🔬 Nutrition Analysis</span>
    </div>
    <div class="panel-body nutrition-panel">
      <div class="macros-bar" title="Protein / Carbs / Fat">
        <div class="macro-seg macro-protein" style="width:${pPct}%"></div>
        <div class="macro-seg macro-carbs"   style="width:${cPct}%"></div>
        <div class="macro-seg macro-fat"     style="width:${fPct}%"></div>
      </div>
      <div class="nutrition-totals" style="grid-template-columns:repeat(3,1fr)">
        <div class="nut-total-item nut-cal">
          <div class="nut-total-value">${totals.calories}</div>
          <div class="nut-total-label">Calories</div>
        </div>
        <div class="nut-total-item nut-pro">
          <div class="nut-total-value">${totals.protein_g}g</div>
          <div class="nut-total-label">Protein</div>
        </div>
        <div class="nut-total-item nut-carb">
          <div class="nut-total-value">${totals.carbs_g}g</div>
          <div class="nut-total-label">Carbs</div>
        </div>
        <div class="nut-total-item nut-fat">
          <div class="nut-total-value">${totals.fat_g}g</div>
          <div class="nut-total-label">Fat</div>
        </div>
        <div class="nut-total-item nut-fiber">
          <div class="nut-total-value">${totals.fiber_g}g</div>
          <div class="nut-total-label">Fiber</div>
        </div>
        <div class="nut-total-item nut-sodium">
          <div class="nut-total-value">${totals.sodium_mg}mg</div>
          <div class="nut-total-label">Sodium</div>
        </div>
      </div>

      ${items.length > 0 ? `
      <button class="nut-breakdown-toggle" aria-expanded="false" aria-controls="nut-breakdown">
        <span>Per-ingredient breakdown (${items.length} items)</span>
        <span class="chevron">▾</span>
      </button>
      <div class="nut-breakdown" id="nut-breakdown" role="region">
        ${items.map((it) => `
          <div class="nut-breakdown-item">
            <span class="ing-name" title="${esc(it.name)}">${esc(it.name)}</span>
            <span class="ing-cal">${it.calories} kcal</span>
          </div>`).join('')}
      </div>` : ''}

      <p class="nut-disclaimer">ℹ️ Nutrition estimates are approximate and based on ingredient quantities.</p>
    </div>`;
}

function errorHTML(message, showRetry = true) {
  return `
    <div class="panel-header">
      <span class="panel-title">🔬 Nutrition Analysis</span>
    </div>
    <div class="panel-body">
      <div class="nut-error">
        <div class="nut-error-icon">⚠️</div>
        <p>${esc(message)}</p>
        ${showRetry ? `<button class="btn-retry" id="nut-retry-btn">↺ Retry</button>` : ''}
      </div>
    </div>`;
}

function friendlyMessage(err) {
  switch (err.code) {
    case 'NO_KEY':       return 'Nutrition API key not configured. Add VITE_CALORIE_NINJAS_KEY to your .env file.';
    case 'RATE_LIMIT':   return 'Too many requests — please wait a moment and try again.';
    case 'NETWORK':      return 'Could not reach the nutrition service. Check your connection.';
    case 'NO_DATA':      return 'No nutrition data found for these ingredients.';
    default:             return err.message || 'Failed to load nutrition data.';
  }
}

function attachBreakdownToggle(container) {
  const btn      = container.querySelector('.nut-breakdown-toggle');
  const breakdown= container.querySelector('.nut-breakdown');
  if (!btn || !breakdown) return;
  btn.addEventListener('click', () => {
    const isOpen = breakdown.classList.toggle('open');
    btn.setAttribute('aria-expanded', String(isOpen));
  });
}

function esc(str) {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}
