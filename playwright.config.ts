import { defineConfig } from '@playwright/test';

export default defineConfig({
  testDir: './tests/playwright',
  timeout: 30 * 1000,
  retries: 0,
  use: {
    baseURL: process.env.PLAYWRIGHT_BASE_URL || 'http://localhost:4173',
    headless: true,
  },
  outputDir: 'tmp/playwright',
  // Disable auto webServer because tests start their own static server
  webServer: undefined,
});

