/**
 * @module ingredientParser
 * Utilities for extracting and formatting ingredients from TheMealDB meal objects.
 */

/**
 * Parse all ingredients from a TheMealDB meal object.
 *
 * TheMealDB stores ingredients as strIngredient1…strIngredient20 and
 * matching measures as strMeasure1…strMeasure20.
 * Entries that are null, empty, or whitespace-only are skipped.
 *
 * @param {Object} meal - Raw meal object from TheMealDB API
 * @returns {Array<{ingredient: string, measure: string}>}
 *
 * @example
 * const meal = { strIngredient1: 'Chicken', strMeasure1: '200g',
 *                strIngredient2: '',        strMeasure2: '' };
 * parseIngredients(meal);
 * // => [{ ingredient: 'Chicken', measure: '200g' }]
 *
 * /*
 * TEST CASES
 * ----------
 * 1. Standard entry:
 *    Input:  { strIngredient1: 'Garlic', strMeasure1: '3 cloves' }
 *    Expect: [{ ingredient: 'Garlic', measure: '3 cloves' }]
 *
 * 2. Skip null ingredient:
 *    Input:  { strIngredient1: null, strMeasure1: '1 cup' }
 *    Expect: []
 *
 * 3. Skip whitespace-only ingredient:
 *    Input:  { strIngredient1: '   ', strMeasure1: '1 tbsp' }
 *    Expect: []
 *
 * 4. Missing measure defaults to empty string:
 *    Input:  { strIngredient1: 'Salt', strMeasure1: null }
 *    Expect: [{ ingredient: 'Salt', measure: '' }]
 *
 * 5. Full 20-item scan — only populated entries returned:
 *    Input:  { strIngredient1: 'Onion', strMeasure1: '1',
 *              strIngredient2: 'Tomato', strMeasure2: '2',
 *              strIngredient3: '', strMeasure3: '',
 *              ...strIngredient4..20 all null }
 *    Expect: length === 2
 * *\/
 */
export function parseIngredients(meal) {
  const result = [];
  for (let i = 1; i <= 20; i++) {
    const ingredient = meal[`strIngredient${i}`];
    const measure    = meal[`strMeasure${i}`];
    if (!ingredient || !ingredient.trim()) continue;
    result.push({
      ingredient: ingredient.trim(),
      measure:    measure ? measure.trim() : '',
    });
  }
  return result;
}

/**
 * Format an ingredient array into a single comma-separated query string
 * suitable for the CalorieNinjas nutrition API.
 *
 * @param {Array<{ingredient: string, measure: string}>} ingredients
 * @returns {string} e.g. "3/4 cup soy sauce, 200g chicken, 1 tbsp olive oil"
 *
 * @example
 * formatIngredientsForApi([
 *   { ingredient: 'chicken breast', measure: '200g' },
 *   { ingredient: 'olive oil',      measure: '1 tbsp' },
 * ]);
 * // => "200g chicken breast, 1 tbsp olive oil"
 */
export function formatIngredientsForApi(ingredients) {
  return ingredients
    .map(({ ingredient, measure }) => {
      const m = measure ? measure.trim() : '';
      const i = ingredient.trim();
      return m ? `${m} ${i}` : i;
    })
    .join(', ');
}

/**
 * Build the thumbnail URL for a given ingredient name (TheMealDB CDN).
 * @param {string} name
 * @returns {string}
 */
export function ingredientThumbUrl(name) {
  const encoded = encodeURIComponent(name.toLowerCase().replace(/\s+/g, '_'));
  return `https://www.themealdb.com/images/ingredients/${encoded}-Small.png`;
}
