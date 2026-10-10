export const RECIPES = [
  {
    id: 'chicken-spinach-skillet',
    title: 'Chicken and Spinach Skillet',
    ingredients: ['chicken', 'spinach', 'garlic', 'olive oil'],
    nutrition: { calories: 410, protein: 38, carbs: 8, fat: 24, fiber: 3 },
  },
  {
    id: 'lentil-tomato-stew',
    title: 'Lentil Tomato Stew',
    ingredients: ['lentils', 'tomato', 'onion', 'carrot'],
    nutrition: { calories: 330, protein: 18, carbs: 49, fat: 7, fiber: 14 },
  },
  {
    id: 'spinach-chickpea-curry',
    title: 'Spinach Chickpea Curry',
    ingredients: ['spinach', 'chickpeas', 'coconut milk', 'onion'],
    nutrition: { calories: 360, protein: 13, carbs: 39, fat: 18, fiber: 10 },
  },
  {
    id: 'garlic-lemon-salmon',
    title: 'Garlic Lemon Salmon',
    ingredients: ['salmon', 'garlic', 'lemon', 'olive oil'],
    nutrition: { calories: 420, protein: 34, carbs: 4, fat: 29, fiber: 1 },
  },
];

export function findRecipesByIngredient(ingredient) {
  const term = ingredient.trim().toLowerCase();
  if (!term) {
    return [];
  }

  return RECIPES.filter((recipe) =>
    recipe.ingredients.some((item) => item.toLowerCase().includes(term))
  );
}
