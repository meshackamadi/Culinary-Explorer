/**
 * @module favorites
 * Manage saved recipes in localStorage.
 * Key: "culinary-explorer-favorites"
 * Schema: { idMeal, strMeal, strMealThumb, strCategory, strArea, savedAt }
 */

const STORAGE_KEY = 'culinary-explorer-favorites';

/** @returns {Array} all saved favorites */
export function getFavorites() {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY)) || [];
  } catch {
    return [];
  }
}

/**
 * Save a recipe to favorites.
 * @param {{ idMeal:string, strMeal:string, strMealThumb:string, strCategory:string, strArea:string }} recipe
 */
export function addFavorite(recipe) {
  const favs = getFavorites();
  if (favs.some((f) => f.idMeal === recipe.idMeal)) return;
  favs.unshift({
    idMeal:       recipe.idMeal,
    strMeal:      recipe.strMeal,
    strMealThumb: recipe.strMealThumb,
    strCategory:  recipe.strCategory || '',
    strArea:      recipe.strArea || '',
    savedAt:      new Date().toISOString(),
  });
  localStorage.setItem(STORAGE_KEY, JSON.stringify(favs));
}

/**
 * Remove a recipe from favorites.
 * @param {string} idMeal
 */
export function removeFavorite(idMeal) {
  const favs = getFavorites().filter((f) => f.idMeal !== idMeal);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(favs));
}

/**
 * Check whether a recipe is currently favorited.
 * @param {string} idMeal
 * @returns {boolean}
 */
export function isFavorite(idMeal) {
  return getFavorites().some((f) => f.idMeal === idMeal);
}

/**
 * Toggle favorite state; returns new state (true = now favorited).
 * @param {{ idMeal:string, strMeal:string, strMealThumb:string, strCategory:string, strArea:string }} recipe
 * @returns {boolean}
 */
export function toggleFavorite(recipe) {
  if (isFavorite(recipe.idMeal)) {
    removeFavorite(recipe.idMeal);
    return false;
  }
  addFavorite(recipe);
  return true;
}

/** Return count of saved favorites. */
export function getFavoriteCount() {
  return getFavorites().length;
}
