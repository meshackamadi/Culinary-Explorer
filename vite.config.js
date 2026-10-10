import { defineConfig } from 'vite';
import { resolve } from 'path';

export default defineConfig({
    base: '/Culinary-Explorer/',
    root: '.',
    build: {
    outDir: 'dist',
    emptyOutDir: true,
    rollupOptions: {
      input: {
        main:  'index.html',
      },
    },
  },
  server: {
    port: 3000,
    open: true,
  },
});