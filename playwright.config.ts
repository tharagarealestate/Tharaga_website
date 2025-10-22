import { defineConfig } from '@playwright/test';

export default defineConfig({
  testDir: './tests/playwright',
  timeout: 30 * 1000,
  retries: 0,
  use: {
    baseURL: process.env.PLAYWRIGHT_BASE_URL || 'http://localhost:43217',
    headless: true,
  },
  outputDir: 'tmp/playwright',
  // Start a lightweight static server for tests automatically
  webServer: {
    command: 'npx http-server -p 43217 -a 127.0.0.1 -c-1 .',
    port: 43217,
    reuseExistingServer: true,
    timeout: 120000,
  },
});

