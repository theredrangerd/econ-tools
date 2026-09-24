import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    environment: 'jsdom',
  },
  build: {
    rollupOptions: {
      input: {
        main: 'index.html',
        wip: 'units/wip.html',
      },
    },
  },
});
