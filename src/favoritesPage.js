/**
 * @module favoritesPage
 * Renders all saved favourites as recipe cards with remove buttons.
 */

import { getFavorites, removeFavorite, getFavoriteCount } from './favorites.js';
import { updateNavBadge, showToast } from './ui.js';

const APP_BASE = import.meta.env?.BASE_URL || './';

const grid = document.getElementById('favs-grid');
const sub  = document.getElementById('favs-sub');

updateNavBadge();
render();

function render() {
  const favs = getFavorites();

  if (!favs.length) {
    sub.textContent = '';
    grid.innerHTML  = `
      <div class="fav-empty">
        <div class="empty-icon">🍽️</div>
        <h2>No favourites yet — start exploring!</h2>
        <p>Search for recipes and tap the heart icon to save them here.</p>
        <a href="./index.html" class="btn-primary">🔍 Discover Recipes</a>
      </div>`;
    return;
  }

  sub.textContent = `${favs.length} saved recipe${favs.length === 1 ? '' : 's'}`;
  grid.innerHTML  = `<div class="favs-grid">${favs.map(cardHTML).join('')}</div>`;

  // Wire remove buttons
  grid.querySelectorAll('.fav-card-remove').forEach((btn) => {
    btn.addEventListener('click', () => {
      const id   = btn.dataset.id;
      const name = btn.dataset.name;
      removeFavorite(id);
      updateNavBadge();
      showToast(`💔 Removed "${name}"`);
      render();
    });
  });
}

function cardHTML(fav) {
  const savedDate = new Date(fav.savedAt).toLocaleDateString(undefined, {
    year: 'numeric', month: 'short', day: 'numeric',
  });

  return `
    <article class="recipe-card" data-id="${esc(fav.idMeal)}">
      <div class="card-thumb-wrap">
        ${fav.strMealThumb
          ? `<img class="card-thumb" src="${fav.strMealThumb}/preview" alt="${esc(fav.strMeal)}" loading="lazy" />`
          : `<div class="card-thumb-placeholder">🍽️</div>`}
        <div class="card-badges">
          ${fav.strCategory ? `<span class="badge badge-category">${esc(fav.strCategory)}</span>` : ''}
          ${fav.strArea     ? `<span class="badge badge-area">${esc(fav.strArea)}</span>` : ''}
        </div>
      </div>
      <div class="card-body">
        <h2 class="card-title">${esc(fav.strMeal)}</h2>
        <div class="card-meta">
          ${fav.strCategory ? `<span class="card-meta-tag">🏷 ${esc(fav.strCategory)}</span>` : ''}
          ${fav.strArea     ? `<span class="card-meta-tag">🌍 ${esc(fav.strArea)}</span>` : ''}
        </div>
        <p class="saved-at">Saved ${savedDate}</p>
      </div>
      <div class="card-actions" style="gap:.5rem;flex-wrap:wrap">
        <a href="${APP_BASE}recipe.html?id=${encodeURIComponent(fav.idMeal)}" class="btn-view" style="flex:1">
          View Recipe →
        </a>
        <button
          class="fav-card-remove"
          data-id="${esc(fav.idMeal)}"
          data-name="${esc(fav.strMeal)}"
          aria-label="Remove ${esc(fav.strMeal)} from favourites"
        >
          🗑 Remove
        </button>
      </div>
    </article>`;
}

function esc(str) {
  return String(str || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}
