# Culinary-Explorer

Culinary Explorer is a lightweight web app that helps home cooks discover recipes using ingredients they already have and instantly view a nutrition breakdown for each recipe.

## Features

- Search recipes by a main ingredient (for example: `chicken`, `lentils`, `spinach`)
- View matched recipes without needing a dish name
- See nutrition facts per serving (calories, protein, carbs, fat, fiber) before cooking

## Run locally

```bash
npm install
npm run dev
```

Nutrition works out of the box with a local estimate. To enable the optional
CalorieNinjas result source, copy `.env.sample` to `.env` and set
`VITE_CALORIE_NINJAS_KEY`. The app falls back to the local estimate when the
service is unavailable, rate-limited, or not configured.

## Build and deploy

```bash
npm run build
```

The included GitHub Actions workflow deploys the `dist` folder to GitHub Pages
on pushes to `main`. No API secret is required for the default deploy path.
