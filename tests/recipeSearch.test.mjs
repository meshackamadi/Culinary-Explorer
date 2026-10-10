import test from 'node:test';
import assert from 'node:assert/strict';
import { findRecipesByIngredient } from '../src/recipeSearch.js';

test('finds recipes by ingredient', () => {
  const matches = findRecipesByIngredient('spinach');
  assert.equal(matches.length, 2);
  assert.ok(matches.every((recipe) => recipe.ingredients.includes('spinach')));
});

test('matches are case-insensitive and trimmed', () => {
  const matches = findRecipesByIngredient('  CHICKEN  ');
  assert.equal(matches.length, 1);
  assert.equal(matches[0].title, 'Chicken and Spinach Skillet');
});

test('returns empty array for empty ingredient', () => {
  const matches = findRecipesByIngredient('   ');
  assert.deepEqual(matches, []);
});
