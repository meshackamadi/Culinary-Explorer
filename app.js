/**
 * app.js — Main search page logic
 * Uses TheMealDB /search.php and /filter.php
 * Handles: search, category/area filters, sorting, favorites, URL state
 */

import { isFavorite, toggleFavorite, getFavoriteCount } from './src/favorites.js';
import { updateNavBadge, showToast, renderSkeletonCards } from './src/ui.js';

const APP_BASE = import.meta.env?.BASE_URL || './';

/* ── Element refs ─────────────────────────────── */
const form          = document.getElementById('search-form');
const input         = document.getElementById('ingredient-input');
const grid          = document.getElementById('results-grid');
const emptyState    = document.getElementById('empty-state');
const emptyTitle    = document.getElementById('empty-title');
const emptyMsg      = document.getElementById('empty-msg');
const resultsMeta   = document.getElementById('results-meta');
const resultsCount  = document.getElementById('results-count');
const filtersSection= document.getElementById('filters-section');
const filterCat     = document.getElementById('filter-category');
const filterArea    = document.getElementById('filter-area');
const sortSelect    = document.getElementById('sort-select');
const clearBtn      = document.getElementById('clear-filters-btn');
const filterToggle  = document.getElementById('filter-toggle-btn');
const filterBody    = document.getElementById('filters-bar-body');

/* ── State ────────────────────────────────────── */
let allResults  = [];   // raw results from API
let searchTerm  = '';

/* ── TheMealDB helpers ────────────────────────── */
const MEALDB = 'https://www.themealdb.com/api/json/v1/1';

async function searchByIngredient(ingredient) {
  const res  = await fetch(`${MEALDB}/filter.php?i=${encodeURIComponent(ingredient)}`);
  const json = await res.json();
  return json.meals || [];
}

async function searchByName(name) {
  const res  = await fetch(`${MEALDB}/search.php?s=${encodeURIComponent(name)}`);
  const json = await res.json();
  return json.meals || [];
}

/* ── Filters ──────────────────────────────────── */

async function loadFilterOptions() {
  try {
    const [catRes, areaRes] = await Promise.all([
      fetch(`${MEALDB}/list.php?c=list`),
      fetch(`${MEALDB}/list.php?a=list`),
    ]);
    const catJson  = await catRes.json();
    const areaJson = await areaRes.json();

    (catJson.meals || []).forEach(({ strCategory }) => {
      filterCat.insertAdjacentHTML('beforeend', `<option value="${esc(strCategory)}">${esc(strCategory)}</option>`);
    });
    (areaJson.meals || []).forEach(({ strArea }) => {
      filterArea.insertAdjacentHTML('beforeend', `<option value="${esc(strArea)}">${esc(strArea)}</option>`);
    });
  } catch {
    // silently — filters still work with empty options
  }
}

function getFilteredSorted() {
  const cat  = filterCat.value;
  const area = filterArea.value;
  const sort = sortSelect.value;

  let out = allResults.slice();

  if (cat)  out = out.filter((m) => m.strCategory === cat);
  if (area) out = out.filter((m) => m.strArea === area);

  if (sort === 'az') out.sort((a, b) => a.strMeal.localeCompare(b.strMeal));
  if (sort === 'za') out.sort((a, b) => b.strMeal.localeCompare(a.strMeal));

  return out;
}

function hasActiveFilters() {
  return filterCat.value || filterArea.value || sortSelect.value;
}

function syncUrlParams() {
  const params = new URLSearchParams();
  if (searchTerm)        params.set('q',        searchTerm);
  if (filterCat.value)   params.set('category', filterCat.value);
  if (filterArea.value)  params.set('area',     filterArea.value);
  if (sortSelect.value)  params.set('sort',     sortSelect.value);
  const newUrl = `${window.location.pathname}?${params}`;
  history.replaceState({}, '', params.size ? newUrl : window.location.pathname);
}

function restoreFromUrl() {
  const params = new URLSearchParams(window.location.search);
  if (params.get('q'))        input.value        = params.get('q');
  if (params.get('category')) filterCat.value    = params.get('category');
  if (params.get('area'))     filterArea.value   = params.get('area');
  if (params.get('sort'))     sortSelect.value   = params.get('sort');
  return params.get('q') || '';
}

/* ── Render ───────────────────────────────────── */

