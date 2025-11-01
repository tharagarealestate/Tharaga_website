import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  test: {
    globals: true,
    environment: 'jsdom',
    css: true,
    include: ['lib/**/*.test.ts', 'components/**/*.test.tsx'],
    exclude: ['**/node_modules/**', '**/e2e/**', '**/tests/playwright/**', '**/app/__tests__/**'],
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './'),
    },
  },
});
