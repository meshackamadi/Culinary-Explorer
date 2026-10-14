import { defineConfig } from 'vite';
import { resolve } from 'path';

const __dirname = import.meta.dirname;

export default defineConfig({
  base: '/Culinary-Explorer/',
  root: '.',
  build: {
    outDir: 'dist',
    emptyOutDir: true,
    rollupOptions: {
      input: {
        main:      resolve(__dirname, 'index.html'),
        recipe:    resolve(__dirname, 'recipe.html'),
        favorites: resolve(__dirname, 'favorites.html'),
      },
    },
  },
  server: {
    port: 3000,
    open: true,
  },
});