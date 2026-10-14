/**
 * @module recipeDetail
 * Recipe detail page — fetches from TheMealDB /lookup.php?i={id},
 * renders hero, ingredients, instructions, nutrition panel and favorites toggle.
 */

import { parseIngredients, ingredientThumbUrl } from './ingredientParser.js';
import { renderNutritionPanel }                  from './nutrition.js';
import { isFavorite, toggleFavorite }            from './favorites.js';
import { updateNavBadge, showToast }             from './ui.js';

const MEALDB  = 'https://www.themealdb.com/api/json/v1/1';
const root    = document.getElementById('detail-content');

/* ── Read ?id= from URL ───────────────────────── */
const mealId = new URLSearchParams(window.location.search).get('id');

/* ── Init ─────────────────────────────────────── */
updateNavBadge();
if (!mealId) {
  renderError('No recipe ID specified.', false);
} else {
  loadRecipe(mealId);
}

/* ── Fetch & render ───────────────────────────── */
async function loadRecipe(id) {
  renderSkeleton();

  let meal;
  try {
    const res  = await fetch(`${MEALDB}/lookup.php?i=${id}`);
    const json = await res.json();
    meal = json.meals?.[0];
    if (!meal) throw new Error('Not found');
  } catch {
    renderError('Could not load this recipe. It may not exist or you may be offline.', true, id);
    return;
  }

  // Update page <title>
  document.title = `${meal.strMeal} — Culinary Explorer`;

  const ingredients = parseIngredients(meal);
  renderDetail(meal, ingredients);

  // Nutrition panel — lazy load after layout
  const nutPanel = document.getElementById('nutrition-panel');
  renderNutritionPanel(nutPanel, ingredients);
}

/* ── Detail renderer ──────────────────────────── */
function renderDetail(meal, ingredients) {
  const fav = isFavorite(meal.idMeal);

  root.innerHTML = `
    <a href="./index.html" class="detail-back">← Back to search</a>

    <!-- ── Hero ── -->
    <section class="detail-hero" aria-label="Recipe overview">
      <div class="detail-hero-img-wrap">
        <img
          class="detail-hero-img"
          src="${meal.strMealThumb}"
          alt="${esc(meal.strMeal)}"
          loading="eager"
        />
        <button
          id="hero-fav-btn"
          class="detail-hero-fav ${fav ? 'is-fav' : ''}"
          aria-label="${fav ? 'Remove from favourites' : 'Add to favourites'}"
          aria-pressed="${fav}"
        >${fav ? '♥' : '♡'}</button>
      </div>

      <div class="detail-info">
        <div class="detail-eyebrow">
          ${meal.strCategory ? `<span class="badge badge-category">${esc(meal.strCategory)}</span>` : ''}
          ${meal.strArea     ? `<span class="badge badge-area">${esc(meal.strArea)}</span>` : ''}
        </div>

        <h1 class="detail-title">${esc(meal.strMeal)}</h1>

        <div class="detail-links">
          ${meal.strYoutube ? `
            <a href="${esc(meal.strYoutube)}" target="_blank" rel="noopener" class="detail-link-btn youtube">
              ▶ Watch on YouTube
            </a>` : ''}
          ${meal.strSource ? `
            <a href="${esc(meal.strSource)}" target="_blank" rel="noopener" class="detail-link-btn">
              📖 Original Source
            </a>` : ''}
        </div>
      </div>
    </section>

    <!-- ── Body: sidebar + instructions ── -->
    <div class="detail-body">

      <!-- Sidebar -->
      <aside class="detail-sidebar" aria-label="Ingredients and nutrition">

        <!-- Ingredients panel -->
        <div class="panel">
          <div class="panel-header">
            <span class="panel-title">🧂 Ingredients</span>
            <span style="font-size:.8rem;color:var(--text-3)">${ingredients.length} items</span>
          </div>
          <div class="panel-body">
            <ul class="ingredient-list" aria-label="Ingredient list">
              ${ingredients.map(({ ingredient, measure }) => `
                <li class="ingredient-item">
                  <img
                    class="ingredient-img"
                    src="${ingredientThumbUrl(ingredient)}"
                    alt="${esc(ingredient)}"
                    loading="lazy"
                    onerror="this.style.display='none'"
                  />
                  <span class="ingredient-name">${esc(ingredient)}</span>
                  <span class="ingredient-measure">${esc(measure)}</span>
                </li>`).join('')}
            </ul>
          </div>
        </div>

        <!-- Nutrition panel (populated async) -->
        <div class="panel" id="nutrition-panel" aria-label="Nutritional analysis" aria-live="polite">
          <!-- Filled by renderNutritionPanel() -->
        </div>

      </aside>

      <!-- Instructions -->
      <article class="instructions-section">
        <h2 class="instructions-title">📋 Instructions</h2>
        <div class="instructions-body">
          ${formatInstructions(meal.strInstructions)}
        </div>
      </article>

    </div>`;

  // Favourites toggle
  const favBtn = document.getElementById('hero-fav-btn');
  favBtn?.addEventListener('click', () => {
    const nowFav = toggleFavorite(meal);
    favBtn.classList.toggle('is-fav', nowFav);
    favBtn.textContent = nowFav ? '♥' : '♡';
    favBtn.setAttribute('aria-pressed', String(nowFav));
    favBtn.setAttribute('aria-label', nowFav ? 'Remove from favourites' : 'Add to favourites');
    favBtn.classList.add('pop');
    favBtn.addEventListener('animationend', () => favBtn.classList.remove('pop'), { once: true });
    showToast(nowFav ? `❤️ Saved "${meal.strMeal}"` : `💔 Removed "${meal.strMeal}"`);
    updateNavBadge();
  });
}

