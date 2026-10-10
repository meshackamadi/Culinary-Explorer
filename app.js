import { findRecipesByIngredient } from './src/recipeSearch.js';

const form = document.getElementById('ingredient-form');
const input = document.getElementById('ingredient-input');
const message = document.getElementById('results-message');
const resultsContainer = document.getElementById('results');

function renderRecipes(recipes, searchedIngredient) {
  resultsContainer.innerHTML = '';

  if (!searchedIngredient.trim()) {
    message.textContent = 'Enter an ingredient to discover matching recipes.';
    return;
  }

  if (!recipes.length) {
    message.textContent = `No recipes found for "${searchedIngredient}".`;
    return;
  }

  message.textContent = `Found ${recipes.length} recipe${recipes.length === 1 ? '' : 's'} for "${searchedIngredient}".`;

  recipes.forEach((recipe) => {
    const card = document.createElement('article');
    card.className = 'recipe-card';

    card.innerHTML = `
      <h2>${recipe.title}</h2>
      <p><strong>Ingredients:</strong> ${recipe.ingredients.join(', ')}</p>
      <h3>Nutrition (per serving)</h3>
      <ul>
        <li>Calories: ${recipe.nutrition.calories} kcal</li>
        <li>Protein: ${recipe.nutrition.protein} g</li>
        <li>Carbs: ${recipe.nutrition.carbs} g</li>
        <li>Fat: ${recipe.nutrition.fat} g</li>
        <li>Fiber: ${recipe.nutrition.fiber} g</li>
      </ul>
    `;

    resultsContainer.appendChild(card);
  });
}

form.addEventListener('submit', (event) => {
  event.preventDefault();
  const searchedIngredient = input.value;
  const matches = findRecipesByIngredient(searchedIngredient);
  renderRecipes(matches, searchedIngredient);
});

renderRecipes([], '');
