import { defineConfig } from '@playwright/test';

export default defineConfig({
  testDir: './tests/playwright',
  timeout: 30 * 1000,
  retries: 0,
  use: {
    baseURL: process.env.PLAYWRIGHT_BASE_URL || 'http://localhost:4173',
    headless: true,
  },
  webServer: {
    command: 'npx sirv-cli . --single --port 4173',
    port: 4173,
    reuseExistingServer: true,
  },
});