/* ── Skeleton ─────────────────────────────────── */
function renderSkeleton() {
  root.innerHTML = `
    <div class="skeleton skeleton-line short" style="height:1rem;width:120px;margin-bottom:2rem"></div>
    <div class="skeleton-detail-hero">
      <div class="skeleton skeleton-detail-img"></div>
      <div class="skeleton-detail-info">
        <div class="skeleton skeleton-line xshort" style="height:.8rem;width:80px"></div>
        <div class="skeleton skeleton-line" style="height:2.4rem;margin:.5rem 0"></div>
        <div class="skeleton skeleton-line short" style="height:2.4rem"></div>
        <div class="skeleton skeleton-line xshort" style="height:1rem;margin-top:1rem;width:60%"></div>
      </div>
    </div>
    <div class="skeleton-detail-body">
      <div style="display:flex;flex-direction:column;gap:1rem">
        <div class="skeleton skeleton-card" style="height:320px"></div>
        <div class="skeleton skeleton-card" style="height:200px"></div>
      </div>
      <div style="display:flex;flex-direction:column;gap:.75rem">
        ${Array.from({length:8},()=>`<div class="skeleton skeleton-line"></div>`).join('')}
      </div>
    </div>`;
}

/* ── Error ────────────────────────────────────── */
function renderError(message, canRetry, id) {
  root.innerHTML = `
    <a href="./index.html" class="detail-back">← Back to search</a>
    <div class="error-page">
      <div class="error-code">😕</div>
      <h1 style="font-size:1.5rem">Oops!</h1>
      <p class="error-msg">${esc(message)}</p>
      ${canRetry ? `<button class="btn-retry" id="retry-btn" style="margin-top:1rem">↺ Try Again</button>` : ''}
      <a href="./index.html" class="btn-primary" style="margin-top:1rem">← Back to Search</a>
    </div>`;
  if (canRetry) {
    document.getElementById('retry-btn')?.addEventListener('click', () => loadRecipe(id));
  }
}

/* ── Helpers ──────────────────────────────────── */
function formatInstructions(raw) {
  if (!raw) return '<p>No instructions available.</p>';
  // Split on double newlines or numbered steps
  const paragraphs = raw
    .split(/\r?\n\r?\n|\r\n/)
    .map((p) => p.replace(/\r?\n/g, ' ').trim())
    .filter(Boolean);
  return paragraphs.map((p) => `<p>${esc(p)}</p>`).join('');
}

function esc(str) {
  return String(str || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}