function renderResults(meals) {
  grid.innerHTML = '';
  clearBtn.classList.toggle('visible', !!hasActiveFilters());

  if (!meals.length) {
    emptyState.hidden = false;
    resultsMeta.hidden = true;
    if (hasActiveFilters()) {
      emptyTitle.textContent = 'No matches for these filters';
      emptyMsg.textContent   = 'Try adjusting or clearing your filters.';
    } else {
      emptyTitle.textContent = `No recipes found for "${searchTerm}"`;
      emptyMsg.textContent   = 'Try a different ingredient or check the spelling.';
    }
    return;
  }

  emptyState.hidden  = false;
  emptyState.hidden  = true;
  resultsMeta.hidden = false;
  resultsCount.innerHTML = `Showing <strong>${meals.length}</strong> recipe${meals.length === 1 ? '' : 's'}${searchTerm ? ` for "<strong>${esc(searchTerm)}</strong>"` : ''}`;

  meals.forEach((meal) => {
    const fav  = isFavorite(meal.idMeal);
    const card = document.createElement('article');
    card.className = 'recipe-card';
    card.dataset.id = meal.idMeal;

    card.innerHTML = `
      <div class="card-thumb-wrap">
        ${meal.strMealThumb
          ? `<img class="card-thumb" src="${meal.strMealThumb}/preview" alt="${esc(meal.strMeal)}" loading="lazy" />`
          : `<div class="card-thumb-placeholder">🍽️</div>`}
        <div class="card-badges">
          ${meal.strCategory ? `<span class="badge badge-category">${esc(meal.strCategory)}</span>` : ''}
          ${meal.strArea     ? `<span class="badge badge-area">${esc(meal.strArea)}</span>` : ''}
        </div>
        <button
          class="card-fav-btn ${fav ? 'is-fav' : ''}"
          data-id="${meal.idMeal}"
          aria-label="${fav ? 'Remove from favourites' : 'Add to favourites'}"
          aria-pressed="${fav}"
        >${fav ? '♥' : '♡'}</button>
      </div>
      <div class="card-body">
        <h2 class="card-title">${esc(meal.strMeal)}</h2>
        <div class="card-meta">
          ${meal.strCategory ? `<span class="card-meta-tag">🏷 ${esc(meal.strCategory)}</span>` : ''}
          ${meal.strArea     ? `<span class="card-meta-tag">🌍 ${esc(meal.strArea)}</span>` : ''}
        </div>
      </div>
      <div class="card-actions">
        <a href="${APP_BASE}recipe.html?id=${encodeURIComponent(meal.idMeal)}" class="btn-view" aria-label="View ${esc(meal.strMeal)} recipe">
          View Recipe →
        </a>
      </div>`;

    grid.appendChild(card);
  });

  // Favourite button handlers
  grid.querySelectorAll('.card-fav-btn').forEach((btn) => {
    btn.addEventListener('click', (e) => {
      e.preventDefault();
      const id   = btn.dataset.id;
      const meal = allResults.find((m) => m.idMeal === id);
      if (!meal) return;

      const nowFav = toggleFavorite(meal);
      btn.classList.toggle('is-fav', nowFav);
      btn.textContent = nowFav ? '♥' : '♡';
      btn.setAttribute('aria-pressed', String(nowFav));
      btn.setAttribute('aria-label', nowFav ? 'Remove from favourites' : 'Add to favourites');
      btn.classList.add('pop');
      btn.addEventListener('animationend', () => btn.classList.remove('pop'), { once: true });
      showToast(nowFav ? `❤️ Saved "${meal.strMeal}"` : `💔 Removed "${meal.strMeal}"`);
      updateNavBadge();
    });
  });
}

/* ── Search flow ──────────────────────────────── */

async function doSearch(term) {
  searchTerm = term.trim();
  if (!searchTerm) {
    grid.innerHTML = '';
    emptyState.hidden    = true;
    resultsMeta.hidden   = true;
    filtersSection.hidden= true;
    return;
  }

  filtersSection.hidden = false;
  renderSkeletonCards(grid, 6);
  resultsMeta.hidden    = true;
  emptyState.hidden     = true;

  try {
    // Search by ingredient first; fall back to name search for broader results
    let meals = await searchByIngredient(searchTerm);
    if (!meals.length) meals = await searchByName(searchTerm);

    // For ingredient search, results lack category/area — enrich top 20 lazily
    if (meals.length && !meals[0].strCategory) {
      meals = await enrichMeals(meals.slice(0, 20));
    }

    allResults = meals;
    syncUrlParams();
    renderResults(getFilteredSorted());
  } catch (err) {
    grid.innerHTML = '';
    emptyState.hidden  = false;
    resultsMeta.hidden = true;
    emptyTitle.textContent = 'Something went wrong';
    emptyMsg.textContent   = 'Could not reach TheMealDB. Check your connection and try again.';
  }
}

/** Enrich up to N meals with category/area by fetching full lookup */
async function enrichMeals(meals) {
  const enriched = await Promise.allSettled(
    meals.map((m) =>
      fetch(`${MEALDB}/lookup.php?i=${m.idMeal}`)
        .then((r) => r.json())
        .then((j) => j.meals?.[0] || m),
    ),
  );
  return enriched.map((r, i) => (r.status === 'fulfilled' ? r.value : meals[i]));
}

/* ── Filter/sort event listeners ─────────────── */

[filterCat, filterArea, sortSelect].forEach((el) =>
  el.addEventListener('change', () => {
    syncUrlParams();
    clearBtn.classList.toggle('visible', !!hasActiveFilters());
    renderResults(getFilteredSorted());
  }),
);

clearBtn.addEventListener('click', () => {
  filterCat.value  = '';
  filterArea.value = '';
  sortSelect.value = '';
  syncUrlParams();
  clearBtn.classList.remove('visible');
  renderResults(getFilteredSorted());
});

// Mobile filter drawer
filterToggle?.addEventListener('click', () => {
  const open = filterBody.classList.toggle('open');
  filterToggle.setAttribute('aria-expanded', String(open));
});

/* ── Form submit ──────────────────────────────── */
form.addEventListener('submit', (e) => {
  e.preventDefault();
  doSearch(input.value);
});

/* ── Init ─────────────────────────────────────── */
updateNavBadge();
loadFilterOptions();

const initialQ = restoreFromUrl();
if (initialQ) doSearch(initialQ);

/* ── Utility ──────────────────────────────────── */
function esc(str) {
  return String(str || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}
